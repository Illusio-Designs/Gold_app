# Backend issues — audit findings

Read-only audit of `Backend/` for B2B (`business`), B2C (`consumer`) and admin
(`admin`) flows. Grouped by severity. Status: **open** unless noted.

> ⚠️ #1 and #2 are production-blocking — fix before the store review proceeds.

## 🔴 Critical

- [ ] **Public register can self-mint an admin.** `routes/user.js` `POST /api/users/register` is unauthenticated and sets `type` from the request body, so anyone can create a `type:"admin"` account and log in via `/admin/login`. — *Fix: force `type` to `business`/`consumer` on the public register path; never accept `admin` from unauthenticated input.* (`controllers/userController.js` ~line 16)
- [ ] **Single-product order creation is broken.** `controllers/orderController.js` (~line 147) references an undefined `business_user_id` after the insert → throws / hangs; stock is reserved but the client gets no response. — *Fix: use `req.user.id` / `orderDetails.user_id`; remove the stray `business_user_id`.*

## 🟠 High

- [ ] **`/verify-otp` issues a token with no OTP check and skips approval.** `verifyBusinessOTP` (`userController.js` ~802) looks a user up by phone only and returns a 365-day JWT. — *Fix: verify a real OTP and re-apply the `status==='approved'` gate (or document that Firebase enforces the OTP first).*
- [ ] **Admin/consumer accounts created by an admin can never log in** (double bcrypt hash). `userController.js` ~441 hashes, then `models/user.js` ~33 hashes again. — *Fix: hash once (pass plaintext to the model, or INSERT directly like `createAdmin`).* (`/users/system` admin-create is already correct.)
- [ ] **Storefront search 500s** — `searchController.js` queries columns that don't exist (`p.less_weight`, `p.length`, `p.mark`). — *Fix: drop `length`/`mark`; compute `less_weight` as `gross_weight - net_weight`.*

## 🟡 Medium

- [ ] **Password hashes leaked in admin user lists** — `getAllUsers`/`getAllConsumers` use `SELECT *` (returns `password`, `otp`, `reset_token`). — *Fix: explicit column lists.*
- [ ] **`GET /orders/stats/statistics` has no admin gate** — any logged-in user can read store-wide stats. — *Fix: add `requireAdmin`.*
- [ ] **B2B wholesale price (`mark_amount`) is public** — product endpoints expose it with no auth/type gating (admin-vs-frontend split only checks for a Bearer header). — *Fix: gate the price fields by auth/user type if they're meant to be private.*
- [ ] **Single "mark notification read" writes a NULL user** — route lacks the `:userId` param the controller reads. — *Fix: use `req.user.id`.*

## 🟢 Low

- [ ] Cart re-add stays hidden (`ON DUPLICATE KEY UPDATE` never resets `status` from `removed`).
- [ ] Logged-in consumers get the admin product view (any Bearer treated as admin in `productController.js` ~97).
- [ ] `updateOrder` realtime emit targets `user_${business_user_id}` (undefined) → dead room.
- [ ] `PATCH /:notificationId/read` has no ownership check.

## ✅ Verified correct (no action)

Order/cart ownership · approval gating on ordering · server-side pricing ·
payment replay/ownership · atomic stock reservation · order-number derivation ·
no SQL injection · notification failure-safety · account-deletion gating ·
route ordering (no `/:id` shadowing).
