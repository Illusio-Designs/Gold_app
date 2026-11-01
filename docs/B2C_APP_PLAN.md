# B2C App — Plan List

A running list of features and changes planned for the **B2C (direct-to-consumer)
app**. Add new items under "Planned"; move them to "In progress" / "Done" as
work proceeds.

> Scope note: items here are for the **B2C app only** — not the B2B app.

---

## Planned

### 1. Live gold rate (B2C app)
**What:** Replace the manually typed gold rate in Settings → B2C Pricing with a
live-updating rate, so consumer prices follow the market automatically.

**Decisions locked:**
- Applies to the **B2C app only** (B2B is unaffected).
- Purity: **24K**.
- Markup: **none** — use the rate as-is, no premium added.
- Behaviour: **just the rate** — fetch and show the current rate (no separate
  confirm step required).

**Still to decide / needs input:**
- **Price source** — a live feed needs an external API key/account. Options to
  pick from: `goldapi.io` (small free tier), IBJA daily rate, or another source
  you already have. (Pending your choice.)

**Implementation outline (for when we build it):**
- Backend: scheduled job fetches spot gold, converts USD/oz → ₹/gram for 24K
  (÷ 31.1035 g/oz, apply USD→INR), stores in `app_settings.gold_rate` with a
  `gold_rate_updated_at` timestamp.
- Store the API key as a GitHub secret (never committed).
- Settings → B2C Pricing: show the live rate read-only with a "last updated"
  time; keep a manual override as a fallback if the feed is unavailable.
- B2C app reads `gold_rate` as it does today — no app-side change needed.

---

## In progress

_(none)_

---

## Done

_(none)_
