# Backend — Function List & Flow

Regenerated after the syntax repairs, the Phase 2 security fixes, and the
login-request cleanup. Covers the current state of `Backend/`.

Sections: **1) Flow** · **2) Function inventory by module** · **3) Unused / dead
functions (removal candidates)**.

---

## 1. Flow

### 1.1 Request flow (HTTP)
```
client (mobile app / dashboard)
        │  HTTP  /api/*
        ▼
index.js  ── CORS ── express.json ── static /uploads
        │  app.use("/api/<x>", <x>Routes)
        ▼
routes/<x>.js         auth middleware:  verifyToken → requireAdmin | requireBusiness | requireApprovedBusiness
        ▼
controllers/<x>Controller.js   (validate → call model/service → respond)
        ├─────────────▶ models/<x>.js        → MySQL (config/db.js pool, ? placeholders)
        └─────────────▶ services/*            → Socket.io / FCM / Cloudinary / Sharp / AI / OCR
        ▼
       res.json(...)
```

### 1.2 Auth flow
`middlewares/auth.js` verifies the JWT with `config/jwt.js` (`JWT_SECRET`, HS256).
`req.user = { id, type }`. Guards: `requireAdmin` (type==='admin'),
`requireBusiness` (type==='business'), `requireApprovedBusiness` (business + DB
`status='approved'`, with the 7600046416 bypass).

### 1.3 Real-time flow (Socket.io — `services/socketService.js`)
```
data change in a controller
   → socketService.notify<Entity>Update(...)
   → io.to(room).emit(event)   rooms: 'admin', `user_<id>`
   → dashboard (adminSocketService) / mobile app (SocketService) listeners update live
```
Events: `category-update`, `product-update`, `order-update`, `user-update`,
`registration-status-change`, `app-version-update`, `app-icon-update`, `slider-update`.

### 1.4 Notification flow (push)
```
event → adminNotificationService.notify*  →  firebaseNotificationService.send*  → FCM
                                          └→ inserts a row in notifications table
```

### 1.5 Key feature flows
- **Business login/approval:** `POST /api/users/business/login` → `verify-otp` →
  `userController.verifyBusinessOTP` reads/writes the **`login_requests` table**
  (session store: `pending`/`approved`/`logged_in`/`expired`, session timers). Approval
  status gates category/product visibility.
- **Order create:** `POST /api/orders` → `orderController.createOrder` (maps
  `business_user_id/total_qty/total_mark_amount` → model `user_id/quantity/total_amount`)
  → `orderModel.createOrder` (checks stock, inserts, marks product out_of_stock, records
  stock history) → notify admin + socket `order-update`.
- **Media upload + AI/OCR:** `POST /api/media-gallery/*` → `mediaGalleryController`
  → `autoDetectionService` (match file→product) + `ocrService` (Tesseract tag read)
  + `aiStudioService` (Gemini bg-removal/studio) + `imageProcessingService` (Sharp/watermark)
  → Cloudinary/local storage.

---

## 2. Function inventory by module

### Entry — `index.js`
Boots Express, CORS, Socket.io (`socketService.initialize`), mounts 15 route groups
under `/api/*` (`/health`, users, products, categories, orders, cart, slider, app-icons,
app-versions, media-gallery, search, dashboard, notifications, admin-notifications, seo).

### `config/`
- **`jwt.js`** — `JWT_SECRET` (required; throws if unset) *(added in Phase 2)*
- **`db.js`** — MySQL pool `db`
- **`corsConfig.js`**, **`environment.js`** (`getBaseUrl`), **`multerConfig.js`** (`upload`, `bulkUpload`, `excelUpload`)

### `middlewares/auth.js`
`verifyToken`, `requireAdmin`, `requireBusiness`, `requireApprovedBusiness`, `optionalAuth`

### Controllers — `controllers/`
- **userController** — registerUser, adminLogin, businessLogin, checkUserExists, verifyBusinessOTP, getAllUsers, getUserById, updateUser, updateUserStatus, deleteUser, createUser
- **productController** — CRUD + getProductsByCategory, getProductBySku, stock-status/history, image upload/delete, bulk Excel upload, addWatermarksToExistingProducts
- **categoryController** — getCategories, getCategoryById, create/update/delete
- **orderController** — createOrder, createOrderFromCart, getAllOrders, getOrdersByUserId, getCurrentUserOrders, getOrderById, getOrderStatistics, updateOrderStatus, bulkUpdateOrderStatuses, updateOrder, deleteOrder, downloadOrderPDF*
- **cartController** — addToCart, getUserCart, updateCartItemQuantity, removeFromCart, clearUserCart, getCartItemById
- **sliderController**, **appIconController**, **appVersionController** — CRUD + activate
- **mediaGalleryController** — getAllMedia, getStats, upload/bulkUpload, deleteFile, serveMediaFile, getFileInfo, getAvailableItems, orphan cleanup
- **uploadController** — uploadProfileImage
- **notificationController** — createNotification, getUserNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification, registerFCMToken(+Unauth), subscribe/unsubscribe topic, SSE
- **dashboardController** — getStats, getTodayOrders, getQuickStats
- **searchController** — searchAll, searchCategories, searchProducts
- **seoController** — getSEOByPageUrl

> *`downloadOrderPDF` is a stub — returns "PDF download functionality not implemented" (see §3).*

### Models — `models/` (MySQL)
`user`, `product`, `category`, `order`, `cart`, `slider`, `appIcon`, `appVersion`
(each: create/get/update/delete + domain helpers).

### Services — `services/`
- **socketService** — initialize + emit/notify helpers (see §1.3)
- **adminNotificationService** — notifyUserRegistration, notifyNewOrder, notifyRegistrationStatusChange, notifyOrderStatusChange, sendAdminNotification, sendUserNotification, getAdminNotificationStats
- **firebaseNotificationService** — sendNotification, sendMulticastNotification, sendTopicNotification, subscribe/unsubscribeFromTopic, sendAdminNotification
- **cloudinaryService** — uploadToCloudinary, uploadToLocalStorage
- **imageProcessingService / enhancedImageProcessingService** — Sharp processing + watermark
- **aiStudioService** — Gemini: removeBackground, enhancePromptWithGemini, generateStudioImage
- **ocrService** — preprocessForOcr, extractTagNo (Tesseract)
- **autoDetectionService** — detectImageAssociation, fuzzy match, processBulkUpload
- **mediaGalleryService** — getAllMedia, getMediaStats, deleteFile, orphan cleanup

### Utils — `utils/`
- **dbHelper** — executeQuery, checkConnection
- **imageUpload** — `processImageUpload` (used) + several unused helpers (see §3)

### Removed in this cleanup ✅
`routes/loginRequest.js`, `controllers/loginRequestController.js`, `models/loginRequest.js`,
and the `/api/login-requests` mount. *(The `login_requests` table + userController session
logic were KEPT — still used by business login.)*

---

## 3. Unused / dead functions — removal candidates

Verified: each is referenced only by its own definition/export, with **no caller**
anywhere in the repo. Safe to delete after a final confirm.

### Whole modules with no importer (delete the file)
| File | Note |
|------|------|
| **`services/pdfService.js`** | `generateOrderPDF` never called; not required anywhere. PDF invoices are not wired up — `orderController.downloadOrderPDF` is a stub returning *"not implemented"*. Remove the module (and the `/:id/pdf` route + stub) **or** actually wire the feature. |
| **`services/uploadService.js`** | `handleFileUpload` never called; module not required anywhere. |

### Individual unused exports
| Function | File |
|----------|------|
| `deleteFromCloudinary`, `isCloudinaryConfigured` | `services/cloudinaryService.js` |
| `firebaseConfig` (unused web config object) | `services/firebaseNotificationService.js` |
| `getForceUpdateInfo` | `models/appVersion.js` |
| `checkProductInCart` | `models/cart.js` |
| `getProductBySkuAny` | `models/product.js` |
| `createAppIconsTable`, `checkScheduledIconChanges` | `models/appIcon.js` |
| `deleteImage`, `ensureDirectoryExists`, `deleteOldImageIfChanged`, `applyTiledWatermark` | `utils/imageUpload.js` (module IS used for `processImageUpload`; these specific exports are dead. `convertToWebp` is used internally.) |

### Dead-but-harmless notification remnants (from the login-request cleanup)
Now that the login-request controller is gone, these have no caller. Optional to remove
(they are inert; kept to avoid touching notification wiring):
- `adminNotificationService.notifyLoginRequest`, `notifyLoginRequestStatusChange`
- `socketService.notifyLoginRequestStatusChange`
- Mobile: `firebaseService.js` `LOGIN_REQUEST*` channel config; `SocketService.js` low-level `login-request-status-change` handler (never fires now)

> Detection is call-graph based (grep for references). Before deleting, glance at each to
> rule out dynamic/reflective use — none was found here, but a 10-second check is cheap.

---

*Mobile app (`Frontend/Amrut`) and Dashboard function lists are unchanged except for the
login-request remnants removed in this cleanup — see their own `FUNCTION_LIST.md`.*
