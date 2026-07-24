# Amrut B2B App — Function List

A reference catalog of the functions in the **B2B mobile app** (`b2b`),
grouped by module. Each entry lists the function name, where it lives, and what it does.

> App: React Native (TypeScript). Source root: `src/`

---

## 1. API Service — `src/services/Api.jsx`

Backend REST calls (base URL from `.env`, default `http://172.20.10.10:3001/api`).

### Auth & Users
| Function | Purpose |
|----------|---------|
| `registerUser(userData)` | Register a new business user |
| `checkUserExists(data)` | Check if a user/phone already exists |
| `sendBusinessOTP(phoneNumber, countryCode)` | Send login OTP |
| `verifyBusinessOTP(phoneNumber)` | Verify OTP and log in |
| `getUserById(userId, token)` | Fetch a user profile |
| `updateUserProfile(userId, profileData, token)` | Update profile details |

### Categories & Products
| Function | Purpose |
|----------|---------|
| `getCategories()` | All categories |
| `getApprovedCategoriesForUser(userId, token)` | Categories the business is approved to see |
| `getApprovedProductsForUser(userId, token)` | Products the business is approved to see |
| `getAllProducts()` | All products |
| `getProductsByCategory(categoryId)` | Products in a category |
| `getProductById(productId)` | Single product by id |
| `getProductBySku(sku)` | Single product by SKU |

### Cart
| Function | Purpose |
|----------|---------|
| `addToCart(cartData, token)` | Add item to cart |
| `getUserCart(userId, token)` | Fetch the user's cart |
| `updateCartItemQuantity(cartItemId, quantity, token)` | Change item quantity |
| `removeFromCart(cartItemId, token)` | Remove one item |
| `clearUserCart(userId, token)` | Empty the cart |

### Orders
| Function | Purpose |
|----------|---------|
| `createOrder(orderData, token)` | Place an order |
| `createOrderFromCart(cartOrderData, token)` | Checkout the cart into an order |
| `getUserOrders(userId, token)` | Orders for a user |
| `getCurrentUserOrders(token)` | Orders for the logged-in user |
| `getOrderById(orderId, token)` | Single order |
| `updateOrderStatus(orderId, status, token)` | Change order status |

### Notifications
| Function | Purpose |
|----------|---------|
| `getUserNotifications(userId, token)` | List notifications |
| `getUnreadCount(userId, token)` | Unread badge count |
| `markNotificationAsRead(notificationId, token)` | Mark one read |
| `markAllNotificationsAsRead(userId, token)` | Mark all read |

### App Config / Misc
| Function | Purpose |
|----------|---------|
| `getSliders()` | Home banner sliders |
| `searchAll(query)` / `searchCategories(query)` / `searchProducts(query)` | Search |
| `checkAppUpdate(platform, versionCode)` | Check for a newer app version |
| `getLatestVersion(platform)` | Latest version info |
| `getCurrentAppIcon(platform, type)` / `getActiveAppIcons(platform)` | Dynamic app-icon config |

---

## 2. Context / State

### `src/context/CartContext.tsx` — global cart
`useCart()`, `CartProvider`, `addToCart`, `addToCartLocally`, `removeFromCart`,
`clearCart`, `clearCartOnLogout`, `clearCartForNewUser`, `clearCartCompletely`,
`saveCartItems`, `getTotalQuantity`, `getTotalWeight`, `checkout`, `refreshCart`,
`handleRealTimeCartUpdate`, `syncWithBackend`, `checkUserChange`.

### `src/context/NavigationContext.tsx` — global loader overlay
`useNavigationLoader()`, `NavigationProvider`, `showLoader`, `hideLoader`.

---

## 3. Hooks — `src/hooks/`

| Hook | File | Purpose |
|------|------|---------|
| `useAppIcon` / `useAppLauncherIcon` / `useNotificationIcon` / `useAdaptiveIcon` / `useRoundIcon` / `useSquareIcon` / `useAllAppIcons` | `useAppIcon.js` | Dynamic app-icon variants |
| `useLoginPrompt` (`checkLoginStatus`, `checkAndPromptLogin`, `closeLoginPrompt`) | `useLoginPrompt.ts` | Gate actions behind login |
| `useNavigationLoader` | `useNavigationLoader.ts` | Access the loader context |
| `useRealtimeData` + `useRealtimeCategories` / `useRealtimeProducts` / `useRealtimeProductDetails` / `useRealtimeCustomData` | `useRealtimeData.js` | Live data with socket refresh |
| `useUserSocket` (`joinUserRoom`, `on`, `off`, `emit`, `disconnect`) | `useUserSocket.js` | Per-user socket connection |
| `useVersionManager` / `useAppStartUpdateCheck` | `useVersionManager.js` | Update checks |

---

## 4. Services — `src/services/`

### `SocketService.js` (singleton)
`checkServerHealth`, `connect`, `setupEventHandlers`, `attemptReconnect`,
`authenticate`, `joinRoom`, `leaveRoom`, `cleanup`, `reset`, `getConnectionStatus`,
`isHealthy`, `disable`, `enable`, `disconnect`, `emit`, `removeEventListener`, `getSocketId`.

### `RealtimeDataService.js` (singleton)
`initializeSocket`, `setupSocketListeners`, `handleSocketUpdate`, `subscribe`,
`unsubscribe`, `startPolling`, `stopPolling`, `pollData`, `checkForUpdates`,
`notifySubscribers`, `shouldNotifySubscriber`, `createDataHash`, `refreshData`,
`setPollingInterval`, `getStatus`, `disconnect`.

### `NotificationService.ts`
`initialize`, `startPolling`, `stopPolling`, `onUserLogin`, `onUserLogout`,
`markAllAsRead`, `getNotifications`.

### `firebaseService.js` (FCM push)
`initialize`, `checkNotificationEnabled`, `requestPermission`, `getFCMToken`,
`registerTokenWithBackend`, `setupMessageHandlers`, `setupNotificationHandlers`,
`showLocalNotification`, `configureNotificationHandlers`, `setNotificationCallbacks`,
`getStoredToken`, `updateUserId`, `registerTokenForUser`, `cleanup`.

### `VersionService.js`
`initialize`, `checkForUpdates`, `getLatestVersionInfo`, `startPeriodicUpdateCheck`,
`stopPeriodicUpdateCheck`, `addUpdateListener`, `removeUpdateListener`,
`notifyUpdateAvailable`, `getStoredUpdateInfo`, `clearStoredUpdateInfo`,
`isForceUpdateRequired`, `getCurrentVersion`, `getPlatform`, `compareVersions`,
`isVersionOutdated`, `cleanup`.

### `AppIconService.js`
`initialize`, `loadCachedIcons`, `fetchCurrentIcons`, `startPeriodicRefresh`,
`getCurrentIcon`, `getActiveIcons`, `getIconUrl`, `shouldUpdateIcon`,
`updateCurrentIcon`, `handleIconUpdate`, `addListener`, `notifyListeners`,
`getIconForUseCase`, `isIconScheduled`, `getScheduledIcons`, `clearCache`, `getStatus`.

---

## 5. Screens — `src/screens/`

| Screen | Key functions |
|--------|---------------|
| `Home.tsx` | `ProductCard`, `fetchCategories`, `loadProducts`, `handleProductPress`, `handleCategorySelect`, `handleSliderShowMore`, real-time update handlers, `onRefresh` |
| `Collection.tsx` | `fetchCategories`, `handleCategoryPress`, `onRefresh` |
| `Product.tsx` | `loadProducts`, `refreshProducts`, `addToCartDirectly`, `getCategoryName`, `renderProductImage`, real-time update handler |
| `ProductDetail.tsx` | `fetchProduct`, `getProductImage` |
| `Cart.tsx` | `handleRemove`, `handleCheckout`, `handleRealTimeCartUpdate`, `onRefresh`, `handleCloseModal` |
| `Orders.tsx` | `fetchOrdersWithToken`, `handleStatusUpdate`, `showStatusUpdateModal`, `handleRealTimeOrderUpdate`, `getStatusColor`, `getStatusBgColor`, `formatCurrency`, `formatDate` |
| `Search.tsx` | `performSearchWithFilter`, `removeRecent`, `handleFilterChange`, `handleRecentPress`, `handleResultPress`, `renderSearchResult` |
| `Filter.tsx` | `clamp`, `CustomWeightSlider`, `fetchCategories` |
| `Profile.tsx` | `fetchUser`, `getCurrentAppVersion`, `handleCameraPress`, `handleDeleteAccount`, `confirmAccountDeletion`, `executeAccountDeletion`, `handleLogout` |
| `EditProfile.tsx` | `fetchUserIdAndData`, `handleSelectCountry`, `handlePhoneChange`, `validatePhone`, `validatePin`, `handleCameraPress`, `handleUpdateProfile` |
| `authorization/Login.tsx` | `handleSelectCountry`, `handleSendOtp`, `checkDeliveryStatus`, `handleVerifyOtp`, OTP auto-read handler |
| `authorization/Register.tsx` | `handleSelectCountry`, `handlePhoneChange`, `validatePhone`, `validatePin`, `validateRequiredField`, `validateEmail`, `validatePassword`, `validateAllFields`, `handleRegister` |
| `Splash/Splash.tsx` | `checkAuthAndNavigate` |
| `Splash/FamilyTree.tsx`, `Splash/JourneyPane.tsx`, `Splash/ShreenathjiScreen.tsx` | Onboarding/splash panes |

---

## 6. Navigation — `src/navigation/`
- `BottomNavigation.tsx` — `CustomTabBar`, `CollectionStack`, `BottomNavigation`
- `StackNavigation.tsx` — `StackNavigation`
- `types.ts` — route param types

---

## 7. Components — `src/components/`

**Notification managers:** `NotificationManager.jsx` (`initializeNotifications`,
`setupNotificationCallbacks`, `handleNotificationTap`, `updateUserId`),
`UserNotificationManager.jsx`, `SocketDebugger.jsx`.

**Common (`src/components/common/`):** `Button`, `Cart` (+ `loadCart`, `refreshCart`,
`handleQuantityChange`, `removeItem`, `clearCart`, `handleCheckout`,
`start/save/cancelEditingQuantity`, `calculateTotal/TotalQuantity/TotalWeight`),
`CartItemCard` (`calculateLossWeight`), `CategoryFilterGroup`, `CityPickerModal`,
`CountryPickerModal`, `CustomHeader`, `CustomLoader`, `CustomSlider`,
`CustomTextInput`, `ErrorBoundary`, `Header`, `LoginPromptModal`,
`NavigationLoader`, `OtpInput`, `ProfilePhotoName`, `ScreenLoader`, `SearchBar`.

---

## 8. Utils — `src/utils/`

- **`imageUtils.ts`** — `getProductImageUrl`, `getCategoryImageUrl`, `getSliderImageUrl`, `getProfileImageUrl`
- **`responsive.ts`** — screen/density helpers: `isSmall/Medium/LargeScreen`, `isShort/Tall Screen`, `getAspectRatio`, `getPixelRatio`, `getResponsiveSpacing`, `getResponsiveFontSize`
- **`responsiveConfig.ts`** — `wp`, `hp`, `getResponsiveValue`, `getResponsiveHeightValue`, `getPlatformValue`, `getSafeAreaPadding`, plus `BREAKPOINTS`, `SPACING`, `FONT_SIZES`, `TOUCH_TARGETS`, `COMMON_STYLES`, `IMAGE_SIZES`, `MODAL_SIZES`, `SCREEN` constants
