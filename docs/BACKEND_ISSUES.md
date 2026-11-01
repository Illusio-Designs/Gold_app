# Remaining work

All backend audit issues (#1–#9) and the HIGH code-review items (H2, H3,
H4/H5/H7, H6) have been **fixed and merged to `main`** — see git history for the
individual commits. None of them required a change to the B2B/B2C apps.

This file now tracks only what is still outstanding.

---

## 🔧 Needs doing

- **One-time password reset for old dashboard accounts (your action).** Accounts
  created from the dashboard **before** the double-hash fix can't log in. New
  accounts are fine. Run `node Backend/scripts/resetPassword.js <email> "<newPassword>"`
  against the DB for each affected account (or edit the user in the dashboard and
  set a new password). Data cleanup only — nothing left to code.
- **Cleanup (cosmetic).** Narration comments, leftover debug `console.log`s, and
  a few empty fire-and-forget handlers outside the files already cleaned. *(L1–L4)*

---

## 📱 Mobile app track (separate, optional)

Lives entirely inside `b2b/` and `d2c/`; not required for the backend.

- **A1 — Merge B2B & B2C into a shared library.** They are near-identical copies
  and already drifting (`firebaseService.js` is byte-identical). Biggest payoff.
- **A2 — Centralise the API & socket URLs from env; remove the shipped LAN IP**
  (`172.20.10.10`) and the runtime `localhost → prod` string-patch in `d2c`.
- **A3 — Split the 894-line `b2b Home.tsx`** god component.
- **A4 — Remove leftover debug logging** in `d2c/src/services/Api.jsx`.
- **A5 — Move the app-store reviewer test login to env/config** (keep the login;
  just stop hardcoding the number in the bundles, and confirm it's non-admin).

---

## ✅ Kept by design (no action)

- **`mark_amount`** is a product cost component (diamonds, stones and other
  materials set in the piece) — public by design, not a hidden wholesale price.
- **App-store reviewer test login** (`7600046416`) — required by Google Play and
  the Apple App Store so reviewers can sign in; intentional.
