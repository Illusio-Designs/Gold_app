# Product Requirements Document — Amrut Jewels B2B Platform

| | |
|---|---|
| **Product** | Amrut Jewels — B2B Jewelry Management Platform |
| **Owner** | Illusio Designs |
| **Status** | Living document — reflects the current codebase |
| **Last updated** | 2026-07-22 |

---

## 1. Overview

Amrut Jewels is a B2B (wholesale) jewelry platform that lets a jewelry business
manage its catalog, customers, and orders, and lets approved wholesale buyers browse
approved products and place orders from a mobile app. It consists of three parts backed
by one API:

- **Mobile app** (React Native, `Frontend/Amrut`) — the buyer/B2B client
- **Admin dashboard** (React + Vite, `Frontend/Dashboard`) — the business operator console
- **Backend API** (Node.js + Express + MySQL, `Backend`) — shared services, real-time, storage

## 2. Goals & Objectives

1. Let the business manage products, categories, sliders, and media from one dashboard.
2. Gate catalog visibility behind **per-buyer approval** (buyers see only what they're approved for).
3. Let approved buyers browse, cart, and order on mobile with **real-time** stock/price updates.
4. Give the business a complete **order lifecycle** with status tracking and notifications.
5. Reduce catalog-ops effort with **AI/OCR-assisted** media processing (background removal, tag OCR, auto-matching).

### Success metrics
- Time to onboard/approve a new buyer.
- Time to add a product (incl. image processing) end-to-end.
- Order-to-fulfilment cycle time; % orders with correct status tracking.
- Real-time update latency (catalog/stock/order) to the client.

## 3. Users & Roles

| Role | Client | Capabilities |
|------|--------|--------------|
| **Admin / Business operator** | Dashboard | Full CRUD on products, categories, sliders, users; approve buyers; process orders; manage media, app versions, app icons; send notifications. |
| **Business buyer (wholesale)** | Mobile app | OTP login; browse **approved** categories/products; cart; place & track orders; receive push notifications. Access gated by approval status. |
| **Unapproved buyer** | Mobile app | Can register/log in but sees an empty/gated catalog until approved. |

## 4. Scope

**In scope:** catalog management, buyer approval/session model, cart & orders, real-time
updates (Socket.io), push notifications (FCM), image storage (Cloudinary/local), AI/OCR
media pipeline, dynamic app icon/version management, dashboard analytics, SEO metadata.

**Out of scope (today):** in-app payments/checkout gateway, multi-language, multi-tenant
(multiple businesses), advanced analytics/BI, customer support chat, and PDF invoice
generation (present in code but **not wired up** — see §9).

## 5. Functional Requirements

### 5.1 Authentication & Authorization
- Buyers authenticate via **phone OTP**; admins via email/password.
- JWT-based sessions (`{id, type}`); server requires `JWT_SECRET` (no insecure default).
- Role guards: admin-only, business-only, approved-business-only.
- Buyer catalog visibility is gated by **approval status** stored in the `login_requests`
  session/approval table (business login writes/reads session state here).

### 5.2 Catalog (Products & Categories)
- Admin CRUD for products (SKU, weights: gross/net/less, mark amount, images, stock status)
  and categories.
- Buyers fetch **only approved** categories/products.
- Real-time propagation of catalog/stock/price changes to connected clients.
- Bulk product import via Excel; product image upload with processing & watermarking.

### 5.3 Cart & Orders
- Buyer cart: add/update/remove/clear; quantities validated (≥1).
- Checkout creates orders (single or from cart); ordering a product marks it out-of-stock and
  records stock history.
- Order lifecycle statuses: pending → processing → shipped → delivered / cancelled.
- **Business-approval rule:** status changes (except cancel) are blocked for unapproved buyers.
- Admin: list all orders, per-user orders, statistics, bulk status update, edit, delete.

### 5.4 Media & AI Pipeline
- Media gallery: upload / bulk upload, stats, orphan cleanup, serve files.
- AI/OCR assist: Gemini background removal & studio images, Tesseract tag/SKU OCR,
  auto-matching uploaded files to products/categories.
- Image processing via Sharp (resize, WebP, watermark).

### 5.5 Notifications & Real-time
- FCM push for order updates, registration/approval status, announcements.
- Socket.io rooms: `admin`, `user_<id>`; live entity-update events.
- Dashboard receives admin notifications; mobile receives buyer notifications.

### 5.6 App Management
- Dynamic **app icon** and **app version** management (force-update support) served to the app.
- Home **sliders/banners** managed from the dashboard.
- SEO metadata by page URL.

## 6. Non-Functional Requirements

- **Security:** parameterized SQL (no injection), JWT with pinned algorithm and required
  secret, role-gated endpoints, confined file paths, upload size/type limits, secrets out of
  git (Firebase key rotated & provisioned via secret store).
- **Reliability:** every request must send exactly one response (no hangs/double-sends);
  multi-step DB writes (order-from-cart) should be transactional.
- **Performance:** real-time updates via sockets with polling fallback; image processing async.
- **Observability:** server-side errors logged (not silently swallowed).
- **Portability:** env-driven config (DB, JWT, Firebase, Cloudinary, production URL).

## 7. Architecture & Tech Stack

- **Backend:** Node.js, Express, MySQL (`mysql2` pool), Socket.io, Firebase Admin (FCM),
  Cloudinary, Sharp, Tesseract.js, Google GenAI (Gemini). Routes → Controllers → Models/Services.
- **Mobile:** React Native (TS), React Navigation, AsyncStorage, Socket.io client, Axios, FCM.
- **Dashboard:** React, Vite, React Router, Axios, Socket.io client.
- See `Backend/FUNCTION_LIST.md` for the request/real-time/notification **flow** and the full
  function inventory; `Frontend/Amrut/FUNCTION_LIST.md` and `Frontend/Dashboard/FUNCTION_LIST.md`
  for the clients.

## 8. High-level Data Model

`users` (admin/business, approval status) · `categories` · `products` (SKU, weights, stock) ·
`cart` · `orders` (+ stock history) · `sliders` · `app_icons` · `app_versions` ·
`notifications` · `login_requests` (buyer session/approval state).

## 9. Known Gaps, Risks & Tech Debt

Tracked in detail in **`Backend/BUG_LIST.md`**. Highlights:

- **PDF invoices are not implemented** — `downloadOrderPDF` is a stub; `pdfService` is unused.
  Decide: implement or remove.
- **Half-removed login-request *management* feature** — cleaned up (dead API layer removed);
  the underlying approval/session system remains and is required.
- **Security items to finish** (post Phase-2 critical fixes): cart/user IDOR ownership checks,
  media path-traversal hardening, upload size limits on all uploaders, socket auth/CORS.
- **Reliability items:** flow-break hangs (watermark endpoint, adminLogin), media getAll
  auto-delete data-loss risk, order-from-cart transaction.
- **Secret hygiene:** rotate the previously-committed Firebase service-account key.
- **Dead code** to prune (see `Backend/FUNCTION_LIST.md` §3).

## 10. Release Phases (suggested)

1. **Stabilize** — backend boots (done), critical security + order fix (done), rotate key,
   finish IDOR/path-traversal/upload-limit fixes, resolve flow-break hangs.
2. **Complete features** — decide PDF invoices; transactional order-from-cart; media pipeline hardening.
3. **Cleanup** — remove dead code/modules; consolidate notification remnants.
4. **Enhancements (roadmap):** payment gateway, analytics dashboard, multi-language, search filters,
   support chat.

## 11. Open Questions

- Should PDF invoicing be built or dropped?
- Is `PATCH /orders/:id/status` meant to be buyer-usable (cancel) or admin-only?
- Is the D2C app (`Frontend/Amrut D2C`) a planned product line or a stale duplicate to remove?
- Target scale (buyers, catalog size, concurrent sockets) to size DB/socket infra?

---

*This PRD describes the system as built. For implementation-level detail see the per-component
`FUNCTION_LIST.md` files and `Backend/BUG_LIST.md`.*
