# Deploying to HostingRaja (Silver plan) — cPanel Node.js Selector

This app is a single Node/Express process that serves both the API (`/api/*`)
and the entire static frontend (everything under `frontend/`) via
`express.static()`. There is no separate static file server and no build
step — that's a hard constraint of this hosting plan (see `CLAUDE.md`), and
`backend/index.js` already satisfies it: one `app.listen(process.env.PORT)`,
one `express.static()` call, nothing else runs alongside it.

**The deployable application root is `backend/`, not the repo root.**
`backend/index.js` serves the frontend via `path.join(__dirname, "..",
"frontend")`, so `frontend/` must remain a sibling directory of `backend/`
on the server — upload the whole repo, but point cPanel's "Application
Root" at the `backend` subfolder specifically (see Step 2).

---

## ⚠️ Before you start — things only your HostingRaja account can confirm

I can't see your cPanel account, so I'm not guessing at these. Check them
before or during setup rather than assuming the steps below match exactly:

1. **Node.js version ≥ 22.12.0 must be available in the Node.js Selector's
   version dropdown.** This isn't a preference — `sanitize-html` (used to
   render admin-authored Markdown safely) declares `engines.node: ">=
   22.12.0"` in its own `package.json`, which is a higher floor than
   Express, Knex, or `pg` need individually. If HostingRaja's Selector
   tops out below that, tell me — that's a real constraint, not a docs
   fix, and we'd need to either find an alternative to `sanitize-html` or
   confirm whether the version cap is actually enforced at runtime.
2. **A PostgreSQL Database Wizard exists in cPanel** (not just MySQL).
   Confirmed available on your account as of Phase 1 — worth a quick
   re-check now that you're actually in the panel, since Step 4 below is
   built entirely around it.
3. **The exact host/port Postgres listens on for your account.** Most
   cPanel Postgres installs use `localhost:5432`, but shared hosts
   sometimes run it on a non-default port or a different host. The
   PostgreSQL Database Wizard page or HostingRaja's own docs/support
   should confirm this — don't assume `localhost:5432` is correct without
   checking.
4. **SSH or cPanel Terminal access**, needed to run the one-time
   `npm run migrate` / `npm run seed` commands (Step 6). Silver-tier
   shared plans don't always include SSH. If yours doesn't, tell me and
   we'll figure out another way to run these (there isn't a safe way to
   auto-run migrations on every app boot — see `ARCHITECTURE.md` section 0
   for why — so we'd need a deliberate one-off alternative).
5. **Connection/process limits for the Silver plan** (LVE limits,
   max concurrent Postgres connections, memory cap). `backend/knexfile.js`
   currently pools up to 10 Postgres connections
   (`pool: { min: 0, max: 10 }`); if your plan's DB connection limit is
   lower than that, lower this number to match before it causes
   connection-refused errors under load.

---

## Step 1 — Upload the repository

Upload the whole repository to your hosting account (via Git, cPanel's
File Manager zip-upload, or `scp`/SFTP) — for example to
`~/kiaspire-aabroad/`. Do **not** upload `backend/node_modules/` — Step 3
installs dependencies fresh via cPanel's own Node version.

Confirm this layout on the server:

```
~/kiaspire-aabroad/
├── backend/
│   ├── index.js          ← startup file
│   ├── package.json
│   ├── knexfile.js
│   ├── migrations/
│   ├── seeds/
│   └── ...
└── frontend/
    ├── index.html
    ├── style.css
    ├── api.js
    └── ...
```

## Step 2 — Create the Node.js app in cPanel

In cPanel, open **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | Highest available ≥ 22.12.0 (see verification item #1) |
| Application mode | Production |
| Application root | `kiaspire-aabroad/backend` (path relative to your home directory — adjust if you uploaded somewhere else) |
| Application URL | Your domain or subdomain (e.g. `kiaspireaabroad.com`) |
| Application startup file | `index.js` |

Click **Create**. cPanel will generate a virtual environment for this app
and show you a command to "enter" it via SSH (only relevant if you have
SSH access — see Step 6).

## Step 3 — Set environment variables

Still on the app's config page in cPanel, add these under **Environment
Variables** (values from `backend/.env.example` — this file documents the
shape but is never itself uploaded with real values; the real secrets only
ever live in cPanel's interface):

| Name | Value |
|---|---|
| `DATABASE_URL` | `postgresql://<db_user>:<db_password>@<host>:<port>/<db_name>` — assembled from Step 4 |
| `JWT_SECRET` | A long random string, unique to production — do not reuse the dev value from `.env` |
| `JWT_EXPIRE` | `7d` (or your preferred session length) |
| `ADMIN_NAME` | Whatever name you want the seeded default admin account to have |
| `ADMIN_EMAIL` | The email for that default admin login |
| `ADMIN_PHONE` | The phone number for that default admin login |
| `ADMIN_PASSWORD` | A strong password — this account is created automatically on first boot (`backend/utils/defaultAdmin.js`) if no admin with this email exists yet |

**Do not add `PORT` here.** cPanel's Node.js Selector assigns and injects
`PORT` itself and proxies requests to it; `backend/index.js` already reads
`process.env.PORT` — setting it manually would fight with what cPanel
assigns.

Click **Save**.

## Step 4 — Create the PostgreSQL database

In cPanel, open **PostgreSQL Database Wizard** (see verification item #2):

1. **Create a database** — cPanel will prefix the name with your cPanel
   username (e.g. `youruser_kiaspire`).
2. **Create a database user** — set a strong password here; this is the
   `<db_password>` for `DATABASE_URL`. cPanel will similarly prefix the
   username (e.g. `youruser_kiaspire`).
3. **Add the user to the database** with **All Privileges**.
4. Note the host and port (verification item #3 — don't assume
   `localhost:5432`).
5. Go back to Step 3 and fill in `DATABASE_URL` with these real values,
   e.g.:
   ```
   postgresql://youruser_kiaspire:yourpassword@localhost:5432/youruser_kiaspire
   ```

## Step 5 — Install dependencies

Back on the Node.js app's page in cPanel, click **Run NPM Install**. This
runs `npm install` inside `backend/` using the Node version you selected
in Step 2, reading `backend/package.json`. Watch for errors here — this is
where a Node-version incompatibility (verification item #1) would first
surface.

## Step 6 — Run migrations and seed the database

This needs a way to run a one-off shell command inside the app's
environment — either the **Terminal** app in cPanel, or SSH (verification
item #4). cPanel's app page shows a command like:

```
source /home/youruser/nodevenv/kiaspire-aabroad/backend/22/bin/activate && cd /home/youruser/kiaspire-aabroad/backend
```

Run that first to enter the app's Node environment, then:

```
npm run migrate
npm run seed
```

`npm run migrate` creates all 9 tables (see `ARCHITECTURE.md`).
`npm run seed` populates the pipeline stages, the two About-page site
settings, the 5 named services (including Book a Consultation with its
`cal.com` redirect URL), and Study Abroad's two mandatory fields. All
seed files are idempotent (upsert-based) — safe to re-run later if needed.

## Step 7 — Start (or restart) the app

Back in **Setup Node.js App**, click **Restart**. cPanel will start
`backend/index.js` under Passenger, which will:
1. Attempt to connect to Postgres (`db.raw("select 1")`) — if this fails,
   the process logs the error and exits (see Troubleshooting below).
2. Create the default admin account if it doesn't already exist.
3. Start listening on the `PORT` cPanel assigned.

Visit your Application URL — you should see the actual homepage
(`frontend/index.html`), not a bare "API is running" message (that
placeholder route was removed once static serving was wired up).

**Restart the app after any change** to environment variables, uploaded
files, or a fresh `npm install` — cPanel does not do this automatically.

---

## Troubleshooting a 503

Open **Setup Node.js App** → your app → the log viewer (or check
`stderr.log`/`stdout.log` in the application root if cPanel writes them
there instead). The three most likely causes, in the order I'd check them:

**1. Wrong startup file path.** If "Application root" and "Application
startup file" don't combine to point at the real `backend/index.js` (e.g.
Application root was set to the repo root instead of `backend/`, or the
startup file was left as the cPanel default), Passenger can't find
anything to run at all. The log usually shows a file-not-found error
immediately on start. Fix: re-check Step 2's Application Root value
against where you actually uploaded the repo.

**2. Not listening on `process.env.PORT`.** Already correct in this
codebase (`backend/index.js` line ~59) — but if this ever regresses (e.g.
someone hardcodes a port during local testing and it ships), Passenger
proxies to a port nothing is listening on and every request 503s with no
useful error in the app log itself, since the app "succeeds" from its own
point of view. If the log shows the app started cleanly but every request
still 503s, this is the first thing to check.

**3. Bad database credentials.** `backend/index.js` deliberately fails
fast: if `db.raw("select 1")` rejects, it logs
`❌ PostgreSQL Connection Error: <message>` and calls `process.exit(1)`.
Passenger will then show a 503 and the log will have that exact line —
check it for the underlying Postgres error (wrong password, wrong
database name, wrong host/port from Step 4, or the database user not
having been granted privileges on the database).

---

## After deployment

- The default admin account (Step 3's `ADMIN_*` values) is how you first
  log into `/admin/login.html` — change the password afterward if you'd
  rather not keep it in cPanel's env var history longer than necessary.
- `backend/.env` (local dev secrets) and `backend/.env.example` (documents
  the shape, no real values) are both already gitignored/safe as they
  are — nothing to change there for deployment; production secrets live
  only in cPanel's Environment Variables UI (Step 3), never in a committed
  file.
