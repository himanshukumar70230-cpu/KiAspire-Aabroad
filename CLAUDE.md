# Ki Aspire Abroad — Project Context

This file is auto-loaded by Claude Code at the start of every session in this repo. It holds the durable ground truth for the project so it doesn't need to be re-pasted per task.

## Stack & deployment constraint

Current stack: plain HTML/CSS/JS frontend + Node/Express backend. This is being deployed to **shared hosting (HostingRaja, Silver plan)**, which uses cPanel's Node.js Selector (CloudLinux Passenger). Hard constraint: the final app must run as a **single Node.js process that also serves the static frontend** via `express.static()` — no separate static file server, no separate build/serve step at runtime. The app must listen on `process.env.PORT` (Passenger injects this), not a hardcoded port.

## Ground rule

Do not silently assume anything that is a business decision rather than a technical one (exact copy wording, whether a field is required, scope calls). If genuinely ambiguous, stop and ask instead of guessing. Technical implementation choices (schema shape, file structure, library choice) are yours to make — just state the choice and reasoning.

## Business context

**Services offered** (selectable at registration): Study Abroad, Book a Consultation, Test Prep (IELTS/TOEFL/GRE), Career Counselling, Loan / Financial Assistance.

**Dynamic registration fields**: each service (except Book a Consultation) has its own set of registration-form fields, and *which fields belong to which service must be configurable from the admin panel* — not hardcoded per service in the frontend. Model this as a generic "service → ordered field definitions" system (field type, label, options, required flag). Study Abroad's fields must at minimum support: destination country, and a ranked/ordered list of preferred universities.

**Book a Consultation**: selecting this redirects the student to `https://cal.com/code-knight-debjit/discovery-call` instead of collecting service-specific fields.

**Accounts**: students register via "Get Started" and log back in via a separate **Login** page — two distinct entry points. Auth: email + password, properly hashed.

**Student dashboard**: logged-in students see their application progress. Progress is set only from the admin panel by staff, never self-reported. Our actual business workflow (basis for the progress data model — group into a student-friendly view, keep full granularity on the admin side):

```
Lead Workflow: Lead Captured (Website/Social/Referral/Walk-in) → Counsellor Assigned → Follow-ups & Counselling → Interested? (No → Closed / Yes → Student Profile Created)

Profile & Planning: Create Student Profile → Academic Details & Records → Test Scores (IELTS/TOEFL/GRE/GMAT) → Preferences (Country, Course, Intake, Budget) → Shortlist Universities & Courses → Application Plan & Checklist

Application Process: Select University & Course → Prepare & Review Documents → Submit Application → Under Review → Receive Offer (Conditional/Unconditional) → Accept Offer & Pay Fees

Visa & Pre-Departure: Start Visa Process → Upload Visa Documents → Book Visa Appointment → Visa Interview (if required) → Visa Decision → Pre-Departure Guidance → Travel & Fly to Country

Post-Arrival Support: Student Arrives → Airport Pickup (if applicable) → Accommodation Support → University Onboarding → Ongoing Support & Testimonial
```

**Admin-editable content** (must live in DB, editable without a code change/redeploy):
- "Study Abroad for Free" section: country write-ups on tuition-free/low-cost public higher ed. Launches with real content for **Germany public universities only**; structure it so more countries can be added purely from the admin panel later.
- About page stats: **40+ countries** and **200+ universities** — editable numbers, not hardcoded text.

**About page copy rule**: must NOT mention "No commission" anywhere (remove if present). Must mention 40+ countries and 200+ universities. Must clearly and prominently mention that we provide **VISA support for students** — a real value proposition, not a buried line.

**Database**: cPanel shared hosting universally bundles MySQL via the cPanel MySQL Database Wizard. Default to MySQL unless a repo audit finds something else already configured — don't reach for MongoDB/Atlas here, it adds an external dependency shared hosting doesn't need.

**Brand assets**: colour palette and logo are mid-redesign — treat anything currently in the repo as provisional. Use CSS variables/design tokens so the palette is a one-place swap later.

## Working style

This project is being built in phases, one phase per session message (see phase prompts given separately). Only do the phase asked for in the current message — do not jump ahead to later phases even if it seems efficient. End each phase by summarizing what changed and stating you're ready for the next phase, rather than continuing on your own.
