# Repository Audit — Phase 0

Date: 2026-07-27
Branch: `dev`

## 1. Structure & how the Express server is wired up

**Two separate `package.json`s, and they don't agree with each other:**

- Root `package.json` (`/package.json`): `"start": "node app.js"` — **`app.js` does not exist anywhere in the repo.** It also declares no `dependencies` at all. This file appears to be a stale/empty shell, not the real entry point.
- `backend/package.json`: the real app. `"start": "node index.js"`, `"dev": "nodemon index.js"`. Dependencies: `express`, `mongoose`, `mongodb`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, `validator`.

**Actual entry point:** `backend/index.js`.
- Plain Express (no templating engine — pure JSON API).
- Routing style: modular `express.Router()` files under `backend/Routes/` (`userRoute.js`, `adminRoute.js`, `serviceRoute.js`, `storyRoute.js`), mounted at `/api/user`, `/api/admin`, `/api/services`, `/api/story`.
- Controller/model/middleware split: `backend/controllers/`, `backend/models/`, `backend/middlewares/`, `backend/utils/`.
- CORS is wide open: `origin: "*"`.
- Listens on `process.env.PORT || 3000` — **already compliant** with the Passenger-injected-port requirement.
- `app.get("/")` just returns a plaintext "API is running..." string.

**⚠️ Hard constraint gap:** `backend/index.js` has **no `express.static()` call anywhere** and never serves anything from `frontend/`. Confirmed by `frontend/api.js`, which hardcodes:
```js
const API_BASE = 'https://kiaspire-aabroad.onrender.com/api';
```
So today, frontend and backend are **two separately deployed services** (static frontend somewhere + API on Render). This is the opposite of the required single-Node-process-serves-everything model for the HostingRaja/cPanel target, and is the biggest structural change Phase 1+ will need to make.

**Frontend structure** (`frontend/`): flat, no build step — `index.html`, `about.html`, `services.html`, `register.html`, `stories.html`, `story-detail.html`, `thank-you.html`, `404.html`, `countryPages/*.html` (per-country pages: australia, canada, dubai, germany, singapore, uk, us), `admin/*.html` + `admin.js` (separate admin SPA-ish pages), shared `script.js`, `style.css`, `api.js`, `Logo.webp`.

**Stray non-Node artifacts committed inside `backend/`:** a full Laravel/PHP scaffold — `backend/vendor/` (composer packages), `backend/bootstrap/cache/*.php`, `backend/storage/logs/laravel.log`, `backend/.env.php`. None of this is referenced by `index.js` or any `require()` — it looks like leftover scaffolding from an unrelated/earlier experiment, not part of the running app. Flagging rather than deleting — will confirm before removing.

Also at repo root: `dev-branch-bugfixes.patch` (tracked in git, unclear if still needed) and an empty `README.md`.

## 2. Database

**MongoDB (via Mongoose) is already fully wired up** — this is a direct conflict with CLAUDE.md's default-to-MySQL-on-shared-hosting guidance, so flagging rather than silently picking one:

- `backend/config/db.js` connects via `mongoose.connect(process.env.MONGO_URL)`.
- Three models exist: `User` (`backend/models/userModel.js`), `Service` (`serviceModel.js`), `Story` (`storyModel.js`).
- `backend/.env.example` (tracked in git) contains a MongoDB **Atlas** connection string: `mongodb+srv://codeknightdebjit_db_user:pass@cluster0.7gqpmfz.mongodb.net/...`. Password segment is literally `pass`, so likely already a placeholder — worth a quick glance to make sure nothing more sensitive ever landed in git history.
- `backend/.env` (gitignored, present locally only) has fully redacted placeholder values (`MONGO_URL=mongodb://127.0.0.1:27017`, secrets shown as `xxxx`).

**Decision needed from you:** keep MongoDB Atlas (external dependency, already built against it, extra moving part on a shared-hosting deploy) vs. migrate to MySQL (fits the cPanel/HostingRaja environment natively per CLAUDE.md's stated default, but means rewriting all three models + queries from Mongoose to SQL). This is a technical-but-consequential enough call that I want your steer before Phase 1 touches the data layer.

## 3. Admin panel, auth, session handling

**Admin side is real and working:**
- JWT auth (`jsonwebtoken`) + `bcryptjs` password hashing.
- `backend/middlewares/authMiddleware.js`: `protect` (verifies JWT, loads user, checks `isActive`) and `adminOnly` (role check).
- `backend/controllers/adminController.js`: login, get profile, list/get/activate-deactivate/delete users.
- `backend/utils/defaultAdmin.js`: auto-seeds one admin user from `ADMIN_*` env vars on server boot if it doesn't already exist.
- `User` model has a `role` enum (`user` / `admin` / `counsellor`), `isActive`, `lastLogin`, and the password field is `select:false` plus stripped again in a `toJSON` transform (defense in depth against leaking the hash).
- Frontend: `frontend/admin/` has `login.html`, `dashboard.html`, `profile.html`, `services.html`, `stories.html`, `users.html`, `user-detail.html`, all gated client-side by `admin.js` (checks `KiAspireAPI.isLoggedIn()` via a token in `localStorage`, redirects to `login.html` if absent).

**⚠️ Student-facing auth does not exist yet.** This is a real gap against CLAUDE.md's requirement of email+password student accounts with a separate Login page:
- `backend/Routes/userRoute.js` only exposes `POST /register` — there is no student login route, no password-check endpoint, nothing that issues a student a token.
- `backend/controllers/userController.js`'s `createUser` only accepts/validates `name`, `email`, `phone` — **it never reads or sets a password at all**, even though the `User` schema has a `password` field (which itself is not `required`, presumably because it's currently unused for students).
- `frontend/register.html` is a plain 3-field form (name/email/phone) calling `registerUser({name, email, phone})` — no password field, no service selector, no dynamic per-service fields, no `cal.com` redirect for "Book a Consultation" (it just submits the same generic form).
- No student dashboard page exists in `frontend/` at all yet.

**Not yet modeled (expected — these are later-phase work, just confirming they're not secretly half-built):**
- No dynamic "service → ordered field definitions" system — `Service` model is just `name/slug/description/icon/isActive/sortOrder`, no configurable fields array.
- No progress/workflow data model on `User` (or elsewhere) reflecting the Lead → Profile → Application → Visa → Post-Arrival pipeline from CLAUDE.md.
- No DB-backed model for "Study Abroad for Free" country write-ups or About-page stats (40+/200+) — see below, these are currently hardcoded HTML.

## 4. Brand assets currently committed

- **Colours:** already CSS custom properties in `frontend/style.css` (`:root`) — `--ivory`, `--ivory-deep`, `--ink`, `--ink-soft`, `--pine` (+ deep/mid variants), `--brass` (+ light/deep/pale variants), `--blue` (+ deep), plus `--line` tokens. This is already in the "one-place swap later" shape CLAUDE.md asks for, so no rework needed there, just a values swap whenever the redesign lands.
- **Fonts:** Google Fonts, loaded via `<link>` in HTML heads — `Newsreader` (serif, used as `--font-display`) and `Archivo` (sans, `--font-body`).
- **Logo:** single file, `frontend/Logo.webp`, referenced directly (e.g. `<img src="Logo.webp">` in `index.html`).
- No dark-mode/theme toggle; one palette only. Confirmed provisional per your note — flagging nothing further here.

## 5. About page — "No commission" check

**Present — needs removal per your ground rule.** Found in `frontend/about.html`:
- Line 57: "...students pushed toward whichever university paid the largest commission..." (describing the industry problem it positions against).
- Line 61: **"No commission-based university steering — ever."** (explicit bullet point).
- Line 85: "Not applications submitted, not commissions earned — offers converted into visas..."

All three will need rewriting in whatever phase touches About-page copy.

**Stats:** currently hardcoded as "500+ students placed across 18 countries" (line 60) — does **not** match the required 40+ countries / 200+ universities figures, and isn't sourced from any DB field yet (no about-stats model exists).

**VISA support:** mentioned, but only woven narratively into paragraphs ("a visa strategy that starts on day one," "sees you through your visa interview") rather than called out as its own clear, prominent value-prop — will need a more deliberate treatment to satisfy "clearly and prominently."

## Summary of open decisions for you (not guessing on these)

1. **Database engine:** stay on MongoDB Atlas (already built) or migrate to MySQL (fits shared hosting natively, per CLAUDE.md default)?
2. **Stray Laravel/PHP scaffold** in `backend/` (`vendor/`, `bootstrap/`, `storage/`, `.env.php`) — confirm OK to remove once we're actively working in `backend/`, since it appears unused.
3. **Root vs. `backend/` package.json** — the eventual single-process cPanel deploy needs one real entry point; right now there are two divergent `package.json`s and a `start` script pointing at a nonexistent `app.js`. Reconciling this is a structural decision for whichever phase handles deployment wiring.

No code was changed in this phase — audit only.
