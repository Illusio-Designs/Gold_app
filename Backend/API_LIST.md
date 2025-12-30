# API Documentation

Base URL: `/api`

All endpoints return JSON responses.

---

## Health Check

### GET `/api/health`
- **Description**: Health check endpoint
- **Authentication**: None
- **Response**: 
  ```json
  {
    "status": "OK",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "environment": "production"
  }
  ```

---

## User APIs (`/api/users`)

### Public Routes

#### POST `/api/users/register`
- **Description**: Register a new user
- **Authentication**: None
- **Body**: Form data with `image` (optional)
- **Response**: User object

#### POST `/api/users/admin/login`
- **Description**: Admin login
- **Authentication**: None
- **Body**: `{ phoneNumber, password }`
- **Response**: Token and user data

#### POST `/api/users/business/login`
- **Description**: Business user login
- **Authentication**: None
- **Body**: `{ phoneNumber, password }`
- **Response**: Token and user data

#### POST `/api/users/check-exists`
- **Description**: Check if user exists
- **Authentication**: None
- **Body**: `{ phoneNumber }`
- **Response**: `{ exists: boolean }`

#### POST `/api/users/verify-otp`
- **Description**: Verify OTP for business user
- **Authentication**: None
- **Body**: `{ phoneNumber }`
- **Response**: Verification result

### Protected Routes (Require Authentication)

#### GET `/api/users`
- **Description**: Get all users (Admin only)
- **Authentication**: Required (Admin)
- **Response**: Array of users

#### GET `/api/users/:id`
- **Description**: Get user by ID
- **Authentication**: Required
- **Response**: User object

#### POST `/api/users`
- **Description**: Create new user (Admin only)
- **Authentication**: Required (Admin)
- **Body**: Form data with `image` (optional)
- **Response**: Created user

#### PUT `/api/users/:id`
- **Description**: Update user
- **Authentication**: Required
- **Body**: Form data with `image` (optional)
- **Response**: Updated user

#### DELETE `/api/users/:id`
- **Description**: Delete user (Admin only)
- **Authentication**: Required (Admin)
- **Response**: Success message

#### PATCH `/api/users/:userId/status`
- **Description**: Update user status (Admin only)
- **Authentication**: Required (Admin)
- **Body**: `{ status: string }`
- **Response**: Updated user

#### POST `/api/users/upload-profile`
- **Description**: Upload profile image
- **Authentication**: Required
- **Body**: Form data with `image`
- **Response**: Upload result

---

## Product APIs (`/api/products`)

### Public Routes

#### GET `/api/products`
- **Description**: Get all active products
- **Authentication**: None
- **Response**: Array of products

#### GET `/api/products/:id`
- **Description**: Get product by ID
- **Authentication**: None
- **Response**: Product object

#### GET `/api/products/category/:categoryId`
- **Description**: Get products by category
- **Authentication**: None
- **Response**: Array of products

#### GET `/api/products/sku/:sku`
- **Description**: Get product by SKU
- **Authentication**: None
- **Response**: Product object

#### GET `/api/products/:id/stock-status`
- **Description**: Get product stock status
- **Authentication**: None
- **Response**: Stock status object

#### GET `/api/products/:id/stock-history`
- **Description**: Get product stock history
- **Authentication**: None
- **Response**: Array of stock history records

#### GET `/api/products/:productId/images`
- **Description**: Get product images
- **Authentication**: None
- **Response**: Array of image URLs

### Protected Routes (Admin Only)

#### POST `/api/products`
- **Description**: Create new product
- **Authentication**: Required (Admin)
- **Body**: Form data with `image` (optional)
- **Response**: Created product

#### PUT `/api/products/:id`
- **Description**: Update product
- **Authentication**: Required (Admin)
- **Body**: Form data with `image` (optional)
- **Response**: Updated product

#### DELETE `/api/products/:id`
- **Description**: Delete product
- **Authentication**: Required (Admin)
- **Response**: Success message

#### PATCH `/api/products/:id/stock-status`
- **Description**: Update product stock status
- **Authentication**: Required (Admin)
- **Body**: `{ stock_status: string }`
- **Response**: Updated product

#### POST `/api/products/:productId/images`
- **Description**: Upload product images (max 5)
- **Authentication**: Required (Admin)
- **Body**: Form data with `images[]` (array)
- **Response**: Upload result

#### DELETE `/api/products/:productId/images/:imageIndex`
- **Description**: Delete product image
- **Authentication**: Required (Admin)
- **Response**: Success message

#### POST `/api/products/import-excel`
- **Description**: Import products from Excel file
- **Authentication**: Required (Admin)
- **Body**: Form data with `excelFile`
- **Response**: Import result

#### POST `/api/products/debug-excel`
- **Description**: Debug Excel file structure
- **Authentication**: Required (Admin)
- **Body**: Form data with `excelFile`
- **Response**: Excel structure analysis

#### POST `/api/products/add-watermarks`
- **Description**: Add watermarks to existing products
- **Authentication**: Required (Admin)
- **Response**: Processing result

---

## Category APIs (`/api/categories`)

### Public Routes

#### GET `/api/categories`
- **Description**: Get all active categories with images
- **Authentication**: None
- **Response**: Array of categories

#### GET `/api/categories/:id`
- **Description**: Get category by ID
- **Authentication**: None
- **Response**: Category object

### Protected Routes (Admin Only)

#### POST `/api/categories`
- **Description**: Create new category
- **Authentication**: Required (Admin)
- **Body**: Form data with `image` (optional)
- **Response**: Created category

#### PUT `/api/categories/:id`
- **Description**: Update category
- **Authentication**: Required (Admin)
- **Body**: Form data with `image` (optional)
- **Response**: Updated category

#### DELETE `/api/categories/:id`
- **Description**: Delete category
- **Authentication**: Required (Admin)
- **Response**: Success message

---

## Order APIs (`/api/orders`)

All routes require authentication.

#### POST `/api/orders`
- **Description**: Create new order
- **Authentication**: Required
- **Body**: Order data
- **Response**: Created order

#### POST `/api/orders/from-cart`
- **Description**: Create order from cart (multiple products)
- **Authentication**: Required
- **Body**: Cart data
- **Response**: Created order

#### GET `/api/orders`
- **Description**: Get all orders
- **Authentication**: Required
- **Response**: Array of orders

#### GET `/api/orders/my-orders`
- **Description**: Get current user's orders
- **Authentication**: Required
- **Response**: Array of orders

#### GET `/api/orders/user/:user_id`
- **Description**: Get orders by user ID
- **Authentication**: Required
- **Response**: Array of orders

#### GET `/api/orders/stats/statistics`
- **Description**: Get order statistics
- **Authentication**: Required
- **Response**: Statistics object

#### GET `/api/orders/:id`
- **Description**: Get order by ID
- **Authentication**: Required
- **Response**: Order object

#### GET `/api/orders/:id/pdf`
- **Description**: Download order PDF
- **Authentication**: Required
- **Response**: PDF file

#### PUT `/api/orders/:id`
- **Description**: Update order with full details
- **Authentication**: Required
- **Body**: Order data
- **Response**: Updated order

#### PATCH `/api/orders/:id/status`
- **Description**: Update order status (individual product status)
- **Authentication**: Required
- **Body**: `{ status: string }`
- **Response**: Updated order

#### PATCH `/api/orders/bulk-status`
- **Description**: Bulk update order statuses
- **Authentication**: Required
- **Body**: Array of order updates
- **Response**: Update result

#### DELETE `/api/orders/:id`
- **Description**: Delete order
- **Authentication**: Required
- **Response**: Success message

---

## Cart APIs (`/api/cart`)

All routes require authentication.

#### POST `/api/cart/add`
- **Description**: Add item to cart
- **Authentication**: Required
- **Body**: `{ product_id, quantity }`
- **Response**: Cart item

#### GET `/api/cart/user/:user_id`
- **Description**: Get user's cart
- **Authentication**: Required
- **Response**: Cart object with items

#### GET `/api/cart/item/:cart_item_id`
- **Description**: Get specific cart item
- **Authentication**: Required
- **Response**: Cart item

#### PUT `/api/cart/item/:cart_item_id/quantity`
- **Description**: Update cart item quantity
- **Authentication**: Required
- **Body**: `{ quantity: number }`
- **Response**: Updated cart item

#### DELETE `/api/cart/item/:cart_item_id`
- **Description**: Remove item from cart
- **Authentication**: Required
- **Response**: Success message

#### DELETE `/api/cart/user/:user_id/clear`
- **Description**: Clear user's cart
- **Authentication**: Required
- **Response**: Success message

---

## Slider APIs (`/api/slider`)

#### POST `/api/slider`
- **Description**: Create new slider
- **Authentication**: None
- **Body**: Form data with `image`
- **Response**: Created slider

#### GET `/api/slider`
- **Description**: Get all sliders
- **Authentication**: None
- **Response**: Array of sliders

#### GET `/api/slider/:id`
- **Description**: Get slider by ID
- **Authentication**: None
- **Response**: Slider object

#### PUT `/api/slider/:id`
- **Description**: Update slider
- **Authentication**: None
- **Body**: Form data with `image` (optional)
- **Response**: Updated slider

#### DELETE `/api/slider/:id`
- **Description**: Delete slider
- **Authentication**: None
- **Response**: Success message

---

## Media Gallery APIs (`/api/media-gallery`)

All routes require authentication and admin access.

#### GET `/api/media-gallery/all`
- **Description**: Get all media files
- **Authentication**: Required (Admin)
- **Response**: Array of media files

#### GET `/api/media-gallery/stats`
- **Description**: Get media statistics
- **Authentication**: Required (Admin)
- **Response**: Statistics object

#### GET `/api/media-gallery/processed-images`
- **Description**: Get media items with processed images from products and categories
- **Authentication**: Required (Admin)
- **Response**: Array of processed media items

#### GET `/api/media-gallery/available-items`
- **Description**: Get available products and categories for manual selection
- **Authentication**: Required (Admin)
- **Response**: Array of items

#### GET `/api/media-gallery/file-info/:encodedPath`
- **Description**: Get file info by encoded path
- **Authentication**: Required (Admin)
- **Response**: File info object

#### GET `/api/media-gallery/serve/:type/:filename`
- **Description**: Serve media file
- **Authentication**: Required (Admin)
- **Response**: File stream

#### GET `/api/media-gallery/debug-database`
- **Description**: Debug database contents
- **Authentication**: Required (Admin)
- **Response**: Database debug info

#### POST `/api/media-gallery/upload`
- **Description**: Upload single media file
- **Authentication**: Required (Admin)
- **Body**: Form data with `image`
- **Response**: Upload result

#### POST `/api/media-gallery/bulk-upload`
- **Description**: Bulk upload media files (max 20)
- **Authentication**: Required (Admin)
- **Body**: Form data with `images[]` (array) and `autoDetect` (boolean)
- **Response**: Upload results with OCR and AI processing info

#### DELETE `/api/media-gallery/file`
- **Description**: Delete specific file
- **Authentication**: Required (Admin)
- **Body**: `{ filePath: string }`
- **Response**: Success message

#### DELETE `/api/media-gallery/orphaned`
- **Description**: Delete orphaned files
- **Authentication**: Required (Admin)
- **Response**: Success message

#### POST `/api/media-gallery/cleanup-orphaned-records`
- **Description**: Clean up orphaned database records
- **Authentication**: Required (Admin)
- **Response**: Success message

---

## Search APIs (`/api/search`)

All routes are public.

#### GET `/api/search/all`
- **Description**: Search all (categories and products)
- **Authentication**: None
- **Query**: `?q=search_term`
- **Response**: Search results

#### GET `/api/search/categories`
- **Description**: Search only categories
- **Authentication**: None
- **Query**: `?q=search_term`
- **Response**: Array of categories

#### GET `/api/search/products`
- **Description**: Search only products
- **Authentication**: None
- **Query**: `?q=search_term`
- **Response**: Array of products

---

## Dashboard APIs (`/api/dashboard`)

All routes require authentication and admin access.

#### GET `/api/dashboard/stats`
- **Description**: Get comprehensive dashboard statistics
- **Authentication**: Required (Admin)
- **Response**: Dashboard statistics

#### GET `/api/dashboard/today-orders`
- **Description**: Get today's orders with details
- **Authentication**: Required (Admin)
- **Response**: Array of today's orders

#### GET `/api/dashboard/quick-stats`
- **Description**: Get quick stats (lightweight version)
- **Authentication**: Required (Admin)
- **Response**: Quick statistics

---

## Login Request APIs (`/api/login-requests`)

#### POST `/api/login-requests`
- **Description**: Create login request (Business user)
- **Authentication**: None
- **Body**: Login request data
- **Response**: Created request

#### GET `/api/login-requests`
- **Description**: Get all login requests (Admin only)
- **Authentication**: Required (Admin)
- **Response**: Array of login requests

#### GET `/api/login-requests/user`
- **Description**: Get user's login requests (Business user)
- **Authentication**: Required (Business)
- **Response**: Array of user's requests

#### PATCH `/api/login-requests/:requestId`
- **Description**: Update login request (Admin only)
- **Authentication**: Required (Admin)
- **Body**: Update data
- **Response**: Updated request

#### GET `/api/login-requests/approved-categories/:userId`
- **Description**: Get approved and active categories for a user
- **Authentication**: Required (Business)
- **Response**: Array of approved categories

#### GET `/api/login-requests/approved-products/:userId`
- **Description**: Get products filtered by user's approved categories
- **Authentication**: Required (Business)
- **Response**: Array of approved products

---

## Notification APIs (`/api/notifications`)

All routes require authentication (except register-token-unauth and vapid-key).

#### POST `/api/notifications`
- **Description**: Create notification (Admin only)
- **Authentication**: Required
- **Body**: Notification data
- **Response**: Created notification

#### GET `/api/notifications/user/:userId`
- **Description**: Get user notifications
- **Authentication**: Required
- **Response**: Array of notifications

#### GET `/api/notifications/user/:userId/unread`
- **Description**: Get unread notification count
- **Authentication**: Required
- **Response**: `{ count: number }`

#### PATCH `/api/notifications/:notificationId/read`
- **Description**: Mark notification as read
- **Authentication**: Required
- **Response**: Updated notification

#### PATCH `/api/notifications/user/:userId/read-all`
- **Description**: Mark all notifications as read
- **Authentication**: Required
- **Response**: Success message

#### DELETE `/api/notifications/:notificationId`
- **Description**: Delete notification
- **Authentication**: Required
- **Response**: Success message

#### POST `/api/notifications/register-token`
- **Description**: Register FCM token for authenticated users
- **Authentication**: Required
- **Body**: `{ token: string }`
- **Response**: Success message

#### POST `/api/notifications/register-token-unauth`
- **Description**: Register FCM token for unauthenticated users
- **Authentication**: None
- **Body**: `{ token: string }`
- **Response**: Success message

#### POST `/api/notifications/subscribe-topic`
- **Description**: Subscribe user to topic
- **Authentication**: Required
- **Body**: `{ topic: string }`
- **Response**: Success message

#### POST `/api/notifications/unsubscribe-topic`
- **Description**: Unsubscribe user from topic
- **Authentication**: Required
- **Body**: `{ topic: string }`
- **Response**: Success message

#### GET `/api/notifications/vapid-key`
- **Description**: Get VAPID key for web push notifications
- **Authentication**: None
- **Response**: `{ publicKey: string }`

#### GET `/api/notifications/sse`
- **Description**: Server-Sent Events endpoint for real-time notifications
- **Authentication**: Required
- **Response**: SSE stream

#### GET `/api/notifications/debug/tokens`
- **Description**: Get stored tokens (for debugging)
- **Authentication**: Required
- **Response**: Array of tokens

---

## Admin Notifications APIs (`/api/admin-notifications`)

#### GET `/api/admin-notifications/stats`
- **Description**: Get admin notification statistics
- **Authentication**: None
- **Response**: Statistics object

#### GET `/api/admin-notifications/admin-clients`
- **Description**: Get connected admin clients info
- **Authentication**: None
- **Response**: Admin clients information

#### POST `/api/admin-notifications/test-notification`
- **Description**: Test real-time notification (for development)
- **Authentication**: None
- **Body**: `{ message: string, type: string }`
- **Response**: Test result

---

## SEO APIs (`/api/seo`)

#### GET `/api/seo`
- **Description**: Get SEO data by page URL
- **Authentication**: None
- **Query**: `?page_url=/privacy-policy`
- **Response**: SEO data object

---

## App Version APIs (`/api/app-versions`)

### Public Routes

#### GET `/api/app-versions/check-update`
- **Description**: Check for app update
- **Authentication**: None
- **Query**: `?platform=android|ios&current_version=1.0.0`
- **Response**: Update information

#### GET `/api/app-versions/latest/:platform`
- **Description**: Get latest version for platform
- **Authentication**: None
- **Params**: `platform` (android|ios)
- **Response**: Latest version object

### Protected Routes (Admin Only)

#### GET `/api/app-versions`
- **Description**: Get all app versions
- **Authentication**: Required (Admin)
- **Response**: Array of app versions

#### GET `/api/app-versions/platform/:platform`
- **Description**: Get versions by platform
- **Authentication**: Required (Admin)
- **Params**: `platform` (android|ios)
- **Response**: Array of versions

#### POST `/api/app-versions`
- **Description**: Create new app version
- **Authentication**: Required (Admin)
- **Body**: Version data
- **Response**: Created version

#### PUT `/api/app-versions/:id`
- **Description**: Update app version
- **Authentication**: Required (Admin)
- **Body**: Version data
- **Response**: Updated version

#### PATCH `/api/app-versions/:id/activate`
- **Description**: Activate app version
- **Authentication**: Required (Admin)
- **Response**: Activated version

#### DELETE `/api/app-versions/:id`
- **Description**: Delete app version
- **Authentication**: Required (Admin)
- **Response**: Success message

---

## App Icon APIs (`/api/app-icons`)

### Public Routes

#### GET `/api/app-icons/current/:platform`
- **Description**: Get current app icon for platform
- **Authentication**: None
- **Params**: `platform` (android|ios)
- **Response**: App icon object

#### GET `/api/app-icons/current/:platform/:type`
- **Description**: Get current app icon for platform and type
- **Authentication**: None
- **Params**: `platform` (android|ios), `type` (icon type)
- **Response**: App icon object

#### GET `/api/app-icons/active/:platform`
- **Description**: Get active app icons for platform
- **Authentication**: None
- **Params**: `platform` (android|ios)
- **Response**: Array of active icons

### Protected Routes (Admin Only)

#### GET `/api/app-icons`
- **Description**: Get all app icons
- **Authentication**: Required (Admin)
- **Response**: Array of app icons

#### GET `/api/app-icons/stats`
- **Description**: Get icon statistics
- **Authentication**: Required (Admin)
- **Response**: Statistics object

#### GET `/api/app-icons/:id`
- **Description**: Get app icon by ID
- **Authentication**: Required (Admin)
- **Response**: App icon object

#### POST `/api/app-icons`
- **Description**: Create new app icon
- **Authentication**: Required (Admin)
- **Body**: Form data with `icon_file` (image)
- **Response**: Created icon

#### PUT `/api/app-icons/:id`
- **Description**: Update app icon
- **Authentication**: Required (Admin)
- **Body**: Form data with `icon_file` (image, optional)
- **Response**: Updated icon

#### PATCH `/api/app-icons/:id/activate`
- **Description**: Activate app icon
- **Authentication**: Required (Admin)
- **Response**: Activated icon

#### DELETE `/api/app-icons/:id`
- **Description**: Delete app icon
- **Authentication**: Required (Admin)
- **Response**: Success message

---

## Static Files

#### GET `/uploads/*`
- **Description**: Serve uploaded files (images, documents)
- **Authentication**: None
- **Response**: File content

---

## Authentication

Most protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Token Types:
- **Admin Token**: Required for admin-only routes
- **Business Token**: Required for business user routes
- **User Token**: Required for general authenticated routes

---

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "error": "Error message"
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- File uploads use multipart/form-data
- Maximum file size: 50MB
- Bulk upload supports up to 20 files at once
- Image processing includes watermarking and WebP conversion
- OCR and AI processing available for bulk uploads (if configured)

