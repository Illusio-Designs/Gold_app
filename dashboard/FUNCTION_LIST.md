# Amrut Dashboard — Function List

Reference for the **React + Vite admin web dashboard** (`dashboard`).
Entry: `src/index.jsx` → `src/App.jsx` (routing). API base from `.env`.

> Structure: `pages/` (admin screens) · `components/` (UI) · `services/` (API + sockets) ·
> `hooks/` · `utils/` · `webpage/` (public-facing pages).

---

## 1. Admin API Service — `src/services/adminApiService.js`

Authenticated admin REST calls, grouped by domain.

| Domain | Functions |
|--------|-----------|
| **Auth** | `adminLogin` |
| **Users** | `getAllUsers`, `getUsers`, `createUser`, `updateUser`, `updateUserStatus`, `deleteUser` |
| **Categories** | `getAllCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` |
| **Products** | `getAllProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`, `uploadProductImages`, `getProductImages`, `deleteProductImage`, `updateProductStockStatus`, `getProductStockStatus`, `getProductStockHistory` |
| **Orders** | `getAllOrders`, `getOrderById`, `getOrdersByUserId`, `createOrder`, `createOrderFromCart`, `updateOrder`, `updateOrderStatus`, `bulkUpdateOrderStatuses`, `deleteOrder`, `downloadOrderPDF`, `getOrderStatistics` |
| **Cart** | `getUserCart`, `getCartItemById` |
| **Sliders** | `getAllSliders`, `createSlider`, `updateSlider`, `deleteSlider` |
| **App Versions** | `getAllAppVersions`, `createAppVersion`, `updateAppVersion`, `deleteAppVersion`, `activateAppVersion` |
| **App Icons** | `getAllAppIcons`, `createAppIcon`, `updateAppIcon`, `deleteAppIcon`, `activateAppIcon` |
| **Notifications** | `getAdminNotifications`, `getUnreadCount`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification`, `registerFCMToken`, `sendNotification`, `getStoredTokens`, `subscribeUserToTopic`, `unsubscribeUserFromTopic`, `getVapidKey` |
| **Media Gallery** | `getMediaGallery`, `getMediaStats`, `deleteOrphanedFiles`, `deleteMediaFile`, `getFileInfo`, `uploadMediaFile`, `bulkUploadMediaFiles`, `getAvailableItems`, `debugDatabaseContents`, `getMediaItemsWithProcessedImages`, `importExcelFile` |
| **Dashboard** | `getDashboardStats`, `getTodayOrders`, `getQuickStats` |

Other API services:
- **`publicApiService.js`** — `getPublicCategories`, `getPublicProducts`, `getPublicSliders`
- **`seoService.js`** — `getSEOByPageUrl`

---

## 2. Realtime & Notifications — `src/services/`

### `adminSocketService.js` (Socket.io client)
`connect`, `setupEventHandlers`, `joinAdminRoom`, `setAdminData`, `emit`, `on`, `off`,
`triggerEvent`, `showNotification`, `disconnect`, `getConnectionStatus`, `getAdminData`.

### `realtimeNotificationService.js` (polling fallback)
`connect`, `pollForNotifications`, `handleNewNotification`, `shouldSkipNotification`,
`playNotificationSound`, `disconnect`, `clearCache`, `reset`, `isConnected`.

### `notificationService.js`
`initialize`, `showNotification`, `playNotificationSound`.

### `notificationSoundService.js`
`preloadSounds`, `playSound`, `playFallbackSound`, `setVolume`, `setEnabled`, `testSound`,
`getVolume`, `isEnabled`.

### `firebaseService.js` (FCM web push)
`requestNotificationPermission`, `setupMessageListener`, `initializeFirebaseMessaging`,
`isFirebaseSupported`.

---

## 3. Pages — `src/pages/`

| Page | Purpose |
|------|---------|
| `AuthPage.jsx` | Admin login |
| `DashboardPage.jsx` | Stats overview / home |
| `UsersPage.jsx` | Manage business users (approve/edit/delete) |
| `CategoriesPage.jsx` | Manage categories |
| `ProductsPage.jsx` | Manage products, images, stock |
| `OrdersPage.jsx` | View/update orders, bulk status, PDF |
| `SliderPage.jsx` | Home banner sliders |
| `MediaGalleryPage.jsx` | Bulk media upload, OCR/AI processing, cleanup |
| `AppVersionsPage.jsx` | App version / force-update config |
| `AppIconsPage.jsx` | Dynamic app-icon config |

## 4. Public Pages — `src/webpage/`
`HomePage.jsx`, `PrivacyPolicy.jsx`, `DeletePage.jsx` (account-deletion request).

---

## 5. Components — `src/components/`

**Feature:** `ExcelImport.jsx` (bulk import), `RealTimeNotifications.jsx`, `SEOWrapper.jsx`.

**Layout (`layout/`):** `AuthLayout.jsx`, `DashboardLayout.jsx` (sidebar + shell).

**Common (`common/`):** `ActionButton`, `Button`, `DropdownSelect`, `InputField`, `Modal`,
`Pagination`, `SearchBar`, `Table`, `TableWithControls`, `NotificationManager`,
`NotificationSender`, `ToastManager`, `ToastNotification`.

## 6. Hooks — `src/hooks/`
`useAdminSocket.js` — admin socket connection lifecycle.

---

## 7. Utils — `src/utils/`

- **`authUtils.js`** — `isAuthenticated`, `getAdminToken`, `setAdminToken`, `clearAuthData`,
  `logout`, `autoLogout`, `validateTokenFormat`, `isTokenExpired`, `getRemainingSessionTime`
- **`imageUtils.js`** — `getImageUrl`, `getCategoryImageUrl`, `getProductImageUrl`,
  `getProfileImageUrl`, `getSliderImageUrl`
- **`toast.js`** — `showToast`, `showSuccessToast`, `showErrorToast`, `showInfoToast`,
  `showWarningToast`

> See also `REAL_TIME_NOTIFICATIONS.md` in this folder for the notification architecture.
