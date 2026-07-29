# Architecture & Data Model — Phase 1

Date: 2026-07-27
Builds on: `AUDIT.md`, `CLAUDE.md`
Status: design only — no implementation in this phase.

## 0. Database & tooling decision

**Database: PostgreSQL** (confirmed available on the HostingRaja Silver cPanel plan). This supersedes the MongoDB/Mongoose setup found in `AUDIT.md` — the three existing Mongoose models (`User`, `Service`, `Story`) will be redesigned as relational Postgres tables below; migrating the existing data/code is Phase-2+ work, not done here.

**Query layer: Knex.js + `pg`** (not a full ORM like Prisma/Sequelize/TypeORM).
- No code-generation or build step — Prisma in particular needs `prisma generate` and platform-matched native engine binaries, which is friction-prone on a cPanel Node Selector environment and conflicts with the "no separate build/serve step at runtime" constraint.
- `pg` has no native bindings (pure JS), so nothing to compile on the host.
- Knex gives us a migration runner (`knex migrate:latest`) and a query builder without hiding the SQL, which suits a small, mostly-CRUD app better than a heavier ORM's abstraction cost.
- Migrations run explicitly (a deploy step / npm script), not auto-synced on every app boot — Passenger can spin up multiple worker processes, and auto-sync-on-boot risks concurrent schema-mutation races.

**Primary key strategy:**
- `UUID` (via Postgres `pgcrypto`'s `gen_random_uuid()`) for tables whose rows are referenced by an actual person and could appear in a URL or be worth hiding the count of: `users`, `applications`. Sequential integers here would let one user enumerate how many students/applications exist, or guess at adjacent IDs in an admin URL.
- Plain `serial`/`bigserial` integers for admin-only configuration/lookup tables where enumeration isn't a meaningful risk: `services`, `service_fields`, `pipeline_stages`, `application_stage_history`, `free_study_countries`. `site_settings` is keyed by a text `key` instead of a surrogate ID.

**Auth session model stays stateless JWT** (as already built for admin): bcrypt-hashed passwords, JWT bearer tokens, no server-side session store. This is a good fit independent of the DB swap — Passenger can restart/recycle worker processes, and an in-memory or sticky session store would lose state across that; a stateless token doesn't.

---

## 1. Service → dynamic field-definition system

Two tables: one for the service itself (including how it behaves), one for its ordered field definitions.

### `services`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| name | text, unique | |
| slug | text, unique | |
| description | text | |
| icon | text | |
| **kind** | enum: `form` \| `external_redirect` | drives behavior — see below |
| **redirect_url** | text, nullable | required when `kind = external_redirect` |
| is_active | boolean | |
| sort_order | int | |
| created_at / updated_at | timestamptz | |

`kind` + `redirect_url` replace hardcoding "if this is Book a Consultation" anywhere in code. Today only one service (Book a Consultation → cal.com) needs `external_redirect`, but making it data-driven means the behavior lives in admin-configured data, not in an `if (slug === 'book-a-consultation')` check — consistent with CLAUDE.md's requirement that service configuration live in the admin panel, and it means a future "redirect straight to a partner site" service doesn't need a code change either.

### `service_fields`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| service_id | FK → services.id, cascade delete | |
| field_key | text | machine name, e.g. `destination_country`; unique per `(service_id, field_key)` |
| label | text | student-facing label |
| field_type | enum: `text` \| `textarea` \| `number` \| `date` \| `select` \| `radio` \| `checkbox` | base input type |
| **allow_multiple** | boolean, default false | field accepts more than one value |
| **is_ordered** | boolean, default false | only meaningful when `allow_multiple = true`; values are stored/rendered in the order the student entered them |
| options | jsonb, nullable | array of `{label, value}`, used by `select`/`radio`/`checkbox` |
| is_required | boolean | |
| placeholder | text, nullable | |
| help_text | text, nullable | |
| sort_order | int | display order within the service's form |
| **deleted_at** | timestamptz, nullable | soft delete — see rationale below |
| created_at / updated_at | timestamptz | |

**Why `allow_multiple` + `is_ordered` instead of a one-off "ranked list" type:** Study Abroad's mandatory "ranked/ordered list of preferred universities" is just `field_type = text, allow_multiple = true, is_ordered = true` — a plain repeatable, reorderable text input. Modeling it as two booleans on any field (rather than inventing a bespoke `ranked_list` enum value) means the same mechanism is reusable if some other service later needs a multi-value or ordered field, without a schema change. "Destination country" is a plain `select` (single value) with `options` seeded from a supported-country list.

**Why soft-delete (`deleted_at`) instead of hard delete:** submitted answers are stored keyed by `field_key` (see `applications.field_values` below). If admin edits a service's fields later and a field is hard-deleted, historical applications still have data under that key but nothing left to say what it meant or how to render it. Soft-deleting keeps the label/type available for rendering old submissions while hiding the field from new registrants.

Note on scope: CLAUDE.md mandates only that Study Abroad supports destination country + ranked universities at minimum. The full field set for each service (exact copy, which fields beyond the minimum, options lists) is a content/business decision for whoever configures the admin panel later — not something to invent here.

Explicitly not building: a master `universities` reference table (name/country/ranking/etc.) for students to pick from. Nothing in the brief asks for a searchable partner-university catalog — the "200+ universities" figure is a plain editable stat (`site_settings`, below), and "preferred universities" is satisfied by free-text ordered entries. A curated university catalog is a bigger, unrequested feature; flagging it as a possible future enhancement rather than building it speculatively now.

---

## 2. Accounts & auth

### `users`
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| name | text | |
| email | citext, unique | |
| phone | text, unique | |
| **password_hash** | text, **nullable** | see rationale below |
| role | enum: `student` \| `counsellor` \| `admin` | |
| is_active | boolean | |
| last_login | timestamptz, nullable | |
| created_at / updated_at | timestamptz | |

**Why `password_hash` is nullable:** it lets the same `users` row represent someone who currently exists only as a lead (e.g. booked a consultation, gave name/email/phone, nothing more) and someone with full login access. A `NULL` password hash means "cannot log in yet." If that same person later completes a full registration with the same email, we update the existing row (set the password, keep their history) instead of creating a duplicate identity. This directly serves the Lead Workflow, where a "lead" and a "student" are the same person at different points, not different entities.

Two frontend entry points as required (`register.html` / a new student `login.html`), backed by two backend routes on the existing pattern (`/api/user/register`, new `/api/user/login`) rather than one merged endpoint — this mirrors how `/api/admin/login` already exists separately, keeps the "distinct entry points" framing visible in the API shape, and avoids a single endpoint silently branching behavior by role. All three (`student`, `counsellor`, `admin`) share one `users` table and one JWT scheme (role is a JWT claim, as it already is for admin) — no reason to fork auth mechanics by role when only *authorization* differs.

Frontend token storage follows the existing `frontend/api.js` pattern (separate `localStorage` keys, e.g. `kiaspire_student_token` vs the existing `kiaspire_admin_token`) so a browser logged into both a student and admin session don't clobber each other.

---

## 3. Application & progress-tracking model

One submission (whether a full Study Abroad application or a lightweight consultation lead) is one row in `applications`. Terminology note: the table is named after "an application" in the generic/CRM sense (a student's engagement with a service) — it spans all five workflow phases, one of which is also *called* "Application Process"; the phase enum values below are prefixed distinctly to avoid confusion between the table and that one phase.

### `pipeline_stages` (seed/reference data — not admin-editable in v1)
| column | type | notes |
|---|---|---|
| id | serial PK | |
| phase | enum: `lead` \| `profile_planning` \| `application_process` \| `visa` \| `post_arrival` | the 5 groups shown to students |
| code | text, unique | stable key, e.g. `counsellor_assigned` |
| label | text | staff-facing granular label (all ~24 steps from CLAUDE.md's workflow) |
| student_label | text | simplified label shown on the student dashboard for this stage's phase |
| sort_order | int | master sequence across all phases |

This is a seeded lookup table, not a code-level enum, so the exact step wording/order can be adjusted with a data migration instead of an app redeploy — but it is **not** exposed as an admin-editable UI in this phase, since CLAUDE.md only asks for the two specific content items in section 4 to be admin-editable, not the workflow taxonomy itself.

### `applications`
| column | type | notes |
|---|---|---|
| id | UUID PK | |
| user_id | FK → users.id | |
| service_id | FK → services.id | |
| field_values | **jsonb**, nullable | submitted dynamic answers, keyed by `service_fields.field_key`; multi-value/ordered fields stored as JSON arrays preserving entry order |
| current_stage_id | FK → pipeline_stages.id | fast-path "where is this application right now" |
| current_stage_since | timestamptz | |
| is_closed | boolean, default false | the "Interested? → No" branch |
| closed_reason | text, nullable | |
| closed_at | timestamptz, nullable | |
| created_at / updated_at | timestamptz | |

**Why `field_values` is JSONB, not a fully normalized EAV values table:** field *definitions* (`service_fields`) are relational and admin-editable — that structure matters. Submitted *answers* are always read and displayed as a whole per application (admin detail view, student's own record) and nothing in the brief requires querying/filtering applications by an individual answer's value at the database level. A normalized values table would add join complexity for no present benefit; Postgres JSONB can still be indexed (GIN) or queried later if that need appears, without a schema change now.

**Why current-stage-as-a-column *and* a separate history table:** admin needs to see "where is this application now" cheaply (one FK lookup) on every list view, but also needs the full granular audit trail — who advanced a lead to which stage, when, and why — which a single mutable column can't hold.

### `application_stage_history`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| application_id | FK → applications.id | |
| stage_id | FK → pipeline_stages.id | |
| note | text, nullable | staff note on why/what changed, e.g. "conditional offer received" |
| changed_by | FK → users.id | which staff member made the change |
| changed_at | timestamptz | |

Every stage change (always staff-initiated per CLAUDE.md — "never self-reported") inserts one row here and updates `applications.current_stage_id`/`current_stage_since` in the same transaction.

**Student dashboard view:** reads only `applications.current_stage_id` → joins `pipeline_stages` → shows the 5-phase grouped progress bar using `phase` + `student_label`, with the current phase highlighted. No access to `application_stage_history`, staff notes, or `changed_by` — that detail stays admin-only.

**Admin view:** full `application_stage_history` timeline per application, plus the ability to insert a new row (advance/move the stage) with an optional note.

---

## 4. Admin-editable content model

### 4a. "Study Abroad for Free" — `free_study_countries`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| country_name | text | |
| country_slug | text, unique | |
| summary | text | short teaser for a list/card view |
| **content_markdown** | text | long-form write-up, authored as Markdown |
| hero_image_url | text, nullable | |
| is_published | boolean | lets admin draft a country before it's publicly visible |
| sort_order | int | |
| created_at / updated_at | timestamptz | |

**Why Markdown, not raw HTML:** storing admin-authored raw HTML and rendering it directly is a stored-XSS vector the moment more than one trusted person has admin access, or an admin account is ever compromised. Markdown source is rendered to HTML (and sanitized) at request time — same authoring flexibility (headings, links, bold, lists), much smaller attack surface, and the source stays portable if the content system changes later.

Launches with one row (Germany, `is_published = true`); adding a country is purely a new row from the admin panel, no code change — satisfies "structure it so more countries can be added purely from the admin panel later."

### 4b. About page stats — `site_settings`
| column | type | notes |
|---|---|---|
| key | text, PK | e.g. `about_countries_count` |
| value | text | e.g. `"40+"` |
| label | text | admin-facing description of what this controls |
| updated_at | timestamptz | |

**Why a generic key/value table instead of two dedicated columns somewhere:** this is a flat, low-complexity table (not a speculative abstraction) that avoids a schema migration every time the business asks to make one more hardcoded marketing number editable — which is realistic for a site whose stats will keep changing. Seeded with exactly the two rows CLAUDE.md asks for (`about_countries_count = "40+"`, `about_universities_count = "200+"`), nothing more speculative added.

**Why `value` is stored as text, not an integer:** the displayed copy is the literal string "40+", "+" included — storing it as text means the frontend renders it verbatim and admin can change it to "45+" or "40" without any code caring which.

**Explicitly out of scope for this data model:** the About page's narrative copy fixes flagged in `AUDIT.md` — removing the "No commission" language and making VISA support more prominent — are static copy edits, not data-driven content. CLAUDE.md doesn't ask for that prose to be admin-editable from the DB, only the two stat numbers. Those copy fixes belong in whichever later phase touches About-page HTML directly.

---

## 5. Book a Consultation: capture-then-redirect (decision)

**Decision: capture name + email (+ phone) first, create a lead record, then redirect to cal.com with `name`/`email` prefilled via query params.** Not an immediate redirect.

**Reasoning:**
- CLAUDE.md's own Lead Workflow starts with *"Lead Captured (Website/Social/Referral/Walk-in) → Counsellor Assigned → Follow-ups..."*. A consultation booking click is exactly a lead-capture event in that model. An immediate redirect with zero data captured on our side means that lead is invisible to the CRM/admin panel entirely — no counsellor can be assigned, no follow-up is possible if the student opens Cal.com but never actually finishes booking there, and the business loses visibility into its own consultation-request volume. That directly undermines the workflow CLAUDE.md documents as the basis for the whole progress model.
- The friction cost is minimal: Cal.com's own booking form is going to ask the student for name and email seconds later anyway. We're not asking for anything new, just capturing it a few seconds earlier so it lands in our system first.
- Prefilling cal.com via query params (`?name=...&email=...`) turns the "extra step" into a small UX win instead of a pure cost — the student doesn't have to retype what they just gave us.
- No password is collected for this path, and no service-specific fields are shown (per CLAUDE.md's explicit instruction for this service) — this is the `users.password_hash IS NULL` lead case from section 2: creates/finds a `users` row and one `applications` row (`service_id` = Book a Consultation, `field_values = NULL`, `current_stage_id` = the first `lead` stage), then redirects. If that same person later fully registers for an actual service with the same email, they become a full account on the existing row rather than a duplicate.

---

## 6. Summary of tables

`services`, `service_fields`, `users`, `pipeline_stages`, `applications`, `application_stage_history`, `free_study_countries`, `site_settings` — 8 tables total, replacing the 3 existing Mongoose models.

## 6a. Addendum (Phase 2): `stories` table

Section 6 said "8 tables... replacing the 3 existing Mongoose models," but the table list above only accounts for 2 of those 3 (`User` → `users`, `Service` → `services`); the existing `Story` model (video testimonials, already live in `backend/models/storyModel.js` and used by `frontend/stories.html`/`story-detail.html`) was missed. Since Phase 2 does a full DB cutover, it needs a home too. Added as a 9th table, `stories`, mirroring the existing Mongoose shape (`student_name`, `country`, `university`, `course`, `title`, `description`, `youtube_url`, `thumbnail`, `is_featured`, `is_active`, `sort_order`, `created_by`) with no new functionality — this is a straight carry-over, not a redesign.

## 6b. Addendum (Phase 2): UUID generation and no DB extensions

Section 0 assumed `gen_random_uuid()` (the `pgcrypto` extension) for UUID primary keys. In practice, shared-hosting cPanel-provisioned Postgres accounts often don't have `CREATE EXTENSION` privilege (that typically needs superuser). To avoid depending on an extension that may not be enabled on the HostingRaja instance, UUIDs are generated in application code instead, via Node's built-in `crypto.randomUUID()` (no dependency, available natively), and passed explicitly on insert rather than relying on a column default. Columns are still native Postgres `uuid` type — just no server-side default. Likewise, `citext` (mentioned for case-insensitive email) is skipped in favor of the existing app-layer convention of always lowercasing email before it touches the database — same effective behavior, zero extension dependency.

## 7. Explicitly not decided/built in this phase

- Actual Knex migration files / SQL DDL — this phase is schema *design*, not implementation.
- Full seed field lists per service beyond Study Abroad's two mandated fields — that's admin-panel configuration content, a business decision for later.
- About-page narrative copy rewrite (No-commission removal, VISA prominence) — static HTML edit, separate from this data model.
- Master university catalog — intentionally not building; free-text ordered entry satisfies the stated requirement.
- Migration path for existing Mongo data (there's a seeded default admin and presumably some test data) — to be addressed when Phase 2+ actually implements the Postgres schema.
