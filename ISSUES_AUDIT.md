# Issues Audit — Amrut B2B App + Backend

**Date:** 2026-11-01
**Scope:** B2B React Native app (`/b2b`) UI + Node/MySQL backend (`/Backend`)
**Source:** two code-reading audits. Each item is verified against the code but should be re-confirmed before the fix.

> ⚠️ **Auth/security items marked [VERIFY]** interact with the MSG91 OTP flow and the dashboard's admin calls — fix carefully and test login/admin before shipping, or users/admin could be locked out.

---

## A. Backend — Security (fix first, with care)

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| B1 | 🔴 Critical [VERIFY] | `userController.js` verifyBusinessOTP (~709) | No OTP check — issues a 365-day JWT for any phone number → account takeover | Verify a real OTP (MSG91 verify API) before signing token |
| B2 | 🔴 Critical | `paymentController.js` verifyRazorpayPayment (~131) | Orders marked paid aren't bound to the verified payment/user → one real payment can mark others' orders paid | Only mark an order paid if its stored `razorpay_order_id` matches the verified one AND belongs to `req.user` |
| B3 | 🟠 High | `orderController.js` (~81, ~170) | Order owner taken from request body `business_user_id`/`user_id` → place/charge orders as another user; from-cart clears another user's cart | Derive owner from `req.user.id`; ignore body id |
| B4 | 🟠 High | `routes/order.js:31` | `PATCH /orders/:id/status` has no `requireAdmin` → any user changes any order status (and releases stock) | Add `requireAdmin` |
| B5 | 🟠 High | `routes/order.js` (19,28,41) | `GET /orders/user/:id`, `/orders/:id`, `/orders/:id/pdf` have no ownership/admin check → enumerate all orders + PII | Restrict to admin or `order.user_id === req.user.id` |
| B6 | 🟠 High | `userController.js` getUserById (~696) + `models/user.js:59` | `SELECT *` returns password hash, GST, PAN to any authed user | Select safe columns only; enforce self-or-admin |
| B7 | 🟠 High | `routes/notifications.js:7` | `POST /notifications` lacks `requireAdmin` → any user broadcasts a push to everyone | Add `requireAdmin` |
| B8 | 🟡 Med | `routes/cart.js` + `cartController.js` | Cart endpoints take `user_id` from params/body, no ownership check → read/clear others' carts | Scope all cart ops to `req.user.id` |
| B9 | 🟡 Med | `routes/notifications.js:25` | `DELETE /notifications/:id` lacks `requireAdmin` | Add `requireAdmin` |
| B10 | 🟡 Med [VERIFY] | `userController.js:180`, `middlewares/auth.js:69` | Hardcoded bypass phone `7600046416` skips approval check | Remove hardcoded bypass |
| B11 | 🟡 Med [VERIFY] | `userController.js` businessLogin (~172) | Issues JWT from phone alone (no OTP/password) | Require verified credential |

## B. Backend — Functional bugs

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| B12 | 🟡 Med | `notificationController.js` createNotification (~102) | `res.json` runs before token-query callbacks → `pushResult` always null; error path double-sends response | Send response inside the callbacks / await |
| B13 | 🟡 Med | `dashboardController.js:15` | Counts order statuses `'approved'`/`'completed'` which don't exist → those tiles always 0 | Use real statuses (pending/processing/shipped/delivered/cancelled) |
| B14 | 🟡 Med | `productController.js` (~775) | Excel re-import sets `name = ?` bound to `sku` → overwrites product name with SKU on every import | Drop `name` from the update (or map to real column) |

## C. App UI — High

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| U1 | 🟠 High | `Product.tsx:448` | Renders raw error object `{error}` → "Objects are not valid as a React child" crash on load failure | Render `{String(error)}` |
| U2 | 🟠 High | `Search.tsx:100,146` | API fires on every keystroke, no cancellation → race + stale/flickering results | Debounce the query fed to the hook / ignore stale responses |
| U3 | 🟠 High | `Filter.tsx:191` + `Product.tsx:205` | Weight slider + Category do nothing; size/length/purity default to a value with no "Any" → applying Filter empties the grid | Apply category+weight; add "Any"/unset default |

## D. App UI — Medium

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| U4 | 🟡 Med | `Cart.tsx:463` | Success modal is fixed square + `overflow:hidden` → long title / multiple order IDs clipped | Remove fixed height / let it size / scroll |
| U5 | 🟡 Med | `Cart.tsx:150` | Auto-close `setTimeout` never cleared → stray 2nd navigate to Home + setState after unmount | Store timeout in ref, clear on close/unmount |
| U6 | 🟡 Med | `CartContext.tsx:89,187` | Socket listeners re-subscribe every render (churn/race) | `useCallback` the handler, fix effect deps |
| U7 | 🟡 Med | `EditProfile.tsx:406` | "State" field looks tappable but has no handler → can't set state in some cases | Add state picker or make it editable |
| U8 | 🟡 Med | `EditProfile.tsx:274` | Submits even when phone/PIN validation failed | Block submit while errors present |
| U9 | 🟡 Med | `Orders.tsx:570` | Order cards use off-brand colors + no Glorify font | Use maroon/cream theme tokens + Glorify |
| U10 | 🟡 Med | `Product.tsx:124` | Unconditional effect sets `resolvingCategory=false`, defeating the loading gate → flash of wrong/unfiltered products | Remove the unconditional effect |

## E. App UI — Low

| # | Sev | Location | Issue | Fix |
|---|-----|----------|-------|-----|
| U11 | 🟢 Low | `OtpVerify.tsx:107` | Accepts 4–5 digit OTP (code is always 6) → confusing server failure | Require `otp.length === 6` |
| U12 | 🟢 Low | `Search.tsx:37` | "Recent Searches" are hardcoded, never persisted | Persist real queries (AsyncStorage) |
| U13 | 🟢 Low | `Search.tsx:257` | Returns null on first load → blank screen with no header | Render layout + inline loader |
| U14 | 🟢 Low | `Profile.tsx:299` | Delete dialog says 'Type "DELETE"' but has no input | Reword to match button-only flow |
| U15 | 🟢 Low | `CartContext.tsx:40` | No-provider fallback omits `checkout`/`refreshCart` stubs → throws if provider unmounts | Add no-op stubs for all methods |

---

## Suggested execution order
1. **UI crashes/dead controls** (U1, U3, U10, U2) — user-facing, safe, high value.
2. **Backend functional bugs** (B12, B13, B14) — safe, clear fixes.
3. **Low-risk security** (B4, B5, B7, B8, B9 — add `requireAdmin`/ownership) — test dashboard admin + app after.
4. **Remaining UI medium/low** (U4–U9, U11–U15).
5. **Delicate auth** (B1, B2, B3, B6, B10, B11) — needs confirmation of the MSG91 flow and admin token handling; do last, test login end-to-end.
