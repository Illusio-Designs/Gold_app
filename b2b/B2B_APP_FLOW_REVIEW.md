# Amrut Jewels — B2B App Flow Review & Alignment Plan

> **App:** `b2b` — React Native (TypeScript) **B2B / wholesale** mobile app
> **Reviewed against:** production backend `https://api.amrutkumargovinddasllp.com/api`
> **Purpose:** map the end-to-end user flow, list every break / stale / inconsistency,
> and give a prioritized plan to make the app behave correctly against the current backend.
> **Status:** ✅ **Resolved** — all four tiers implemented (see §6 "Resolution" below).

---

## 1. Current end-to-end flow (as built)

```
Splash (3s)
  ├─ has token + userId ........................ MainTabs
  ├─ hasSeenOnboarding = true .................. MainTabs
  └─ first run ................................. JourneyPane (5s)
                                                   → ShreenathjiScreen (5s)
                                                   → FamilyTree (5s)
                                                   → MainTabs
MainTabs (bottom tabs, initial = Home)
  ├─ Home       → ProductDetail
  ├─ Collection → Product (by category) → ProductDetail
  ├─ Cart       → checkout → POST /orders/from-cart
  └─ Profile    → EditProfile / My Orders / Delete Account / Logout
```

- **Auth model:** no hard login guard — the app is **guest-browsable**. Login is skippable
  (`Login.tsx` "Skip Login" → MainTabs). Login is prompted *softly* only on **Cart**,
  **Profile**, and **Orders** via `useLoginPrompt` + `LoginPromptModal`.
- **Login method:** OTP via **MSG91** (`@msg91comm/sendotp-react-native`), then
  `verifyBusinessOTP` → `POST /users/verify-otp`. Registration collects a password that
  the OTP login never uses.
- **Pricing model:** **no catalog price** is shown. `ProductDetail` shows weights/purity and
  a buyer-typed **"Amount"** field — a quote/offer model, not fixed pricing.
- **Order flow:** add to cart → `POST /cart/add` → checkout → `POST /orders/from-cart`;
  orders listed via `GET /orders/my-orders`; status via `PATCH /orders/:id/status`.

---

## 2. Backend alignment status

| Backend fact (current) | App behavior | Verdict |
|---|---|---|
| Approval / "request-for-login" **removed**; all products served to everyone | App still has approval branches, notif types & socket listeners | ❌ stale leftovers |
| Real account-deletion endpoint `POST /api/account-deletion` (+ cascade) | App opens an **external Netlify site** instead | ❌ inconsistent |
| Single order-status route `PATCH /orders/:id/status` (kept) | App uses exactly this | ✅ matches |
| Bulk order-status route **removed** | App never called bulk | ✅ no stale call |
| `POST /orders/from-cart`, `GET /orders/my-orders` | App uses both | ✅ matches |

**No removed endpoint is invoked anywhere in the app.** The gaps are stale *client* logic
and a bypassed *account-deletion* endpoint, not broken API calls.

---

## 3. Findings (by severity)

### 🔴 BROKEN — will produce wrong data
| # | Where | Issue |
|---|---|---|
| B1 | `screens/Product.tsx:298–303` | `addToCartDirectly` uses hardcoded fallbacks (`sku:'RMB1021'`, `gWeight:'2.512'`, `size:'18" (46cm)'`, `length:'12-14 in'`). If a product lacks a field, `getProductBySku('RMB1021')` adds the **wrong product** to the backend cart. |
| B2 | `utils/imageUtils.ts:34` | `getProductImageUrl` uses raw `process.env.IMAGE_URL` with **no fallback** (unlike sibling fns). If `IMAGE_URL` is unset at runtime, product images become `undefined/uploads/...`. |

### 🟠 INCONSISTENT — works but behaves oddly / diverges from backend
| # | Where | Issue |
|---|---|---|
| I1 | `Profile.tsx:290,309,321` | "Delete Account" opens external `https://amrutkumar-govinddas-account-deletion.netlify.app/` instead of our real `/api/account-deletion`. Requests never reach our system. |
| I2 | `Home.tsx:124–127,192–196` | Home blanks catalog for guests ("No products available") while `Collection`/`Product` are fully guest-browsable → inconsistent storefront. |
| I3 | `RealtimeDataService.js:22` | Socket connects **without a token**; the token path (`useUserSocket`) lives only in **commented-out** components → no user-room realtime; order/cart push events never arrive (polling only). |
| I4 | `Orders.tsx:132–164,399–413` | A B2B **buyer can self-advance** their own order to delivered/cancelled. Endpoint-correct but unusual for wholesale (product decision). |

### 🟡 STALE — old approval model / dev artifacts
| # | Where | Issue |
|---|---|---|
| S1 | `Login.tsx:294–301` | Dead `pending` / "not approved" branch after OTP verify. |
| S2 | `Home.tsx:110–121,177–190` | Unreachable "No approved login request found" error branches. |
| S3 | `services/NotificationService.ts:201–214` | Approval notif types `login_approved` / `login_rejected` / `login_request`. |
| S4 | `SocketService.js:254–268`, `hooks/useUserSocket.js:126–155` | Approval realtime listeners (`registration-status-change`, `login-request-status-change`). |
| S5 | `Api.jsx:30`, `imageUtils.ts:17,20` | Hardcoded `http://172.20.10.10:3001` fallbacks. |
| S6 | `Home.tsx:221,224` | Runtime `localhost:3001 → prod` string-replace hack on slider URLs. |
| S7 | `.env` | Commented `# API_URL=http://192.168.1.14:3001/api` left in file. |
| S8 | `Api.jsx` | Unused exports: `sendBusinessOTP`, `checkUserExists`, `createOrder`, `getUserOrders`, `getOrderById`; unused hooks `useVersionManager`, `useAppIcon`; disabled `firebaseService`. |

### 🔵 POLISH / SECURITY
| # | Where | Issue |
|---|---|---|
| P1 | `Login.tsx:32–33` | **MSG91 `WIDGET_ID` / `TOKEN_AUTH` hardcoded** in the bundle → move to `.env` (security). |
| P2 | `Profile.tsx:28,54,70,88`, `EditProfile.tsx:25` | Placeholder name `'Wade Warrant'`. |
| P3 | `EditProfile.tsx.backup`, `debug-tokens.js`, `checkHermes.js`, `SocketDebugger.jsx` | Dead files / artifacts. |
| P4 | `Api.jsx:33–34`, `Home.tsx:29`, `Product.tsx:419–431`, services | Pervasive `console.log` noise. |
| P5 | Splash/onboarding | ~18s (3+5+5+5) of long auto-timers before reaching the app. |
| P6 | `CartContext.tsx:479–481` | `getTotalWeight()` returns unrounded float → long decimals in cart. |

---

## 4. Aligned plan (prioritized)

### Tier 1 — Backend alignment (correctness)
1. **Account deletion → real endpoint.** Point `Profile.tsx` delete flow at our own portal
   `https://amrutkumargovinddasllp.com/delete` (submits to `/api/account-deletion`).
   *(fixes I1)*
2. **Remove dead approval gating** — `Login.tsx:294–301`, `Home.tsx:110–121/177–190`,
   `NotificationService.ts:201–214`, approval socket listeners. *(fixes S1–S4)*
3. **Fix guest catalog inconsistency** — Home loads the catalog for guests like
   Collection/Product does; Cart/Orders/Profile keep the login prompt. *(fixes I2)*

### Tier 2 — Correctness / data integrity
4. **Remove hardcoded cart fallback** (`Product.tsx:298–303`) — require a real SKU/product_id;
   skip/warn instead of faking `RMB1021`. *(fixes B1)*
5. **Harden image URLs** — add fallback in `imageUtils.ts:34`; drop the `localhost→prod`
   replace hack now that the backend returns correct URLs. *(fixes B2, S6)*

### Tier 3 — Security & config hygiene
6. **Move MSG91 credentials to `.env`** (`Login.tsx:32–33`). *(fixes P1)*
7. **Clean stale config** — remove `172.20.10.10:3001` fallbacks and the commented
   `192.168.x` line in `.env`. *(fixes S5, S7)*

### Tier 4 — Polish (optional)
8. **Authenticate the realtime socket** so user-room order/cart events work. *(fixes I3)*
9. Replace `'Wade Warrant'` placeholders, remove dead files, trim console noise,
   shorten onboarding timers, round cart weight. *(fixes P2–P6)*

### Open product decision
- **I4 — buyer order-status control.** Recommend making the buyer's order view **read-only**
  (status changes only from the admin dashboard). Endpoint stays the same; this is a
  behavior/product choice, so flagged for confirmation rather than assumed.

---

## 6. Resolution (implemented)

| Finding | Fix |
|---|---|
| I1 account deletion | `Profile.tsx` now opens our portal `https://amrutkumargovinddasllp.com/delete` (→ `/api/account-deletion`); external Netlify URL removed. |
| S1–S4 approval leftovers | Removed pending/approved branch (`Login.tsx`), Home approval dead-branches, approval notif types (`NotificationService.ts` → generic keyword mapping), approval socket listeners (`SocketService.js`, `useUserSocket.js`). |
| I2 guest catalog | `Home.tsx` loads categories & products for everyone (guest-browsable), matching the backend serving all data. |
| B1 cart fallback | `Product.tsx` requires a real SKU; no more `RMB1021`/`2.512` placeholders → can't add the wrong product. |
| B2 / S6 image URLs | `imageUtils.ts` product image uses the resolved `BACKEND_URL`; `localhost→prod` slider hack removed. |
| P1 MSG91 creds | Moved from `Login.tsx` into `.env` (`MSG91_WIDGET_ID`/`MSG91_TOKEN_AUTH`, read via `@env`). *Note: `.env` is tracked; these are client-side widget creds shipped in the binary — to fully remove from the repo, gitignore `.env` and inject at build time.* |
| S5 / S7 stale config | `172.20.10.10:3001` fallbacks → production host; commented `192.168.x` removed from `.env`. |
| I3 socket auth | `RealtimeDataService` connects with the stored token and reconnects authenticated after login → user-room order/cart events work. |
| I4 order status | Buyer order view is now **read-only** (Update-Status button + modal removed); status changes only from the admin dashboard. |
| P2–P6 polish | `'Wade Warrant'` → `'Guest'`; removed dead files (`EditProfile.tsx.backup`, `debug-tokens.js`, `checkHermes.js`, `SocketDebugger.jsx`); trimmed console noise; onboarding timers 5s→3s; cart weight rounded (NaN-safe). |

## 7. Order gate — approved business required (added)

Access model after this change:
- **Guest / not logged in** → browse all categories & products; login prompt on Cart/Orders/Profile.
- **Registered user (any status)** → can log in (login itself is not approval-gated).
- **Placing an order** → **requires an approved business** (`users.status = 'approved'`).

Backend (`POST /orders`, `POST /orders/from-cart`) now runs
`requireApprovedBusiness` middleware (`orderController.js`): identity is taken
from the verified token, and a `business` account whose status is not
`approved` gets `403 { code: 'BUSINESS_NOT_APPROVED' }`. Non-business
accounts (admin) pass through.

App: a pending user can still browse and build a cart; at checkout the app
catches `BUSINESS_NOT_APPROVED` and shows an "Account Pending Approval" alert
(`Cart.tsx` / `CartContext.tsx`) instead of a generic error. The cart is kept
so they can order once approved.

## 5. Notes
- All secrets (FTP, MSG91) belong in environment config / GitHub Actions secrets, never in
  committed source.
- The app already points at the production API (`.env` `API_URL` / `IMAGE_URL`) and the
  Socket.IO host matches it — no base-URL change needed for prod.
