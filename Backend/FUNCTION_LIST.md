# Amrut Backend — Function & API List

Reference for the **Node.js + Express + MySQL** API server (`Backend/`).
Entry point: `index.js` (mounts routes, Socket.io, CORS, static `/uploads`).

> Architecture: `routes/` → `controllers/` → `models/` (MySQL) + `services/` (business logic / integrations).

---

## 1. API Endpoints (by route)

All routes are mounted under `/api/*` in `index.js`. Health check: `GET /api/health`.

### Users — `/api/users`
`POST /register`, `POST /admin/login`, `POST /business/login`, `POST /check-exists`,
`POST /verify-otp`, `POST /logout`, `GET /`, `GET /:id`, `PUT /:id`, `PATCH /:id` (status),
`DELETE /:id`.

### Products — `/api/products`
`GET /`, `GET /category/:categoryId`, `GET /sku/:sku`, `GET /:id`, `POST /`, `PUT /:id`,
`DELETE /:id`, `PATCH /:id` (stock), `GET /:id/stock-status`, `GET /:id/stock-history`,
`POST /:id/images`, `GET /:productId/images`, `DELETE …/images`, bulk-upload endpoints.

### Categories — `/api/categories`
`GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`.

### Orders — `/api/orders`
`POST /`, `POST /from-cart`, `GET /`, `GET /user/:user_id`, `GET /my-orders`,
`GET /stats/statistics`, `GET /:id`, `PATCH /:id/status`, `PATCH /bulk-status`, `PUT /:id`,
`DELETE /:id`, `GET /:id/pdf` (invoice PDF).

### Cart — `/api/cart`
`POST /add`, `GET /user/:user_id`, `PUT /item/:cart_item_id/quantity`,
`DELETE /item/:cart_item_id`, `DELETE /user/:user_id/clear`, `GET /item/:cart_item_id`.

### Slider — `/api/slider`
`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

### App Icons — `/api/app-icons`
`GET /current/:platform`, `GET /current/:platform/:type`, `GET /active/:platform`,
`POST /`, `GET /`, `GET /stats`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `PATCH /:id/activate`.

### App Versions — `/api/app-versions`
`GET /check-update`, `GET /latest/:platform`, `POST /`, `GET /`, `GET /platform/:platform`,
`PUT /:id`, `DELETE /:id`, `PATCH /:id/activate`.

### Login Requests — `/api/login-requests`
`POST /`, `GET …`, `PATCH …` (approve/reject), plus admin list endpoints.

### Media Gallery — `/api/media-gallery`
`GET /all`, `GET /stats`, `DELETE /orphaned`, `DELETE /file`, `POST …` (upload / bulk upload),
`GET /file-info/:encodedPath`, `GET /available-items`, `GET /debug-database`,
`GET /serve/:type/:filename`.

### Search — `/api/search`
`GET /all`, `GET /categories`, `GET /products`.

### Dashboard — `/api/dashboard`
`GET /stats`, `GET /today-orders`, `GET /quick-stats`.

### Notifications — `/api/notifications`
`POST /`, `GET /user/:userId`, `GET /user/:userId/unread`, `PATCH /:notificationId/read`,
`PATCH /user/:userId/read-all`, `DELETE /:notificationId`, `POST /register-token`,
`POST /register-token-unauth`, `POST /subscribe-topic`, `POST /unsubscribe-topic`,
`GET /vapid-key`, `GET /sse` (server-sent events).

### Admin Notifications — `/api/admin-notifications`
`GET /stats`, `GET /admin-clients`, `POST /test-notification`.

### SEO — `/api/seo`
`GET /` (SEO metadata by page).

---

## 2. Controllers — `controllers/`
Handle request/response for each domain (validation, call model + service, format response):
`userController`, `productController`, `categoryController`, `orderController`,
`cartController`, `sliderController`, `appIconController`, `appVersionController`,
`loginRequestController`, `mediaGalleryController`, `searchController`,
`dashboardController`, `notificationController`, `seoController`, `uploadController`.

## 3. Models — `models/` (MySQL data access)
`user`, `product`, `category`, `order`, `cart`, `slider`, `appIcon`, `appVersion`,
`loginRequest`.

---

## 4. Services — `services/` (business logic & integrations)

### `socketService.js` — Socket.io real-time
`initialize`, `setupEventHandlers`, `emitToAll`, `emitToRoom`, `emitToClient`,
`broadcastToOthers`, `notifyCategoryUpdate`, `notifyProductUpdate`, `notifyOrderUpdate`,
`notifyUserUpdate`, `notifyNewUserRegistration`, `notifyUserRegistrationStatusChange`,
`notifyLoginRequestStatusChange`, `notifyAppVersionUpdate`, `notifyAppIconUpdate`,
`notifySliderUpdate`, `getConnectedClientsCount`.

### `firebaseNotificationService.js` — FCM push
`sendNotification`, `sendMulticastNotification`, `sendTopicNotification`,
`subscribeToTopic`, `unsubscribeFromTopic`, `sendAdminNotification`.

### `adminNotificationService.js` — admin alerts
`sendAdminNotification`, `notifyUserRegistration`, `notifyLoginRequest`, `notifyNewOrder`,
`notifyRegistrationStatusChange`, `notifyLoginRequestStatusChange`, `notifyOrderStatusChange`,
`sendUserNotification`, `getAdminNotificationStats`.

### `cloudinaryService.js` — image storage
`uploadToCloudinary`, `uploadToLocalStorage`, `deleteFromCloudinary`, `isCloudinaryConfigured`.

### `imageProcessingService.js` — Sharp image processing
`processImage`, `applyWatermark`, `processProductImage`, `processCategoryImage`,
`getFileSize`, `deleteOriginalFile`, `ensureDirectoriesExist`.

### `enhancedImageProcessingService.js` — advanced processing
`cleanGreyBackground`, `applyWatermark`, `processExistingProductImage`,
`processNewProductImage`, `cleanAllExistingProductImages`.

### `aiStudioService.js` — Google Gemini / GenAI (AI image work)
`isEnabled`, `listAvailableModels`, `removeBackground`, `enhancePromptWithGemini`,
`generateStudioImage` (+ internal `_generateImageWithGenAI`, `_generateImageWithAnalysis`).

### `ocrService.js` — Tesseract OCR
`preprocessForOcr`, `extractTagNo` (reads tag/SKU numbers from images).

### `autoDetectionService.js` — auto-match uploads to products
`detectImageAssociation`, `detectBySku`, `detectByProductName`, `detectByCategoryName`,
`fuzzyMatchProduct`, `fuzzyMatchCategory`, `processBulkUpload`, `guessTypeFromFilename`.

### `mediaGalleryService.js` — media management
`getAllMedia`, `findAndDeleteOrphanedFiles`, `deleteOrphanedFiles`, `getMediaStats`,
`deleteFile`, `getFileInfo`, `cleanupOrphanedDatabaseRecords`.

### `pdfService.js` — invoices
`generateOrderPDF`.

### `uploadService.js` — `handleFileUpload` (Multer wrapper).

---

## 5. Config, Middleware, Utils, Scripts
- **`config/`** — `db.js` (MySQL pool), `corsConfig.js`, `environment.js`, `multerConfig.js`
- **`middlewares/auth.js`** — JWT auth guard
- **`utils/`** — `dbHelper.js`, `imageUpload.js`
- **`scripts/`** — `setup.js` (DB init / migrations), `migrate_sliders.js`, `clearUserCart.js`

> See also `API_LIST.md` and `API_OPTIMIZATION_RECOMMENDATIONS.md` in this folder.
