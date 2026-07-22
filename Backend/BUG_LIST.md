# Backend Bug List

Full line-by-line review of `Backend/` (~13,800 lines across controllers, services,
models, routes, config, middleware, utils). Findings are grouped by category and
sorted most-severe first. Each has `file:line`, severity, and a concrete failure scenario.

> ⚠️ **Headline:** The backend **does not run right now.** 16 files have fatal syntax
> errors (verified with `node --check`), caused by a `console.log`-stripping pass that
> left orphaned code fragments behind. Fix these first — nothing else can be tested until
> the app parses and boots.

---

## 🚨 A. Syntax errors — app cannot start (CRITICAL) — 16 files

Verified with `node --check`. Each is a dangling fragment left after a `console.log(...)`
was deleted (e.g. a stray `.toISOString(),`, `` `); ``, `);`, `+ '...'`). Any module
that `require()`s one of these crashes at load, and `index.js` itself won't parse.

| # | File | Error at line |
|---|------|--------------|
| 1 | `index.js` | 146 |
| 2 | `controllers/categoryController.js` | 19 |
| 3 | `controllers/notificationController.js` | 140 |
| 4 | `controllers/userController.js` | 256 |
| 5 | `controllers/productController.js` | 474 |
| 6 | `models/order.js` | 90 |
| 7 | `models/product.js` | 157 |
| 8 | `routes/product.js` | 91 |
| 9 | `scripts/setup.js` | 296 |
| 10 | `services/aiStudioService.js` | 61 |
| 11 | `services/adminNotificationService.js` | 43 |
| 12 | `services/socketService.js` | 221 |
| 13 | `services/firebaseNotificationService.js` | 42 |
| 14 | `services/imageProcessingService.js` | 155 |
| 15 | `services/enhancedImageProcessingService.js` | 18 |
| 16 | `services/mediaGalleryService.js` | 245 |

**Fix:** restore/delete each orphaned fragment so the file parses; re-run
`node --check` on every file until clean. (There are usually several such fragments per
file — the reported line is only the first.)

---

## 🔐 B. Security bugs

**B1. CRITICAL — `middlewares/auth.js:13, 88` — JWT secret falls back to `'secretkey'`.**
`jwt.verify(token, process.env.JWT_SECRET || 'secretkey')`. If `JWT_SECRET` is unset, an
attacker signs their own `{id, type:'admin'}` token with the public string `'secretkey'`
and gains full admin. → Remove the fallback; fail fast if the env var is missing.

**B2. CRITICAL — committed secret — `amrut-9cc5e-firebase-adminsdk-*.json`.**
The Firebase Admin **private key** is tracked in git. Anyone with repo access controls the
Firebase project. → Remove from history, **rotate the key**, load from env/secret manager.

**B3. CRITICAL — `routes/slider.js:23,26,27` — slider create/update/delete have NO auth.**
Unauthenticated users can upload files, overwrite homepage sliders, and delete all sliders.
→ Add `verifyToken, requireAdmin`.

**B4. HIGH — `routes/adminNotifications.js:7,23,45` — all admin-notification endpoints public.**
`/admin-clients` dumps connected admin sockets; `/test-notification` injects messages into
the live admin room. → `router.use(verifyToken); router.use(requireAdmin);`.

**B5. HIGH — `routes/user.js:52` — `PUT /users/:id` missing `requireAdmin`.**
Any logged-in user can overwrite any other account (keys off `:id`, not the token). Account
takeover. → Add `requireAdmin` or enforce `req.user.id === :id`.

**B6. HIGH — `routes/order.js:16,37,40` — admin order ops only `verifyToken`.**
`GET /orders/` leaks every customer's orders; `DELETE`/`PUT`/`PATCH /:id` let any token
holder mutate others' orders. → Add `requireAdmin` to the admin-scope order routes.

**B7. HIGH — `loginRequestController.js:12-13` (route `routes/loginRequest.js:11`) — unauthenticated + trusts `req.body.userId`.**
Anyone can create login requests on behalf of any user id (IDOR/spoof). → Require auth;
derive `userId` from `req.user.id`.

**B8. MEDIUM — Cart IDOR — `cartController.js` (`addToCart:6-11`, `getUserCart:69`, `clearUserCart:154`, `updateCartItemQuantity`, `removeFromCart`, `getCartItemById`) & `routes/cart.js:13,22`.**
`user_id`/`cart_item_id` taken from body/params with no ownership check → read/modify/clear
another user's cart. → Derive from token or verify ownership.

**B9. MEDIUM — `routes/user.js:44` — `GET /users/:id` IDOR.** Any authenticated user can read
any user record (PII). → Ownership/`requireAdmin` check.

**B10. MEDIUM — `routes/notifications.js:40` — `GET /notifications/debug/tokens` dumps all FCM tokens** to any logged-in user. → Admin-gate or remove.

**B11. MEDIUM — `routes/notifications.js:7` — `POST /notifications` not admin-gated** despite
"admin only" comment → notification spam. → Add `requireAdmin`.

**B12. MEDIUM — Path traversal — `mediaGalleryController.js:59-60` (`deleteFile`, `req.body.filePath`) and `:996` (`serveMediaFile`, `type`/`filename` params).**
`../../` escapes the uploads dir → delete/read arbitrary server files. Also the serve stream
has no `error` handler (crash after headers sent). → Confine resolved path to uploads root;
`path.basename`; whitelist `type`; add stream error handler.

**B13. MEDIUM — Path traversal / arbitrary delete — `services/mediaGalleryService.js:152-210` (`deleteFile`).**
Unlinks any path handed to it with no confinement. → `path.resolve` + prefix check.

**B14. MEDIUM — `config/multerConfig.js:173-177` — `upload` & `excelUpload` have no `fileSize` limit.**
Disk-exhaustion / DoS via huge uploads. → Add `limits: { fileSize: ... }`.

**B15. LOW — `searchController.js:17-19,231-233` — admin/frontend gate keys off mere presence
of a `Bearer` header, not a valid token.** Any client sends a bogus Bearer to get the admin
variant (includes out-of-stock data). → Gate on verified admin token.

**B16. LOW — `services/socketService.js:16,60` — Socket.io `origin:"*"` + no-op `authenticate` (always returns success).** Anyone can connect and join the `admin` room. → Restrict origin; enforce real auth.

**B17. LOW — `config/multerConfig.js:144-149` — image filter trusts client MIME only** (spoofable). → Also check extension / sniff magic bytes.

**B18. LOW — `services/firebaseNotificationService.js:5-15` — hardcoded web `apiKey`/VAPID key** committed (unused server-side). → Remove.

---

## 🔀 C. Flow breaks (hung requests / broken execution)

**C1. HIGH — `productController.js:850-945` (`addWatermarksToExistingProducts`) — request hangs.**
The `res.json(...)` completion check exists only in the DB-update callback and `catch`. The
three early-return branches (no image / file missing / already `.webp`) increment the counter
and `return` without ever checking completion. In the normal steady state (all images already
`.webp`), **no response is ever sent — the request hangs forever.** → Use `Promise.all(map(...))`
and respond once after all settle.

**C2. HIGH — `userController.js:129-145` (`adminLogin`) — no password validation → hung request.**
With a valid email and missing password, `await bcrypt.compare(undefined, hash)` rejects inside
the DB callback (no try/catch) → unhandled rejection, no response, client hangs. → Validate
`email && password` up front; wrap compare in try/catch.

**C3. HIGH — `notificationController.js:~82-126` (`createNotification`) — response sent before async work + double-send.**
`res.json({... pushResult})` runs synchronously before the token query callback fires, so
`pushResult` is always `null`; and if the token query later errors it calls
`res.status(500)` after headers were sent → `ERR_HTTP_HEADERS_SENT` crash. → Move the final
response into the callback; don't re-respond on error. *(Latent behind A3 syntax fix.)*

**C4. HIGH — `services/pdfService.js:13-73` (`generateOrderPDF`) — returns before the PDF is written + no stream error handler.**
Synchronous function calls `doc.end()` and returns nothing; the file finishes writing later on
the stream `finish` event. A caller that immediately streams/attaches the file gets a missing
or truncated PDF (race). And `createWriteStream` has no `.on('error')` → an fs error crashes
the process. → Return a Promise that resolves on `finish`, rejects on `error`.

**C5. MEDIUM — `models/order.js:88-136` (`createOrderFromCart`) — partial orders, no transaction.**
Items are inserted in a loop with no transaction; if item 3 of 5 fails, items 1–2 are already
committed (and products marked out-of-stock) but the caller gets an error → orphaned orders,
inconsistent stock. → Wrap in a single transaction on one connection; roll back on any failure.

**C6. LOW/MED — `models/user.js:20,32-33` (`insertUser`) — bcrypt error in DB callback not propagated.**
If `bcrypt.hash` rejects inside the `db.query` callback, the outer try/catch can't catch it and
`callback` is never called → request hangs. → try/catch inside the callback; `callback(err)`.

---

## 🐞 D. Logic / correctness bugs

**D1. CRITICAL (logic) — `orderController.js:37-48` — `createOrder`/`updateOrder` field-name mismatch with the model.**
Controller builds `{business_user_id, total_qty, total_mark_amount, ...}` but the model reads
`order.user_id`, `order.quantity`, `order.total_amount`. Those are always `undefined` →
mysql2 throws *"Bind parameters must not contain undefined"* (500), or inserts NULL user/qty/
amount. **Direct create-order and update-order are non-functional.** (`createOrderFromCart` is
fine — it builds the correct keys internally.) → Map to the model's contract.

**D2. HIGH — `models/appIcon.js:142-180` (`activateAppIcon`) — transaction run on the pool, not a connection.**
`db.beginTransaction(...)` on a mysql2 Pool → `TypeError: db.beginTransaction is not a function`;
fails 100% of the time. Even if it didn't throw, each `db.query` could use a different physical
connection (no atomicity). → `db.getConnection` then run BEGIN/UPDATEs/COMMIT on that one `conn`.

**D3. HIGH — `services/mediaGalleryService.js:63-111` (`getAllMedia` → `findAndDeleteOrphanedFiles`) — data loss.**
On **every** `getAllMedia()` read, it `unlinkSync`s every file in the product/category upload
dirs whose name isn't in the current DB result. A just-uploaded file (row not yet committed) or
images tracked in another table are permanently deleted by a *read*. → Make orphan deletion an
explicit, opt-in maintenance job with an age/grace-period check.

**D4. HIGH — `services/firebaseNotificationService.js:124` (`sendMulticastNotification`) — retired API.**
`firebase-admin@^13`; `messaging().sendMulticast()` used the FCM `/batch` endpoint Google shut
down → fails at runtime for every multicast. → Use `sendEachForMulticast(message)`.

**D5. MEDIUM — `orderController.js:222-254` (`getCurrentUserOrders`) & notification payload — references columns never selected.**
Reads `total_qty`, `total_mark_amount`, `net_weight`, `gross_weight`, `less_weight`,
`mark_amount`, but the model selects `o.*` (real columns are `quantity`/`total_amount`) with no
weight fields → all `undefined` in the API response the app consumes. → Select real columns.

**D6. MEDIUM — `models/loginRequest.js:5 vs 54/70/90` — `category_ids` (insert) vs `category_id` (reads).**
Insert writes plural `category_ids`; `getApprovedLoginRequest`/`checkPendingRequest` filter on
singular `category_id` → either `Unknown column` errors, or approved-category checks silently
never match. → Use the same column in reads and writes.

**D7. MEDIUM — `services/imageProcessingService.js:127-135` & `enhancedImageProcessingService.js:99-107` — watermark opacity silently ignored.**
Sharp's `composite()` has no `opacity` key; it's dropped → watermarks always render fully
opaque regardless of the configured value. → Pre-apply opacity to the watermark's alpha channel.

**D8. MEDIUM — `services/socketService.js:133-138` (`broadcastToOthers`) — sends to sender only.**
Uses `this.io.to(socketId).emit(...)` (targets that one socket) instead of everyone-except-sender
→ does the opposite of its contract. → `this.io.except(socketId).emit(...)` (socket.io v4).

**D9. MEDIUM — `services/mediaGalleryService.js:114-127` (`deleteOrphanedFiles`) — no-op.**
Loops over `media.orphaned`, which `getAllMedia` never populates → the public "delete orphaned"
API always does nothing. → Populate the list or compute it here.

**D10. MEDIUM — `services/aiStudioService.js:76-82` (`_getWorkingModel`) — picks `availableModels[0]`.**
May select a non-vision/embedding model → every image call fails. → Filter to models supporting
`generateContent` with image input.

**D11. MEDIUM — `index.js:138-141` — empty `catch` swallows DB-setup failure**; server boots
"healthy" while every query fails. Plus `index.js:115-117` error middleware and `config/db.js:18-23`
connection test both discard the error unlogged → production failures are invisible. → Log errors.

**D12. LOW — `cartController.js:23-27` (`addToCart`) — negative quantity accepted.**
`quantity || 1` turns 0→1 but passes `-5` through; the model does `quantity + VALUES(quantity)`
→ stored quantity goes negative. (`updateCartItemQuantity` validates `>= 1`; `addToCart` doesn't.)
→ Validate `Number.isInteger(q) && q >= 1`.

**D13. LOW — `loginRequestController.js:27-42` — duplicate-request 409 message mentions categories
but the query filters only on `user_id`/`status`.** Behavior contradicts the message. → Align.

**D14. LOW — `mediaGalleryController.js:54-64` (`deleteFile`) — reports success even when
`affectedRows === 0` and swallows the `fs.unlink` error.** False-positive success. → Check
`affectedRows`; surface unlink errors.

**D15. LOW — `services/autoDetectionService.js:125-126,140-141` — unescaped `%`/`_` in LIKE
fuzzy match** → over-broad matches / wrong auto-associations (not injection; still parameterized).
→ Escape wildcards; enforce a minimum stem length.

**D16. LOW — `services/ocrService.js:175,243` returns unfiltered noisy `candidates`; `:14-57` OCR
worker never terminated** (leak across process life). → Return `filteredCandidates`; add a
`terminate()` on shutdown.

**D17. LOW — `services/mediaGalleryService.js:136` `totalAdditionalImages` always 0** (dead
metric); **`:77,94,143-145` `statSync` after `readdirSync` can `ENOENT`-crash** under concurrent
delete. → Remove the metric; wrap `statSync` in try/catch.

**D18. LOW — `models/order.js:49-56` — stock-update failure silently swallowed** → a product can
be ordered yet stay `available`, allowing orders on out-of-stock inventory. → Fail or reconcile.

---

## ✅ Files reviewed and clean (logic-wise)

`controllers/uploadController.js`, `controllers/dashboardController.js`,
`controllers/sliderController.js`, `controllers/seoController.js`,
`controllers/appIconController.js`, `controllers/appVersionController.js`,
`services/cloudinaryService.js`, `services/uploadService.js`, `models/category.js`,
`models/slider.js`, `models/appVersion.js`, `models/cart.js`, `config/environment.js`,
`config/corsConfig.js`, `utils/dbHelper.js`, `utils/imageUpload.js`, and routes
`appIcon.js / appVersion.js / category.js / dashboard.js / mediaGallery.js / search.js / seo.js`.

> Note: `categoryController.js`, `productController.js`, `userController.js`,
> `routes/product.js` were logically reasonable but still have the **syntax errors in section A**.

### Not bugs (checked, ruled out)
- **SQL injection:** none — every model query uses `?` placeholders, including dynamic
  `IN (...)` lists (`order.js`). No string-concatenated values reach SQL.
- **CORS (index.js):** reflects only exact allow-listed origins + true subdomains; `credentials`
  is safe. (The unused `config/corsConfig.js` is not wired in.)
- The `7600046416` login path in `userController.js` is a deliberate documented backdoor, not an
  accidental defect (still worth removing for production).

---

## Suggested fix order
1. **Section A** — make all 16 files parse (`node --check` clean), then boot the server.
2. **B1, B2** — JWT secret + rotate/remove the committed Firebase key.
3. **B3–B7** — add the missing auth/`requireAdmin` on slider, admin-notifications, user, order, login-request routes.
4. **D1** — fix order create/update field mapping (core feature broken).
5. **C1–C4, D3** — the hung-request flow breaks and the data-loss auto-delete.
6. Everything else by severity.
