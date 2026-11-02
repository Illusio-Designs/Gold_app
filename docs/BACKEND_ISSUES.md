# Remaining work

All backend audit issues (#1–#9) and the HIGH code-review items (H2–H7) are
**fixed and merged to `main`** (PRs #100–#108). The **reviewer demo login** and
app debug-log cleanup for both mobile apps are also merged (PRs #109–#110).

This file tracks only what is still outstanding.

---

## 📲 Play Store review — action needed

The B2B app was stuck in review because it's fully login-gated and a reviewer
couldn't get past the phone/OTP wall. That's now fixed in code — both apps have
a reviewer demo login:

- **Demo credentials (both apps):** phone `7600046416`, OTP `123456` — skips the
  real SMS and logs straight in. Every real user still gets a genuine OTP.
- **To take effect:** build new releases of b2b (and d2c) from `main`, bump the
  version code, and upload to the stores. *App changes do not auto-deploy.*
- **Confirm the demo account exists:** the login needs a `users` row for
  `7600046416` (any non-admin). Its approval status does **not** matter — the
  bypass skips the approval gate. If it doesn't exist, register `7600046416` once
  through the app's Register screen (or insert it). Check via the dashboard Firms
  list or: `SELECT id, type, status FROM users WHERE phone_number = '7600046416';`
- **On the Play clarification form:** choose *"content is behind a login wall and
  valid credentials provided,"* give the demo creds above, and attach a video
  demo of the full flow.

---

## 🔧 Needs doing

- **One-time password reset for old dashboard accounts (your action).** Accounts
  created from the dashboard **before** the double-hash fix can't log in. New
  accounts are fine. Run `node Backend/scripts/resetPassword.js <email> "<newPassword>"`
  against the DB for each affected account (or edit the user in the dashboard and
  set a new password). Data cleanup only — nothing left to code.

---

## 📱 Mobile app track

Lives entirely inside `b2b/` and `d2c/`; not required for the backend.

**Done & merged (PRs #109–#110):**
- ✅ **Reviewer demo login (OTP bypass)** — both apps. Phone `7600046416` + code
  `123456` skips MSG91 and logs in via the backend.
- ✅ **A5 — reviewer login in config** — both apps (`src/config/reviewAccess.ts`),
  no longer scattered in source.
- ✅ **A4 — debug logs removed** — ~780 single-line `console.log`s stripped across
  both apps (a few multi-line ones remain).
- ✅ **A2 (mostly)** — both apps already read the base URL from env; no LAN IP in
  app source.

**Still open (optional):**
- **A1 — Merge B2B & B2C into a shared library.** Near-identical copies, already
  drifting (`firebaseService.js` is byte-identical). Biggest long-term payoff;
  large refactor — deliberately deferred so it can't destabilise the Play build.
- **A3 — Split the 894-line `b2b Home.tsx`** god component. (Largely free once A1
  shares the screens.)
- **A2 remainders (minor):** d2c still hardcodes its MSG91 widget keys in source
  (needs a `.env` entry to move), and keeps a `localhost → prod` slider patch in
  `Home.tsx` (a no-op in production).
- **Font:** `glorify-font` is a personal-use-only license — swap for a
  commercially-licensed face (changes heading branding, so it's a design call).

---

## ✅ Kept by design (no action)

- **`mark_amount`** is a product cost component (diamonds, stones and other
  materials set in the piece) — public by design, not a hidden wholesale price.
- **App-store reviewer test login** (`7600046416`) — required by Google Play and
  the Apple App Store so reviewers can sign in; intentional.
