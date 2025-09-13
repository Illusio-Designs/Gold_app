# Gold App Backend API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Controllers](#controllers)
   - [AppIconController](#appiconcontroller)
   - [AppVersionController](#appversioncontroller)
   - [CartController](#cartcontroller)
   - [CategoryController](#categorycontroller)
   - [DashboardController](#dashboardcontroller)
   - [LoginRequestController](#loginrequestcontroller)
   - [MediaGalleryController](#mediagallerycontroller)
   - [NotificationController](#notificationcontroller)
   - [OrderController](#ordercontroller)
   - [ProductController](#productcontroller)
   - [SearchController](#searchcontroller)
   - [SliderController](#slidercontroller)
   - [UploadController](#uploadcontroller)
   - [UserController](#usercontroller)
4. [Common Features](#common-features)
5. [Error Handling](#error-handling)
6. [Response Format](#response-format)

## Overview

The Gold App Backend is a comprehensive Node.js API built for a jewelry/gold trading application. It provides real-time functionality, advanced image processing, user management, and e-commerce features.

### Technology Stack

- **Runtime**: Node.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket (Socket.io)
- **File Storage**: Local + Cloudinary
- **Image Processing**: Sharp
- **Push Notifications**: Firebase Cloud Messaging (FCM)

### Base URL

```
http://172.20.10.10:3001/api
```

## Authentication

The API uses JWT-based authentication with role-based access control.

### User Types

- **Admin**: Full system access
- **Business**: Limited access to approved features

### Authentication Headers

```http
Authorization: Bearer <jwt_token>
```

### Token Structure

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "type": "admin|business",
  "exp": "expiration_timestamp"
}
```

---

## Controllers

### AppIconController

Manages dynamic app icons for mobile applications.

#### Endpoints

| Method | Endpoint                             | Description          | Auth Required |
| ------ | ------------------------------------ | -------------------- | ------------- |
| POST   | `/app-icons`                         | Create new app icon  | Admin         |
| GET    | `/app-icons`                         | Get all app icons    | Admin         |
| GET    | `/app-icons/:id`                     | Get app icon by ID   | Admin         |
| PUT    | `/app-icons/:id`                     | Update app icon      | Admin         |
| DELETE | `/app-icons/:id`                     | Delete app icon      | Admin         |
| POST   | `/app-icons/:id/activate`            | Activate app icon    | Admin         |
| GET    | `/app-icons/current/:platform/:type` | Get current app icon | Public        |
| GET    | `/app-icons/active/:platform`        | Get active app icons | Public        |
| GET    | `/app-icons/stats`                   | Get icon statistics  | Admin         |

#### Request/Response Examples

**Create App Icon**

```http
POST /api/app-icons
Content-Type: multipart/form-data

{
  "icon_name": "New Year Icon",
  "icon_type": "primary",
  "platform": "android",
  "is_active": true,
  "priority": 1,
  "start_date": "2024-01-01",
  "end_date": "2024-01-31"
}
```

**Response**

```json
{
  "success": true,
  "message": "App icon created successfully",
  "icon": {
    "id": 1,
    "icon_name": "New Year Icon",
    "icon_type": "primary",
    "platform": "android",
    "icon_path": "https://cloudinary.com/image.jpg",
    "is_active": true,
    "priority": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### AppVersionController

Manages mobile app versions and update checking.

#### Endpoints

| Method | Endpoint                           | Description              | Auth Required |
| ------ | ---------------------------------- | ------------------------ | ------------- |
| GET    | `/app-versions/check`              | Check for app updates    | Public        |
| GET    | `/app-versions/latest/:platform`   | Get latest version       | Public        |
| POST   | `/app-versions`                    | Create app version       | Admin         |
| GET    | `/app-versions`                    | Get all versions         | Admin         |
| GET    | `/app-versions/platform/:platform` | Get versions by platform | Admin         |
| PUT    | `/app-versions/:id`                | Update app version       | Admin         |
| DELETE | `/app-versions/:id`                | Delete app version       | Admin         |
| POST   | `/app-versions/:id/activate`       | Activate version         | Admin         |

#### Request/Response Examples

**Check App Update**

```http
GET /api/app-versions/check?platform=android&version_code=100
```

**Response**

```json
{
  "update_available": true,
  "force_update": false,
  "update_type": "minor",
  "version_code": 101,
  "version_name": "1.0.1",
  "download_url": "https://play.google.com/app",
  "release_notes": "Bug fixes and improvements",
  "message": "Update available"
}
```

---

### CartController

Manages shopping cart operations with real-time updates.

#### Endpoints

| Method | Endpoint                   | Description               | Auth Required |
| ------ | -------------------------- | ------------------------- | ------------- |
| POST   | `/cart/add`                | Add item to cart          | Business      |
| GET    | `/cart/user/:user_id`      | Get user's cart           | Business      |
| PUT    | `/cart/item/:cart_item_id` | Update cart item quantity | Business      |
| DELETE | `/cart/item/:cart_item_id` | Remove item from cart     | Business      |
| DELETE | `/cart/clear/:user_id`     | Clear user's cart         | Business      |
| GET    | `/cart/item/:cart_item_id` | Get cart item details     | Business      |

#### Request/Response Examples

**Add to Cart**

```http
POST /api/cart/add
Content-Type: application/json

{
  "user_id": 123,
  "product_id": 456,
  "quantity": 2
}
```

**Response**

```json
{
  "message": "Item added to cart successfully",
  "cartItem": {
    "id": 789,
    "user_id": 123,
    "product_id": 456,
    "quantity": 2,
    "product_name": "Gold Ring",
    "product_sku": "GR001",
    "mark_amount": 50000,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### CategoryController

Manages product categories with advanced image processing.

#### Endpoints

| Method | Endpoint          | Description               | Auth Required |
| ------ | ----------------- | ------------------------- | ------------- |
| GET    | `/categories`     | Get all active categories | Public        |
| GET    | `/categories/:id` | Get category by ID        | Public        |
| POST   | `/categories`     | Create new category       | Admin         |
| PUT    | `/categories/:id` | Update category           | Admin         |
| DELETE | `/categories/:id` | Delete category           | Admin         |

#### Request/Response Examples

**Get All Categories**

```http
GET /api/categories
```

**Response**

```json
[
  {
    "id": 1,
    "name": "Gold Rings",
    "description": "Beautiful gold rings collection",
    "image": "rings.jpg",
    "processedImageUrl": "http://172.20.10.10:3001/uploads/categories/rings-cleaned.webp",
    "originalImageUrl": "http://172.20.10.10:3001/uploads/categories/rings.jpg",
    "imageUrl": "http://172.20.10.10:3001/uploads/categories/rings-cleaned.webp",
    "hasProcessedImage": true,
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### DashboardController

Provides analytics and statistics for admin dashboard.

#### Endpoints

| Method | Endpoint                  | Description                            | Auth Required |
| ------ | ------------------------- | -------------------------------------- | ------------- |
| GET    | `/dashboard/stats`        | Get comprehensive dashboard statistics | Admin         |
| GET    | `/dashboard/today-orders` | Get today's orders with details        | Admin         |
| GET    | `/dashboard/quick-stats`  | Get lightweight statistics             | Admin         |

#### Request/Response Examples

**Get Dashboard Stats**

```http
GET /api/dashboard/stats
```

**Response**

```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 15,
      "revenue": 2500000,
      "pending": 3,
      "approved": 8,
      "completed": 4,
      "cancelled": 0,
      "averageOrderValue": 166666.67
    },
    "totals": {
      "approvedUsers": 150,
      "products": 500,
      "categories": 25
    },
    "metrics": {
      "conversionRate": 10.0,
      "averageOrderValue": 166666.67
    },
    "recentOrders": [...],
    "monthlyRevenue": [...],
    "topProducts": [...]
  }
}
```

---

### LoginRequestController

Manages user login requests and approval system with **category-based filtering**. After approval, users only receive data for their specifically requested categories.

#### Endpoints

| Method | Endpoint                                      | Description                                                | Auth Required |
| ------ | --------------------------------------------- | ---------------------------------------------------------- | ------------- |
| POST   | `/login-requests`                             | Create login request                                       | Public        |
| GET    | `/login-requests`                             | Get all login requests                                     | Admin         |
| GET    | `/login-requests/user/:userId`                | Get user's login requests                                  | Business      |
| PUT    | `/login-requests/:requestId`                  | Update login request status                                | Admin         |
| GET    | `/login-requests/approved-categories/:userId` | Get user's requested categories (active with images)       | Business      |
| GET    | `/login-requests/approved-products/:userId`   | Get products from user's approved categories (active only) | Business      |

#### Category Filtering Behavior

**Important**: The system implements strict category-based filtering:

1. **User Registration**: Users select 2-5 categories they want access to
2. **Admin Approval**: Admin approves the request with selected categories
3. **Data Access**: After approval, users ONLY receive:
   - Categories: Only their requested categories (active with images)
   - Products: Only products from their approved categories (active status)
   - No access to other categories or products

**Response Format**: All filtered endpoints return:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": [...],
  "count": 5,
  "requested_categories": [1, 2, 3],
  "approved_request_id": 123
}
```

#### Request/Response Examples

**Create Login Request**

```http
POST /api/login-requests
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "categoryIds": [1, 2, 3],
  "country_code": "+1",
  "userId": 123
}
```

**Response**

```json
{
  "message": "Login request created successfully"
}
```

---

### MediaGalleryController

Manages media files and gallery operations.

#### Endpoints

| Method | Endpoint                       | Description                           | Auth Required |
| ------ | ------------------------------ | ------------------------------------- | ------------- |
| GET    | `/media`                       | Get all media files                   | Admin         |
| GET    | `/media/stats`                 | Get media statistics                  | Admin         |
| POST   | `/media/upload`                | Upload single media file              | Admin         |
| POST   | `/media/bulk-upload`           | Upload multiple media files           | Admin         |
| DELETE | `/media/delete`                | Delete media file                     | Admin         |
| GET    | `/media/info/:encodedPath`     | Get file information                  | Admin         |
| GET    | `/media/available-items`       | Get available products and categories | Admin         |
| GET    | `/media/processed-images`      | Get items with processed images       | Admin         |
| GET    | `/media/serve/:type/:filename` | Serve media file                      | Public        |

#### Request/Response Examples

**Upload Media**

```http
POST /api/media/upload
Content-Type: multipart/form-data

file: [binary data]
```

**Response**

```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "originalName": "image.jpg",
    "fileName": "processed_image.webp",
    "filePath": "media/processed_image.webp",
    "fileType": "image",
    "fileSize": 1024000,
    "mimeType": "image/webp"
  }
}
```

---

### NotificationController

Handles push notifications and messaging system.

#### Endpoints

| Method | Endpoint                                      | Description                          | Auth Required |
| ------ | --------------------------------------------- | ------------------------------------ | ------------- |
| POST   | `/notifications`                              | Create and send notification         | Admin         |
| GET    | `/notifications/user/:userId`                 | Get user notifications               | Business      |
| GET    | `/notifications/unread-count/:userId`         | Get unread count                     | Business      |
| PUT    | `/notifications/:notificationId/read/:userId` | Mark as read                         | Business      |
| PUT    | `/notifications/mark-all-read/:userId`        | Mark all as read                     | Business      |
| DELETE | `/notifications/:notificationId`              | Delete notification                  | Admin         |
| POST   | `/notifications/register-token`               | Register FCM token                   | Business      |
| POST   | `/notifications/register-token-unauth`        | Register FCM token (unauthenticated) | Public        |
| GET    | `/notifications/tokens`                       | Get stored tokens                    | Admin         |
| POST   | `/notifications/subscribe-topic`              | Subscribe to topic                   | Business      |
| POST   | `/notifications/unsubscribe-topic`            | Unsubscribe from topic               | Business      |
| GET    | `/notifications/vapid-key`                    | Get VAPID key                        | Public        |
| GET    | `/notifications/sse`                          | Server-sent events                   | Public        |

#### Request/Response Examples

**Register FCM Token**

```http
POST /api/notifications/register-token
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "fcm_token_string",
  "deviceType": "mobile"
}
```

**Response**

```json
{
  "message": "FCM token registered successfully"
}
```

---

### OrderController

Manages order processing and tracking.

#### Endpoints

| Method | Endpoint                | Description                | Auth Required |
| ------ | ----------------------- | -------------------------- | ------------- |
| POST   | `/orders`               | Create new order           | Business      |
| POST   | `/orders/from-cart`     | Create order from cart     | Business      |
| GET    | `/orders`               | Get all orders             | Admin         |
| GET    | `/orders/user/:user_id` | Get user's orders          | Business      |
| GET    | `/orders/current`       | Get current user's orders  | Business      |
| GET    | `/orders/:id`           | Get order by ID            | Business      |
| PUT    | `/orders/:id/status`    | Update order status        | Admin         |
| PUT    | `/orders/bulk-status`   | Bulk update order statuses | Admin         |
| PUT    | `/orders/:id`           | Update order details       | Admin         |
| DELETE | `/orders/:id`           | Delete order               | Admin         |
| GET    | `/orders/statistics`    | Get order statistics       | Admin         |
| GET    | `/orders/:id/pdf`       | Download order PDF         | Business      |

#### Request/Response Examples

**Create Order**

```http
POST /api/orders
Content-Type: application/json

{
  "business_user_id": 123,
  "product_id": 456,
  "total_qty": 2,
  "total_mark_amount": 100000,
  "total_net_weight": 10.5,
  "total_less_weight": 0.5,
  "total_gross_weight": 11.0,
  "status": "pending",
  "remark": "Urgent delivery",
  "courier_company": "FedEx"
}
```

**Response**

```json
{
  "message": "Order created successfully",
  "orderId": 789,
  "order": {
    "id": 789,
    "business_user_id": 123,
    "product_id": 456,
    "total_qty": 2,
    "total_mark_amount": 100000,
    "status": "pending",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### ProductController

Manages product catalog with advanced features.

#### Endpoints

| Method | Endpoint                                  | Description                         | Auth Required |
| ------ | ----------------------------------------- | ----------------------------------- | ------------- |
| POST   | `/products`                               | Create new product                  | Admin         |
| GET    | `/products`                               | Get all products                    | Public/Admin  |
| GET    | `/products/sku/:sku`                      | Get product by SKU                  | Public        |
| GET    | `/products/:id`                           | Get product by ID                   | Public        |
| PUT    | `/products/:id`                           | Update product                      | Admin         |
| DELETE | `/products/:id`                           | Delete product                      | Admin         |
| POST   | `/products/:productId/images`             | Upload product images               | Admin         |
| GET    | `/products/:productId/images`             | Get product images                  | Public        |
| DELETE | `/products/:productId/images/:imageIndex` | Delete product image                | Admin         |
| GET    | `/products/category/:categoryId`          | Get products by category            | Public/Admin  |
| POST   | `/products/import-excel`                  | Import products from Excel          | Admin         |
| POST   | `/products/add-watermarks`                | Add watermarks to existing products | Admin         |
| PUT    | `/products/:id/stock-status`              | Update stock status                 | Admin         |
| GET    | `/products/:id/stock-status`              | Get stock status                    | Admin         |
| GET    | `/products/:id/stock-history`             | Get stock history                   | Admin         |

#### Request/Response Examples

**Create Product**

```http
POST /api/products
Content-Type: multipart/form-data

{
  "category_id": 1,
  "name": "Gold Ring",
  "net_weight": 5.5,
  "gross_weight": 6.0,
  "size": "18",
  "sku": "GR001",
  "purity": "22K",
  "pieces": 1,
  "mark_amount": 50000,
  "image": [file]
}
```

**Response**

```json
{
  "message": "Product created successfully",
  "productId": 123
}
```

---

### SearchController

Provides search functionality across products and categories.

#### Endpoints

| Method | Endpoint             | Description                          | Auth Required |
| ------ | -------------------- | ------------------------------------ | ------------- |
| GET    | `/search`            | Search all (products and categories) | Public        |
| GET    | `/search/categories` | Search categories only               | Public        |
| GET    | `/search/products`   | Search products only                 | Public        |

#### Request/Response Examples

**Search All**

```http
GET /api/search?query=gold ring
```

**Response**

```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "type": "category",
        "id": 1,
        "name": "Gold Rings",
        "description": "Beautiful gold rings",
        "image": "rings.jpg",
        "status": "active"
      }
    ],
    "products": [
      {
        "type": "product",
        "id": 123,
        "name": "Gold Ring",
        "sku": "GR001",
        "purity": "22K",
        "mark_amount": 50000,
        "category_name": "Gold Rings",
        "images": ["ring1.webp", "ring2.webp"]
      }
    ],
    "totalResults": 2,
    "categoryCount": 1,
    "productCount": 1
  },
  "searchQuery": "gold ring"
}
```

---

### SliderController

Manages homepage sliders and banners.

#### Endpoints

| Method | Endpoint       | Description       | Auth Required |
| ------ | -------------- | ----------------- | ------------- |
| POST   | `/sliders`     | Create new slider | Admin         |
| GET    | `/sliders`     | Get all sliders   | Public        |
| GET    | `/sliders/:id` | Get slider by ID  | Public        |
| PUT    | `/sliders/:id` | Update slider     | Admin         |
| DELETE | `/sliders/:id` | Delete slider     | Admin         |

#### Request/Response Examples

**Create Slider**

```http
POST /api/sliders
Content-Type: multipart/form-data

{
  "title": "New Year Sale",
  "description": "50% off on all gold items",
  "link": "https://example.com/sale",
  "category_id": 1,
  "image": [file]
}
```

**Response**

```json
{
  "message": "Slider created successfully",
  "sliderId": 1
}
```

---

### UploadController

Handles profile image uploads.

#### Endpoints

| Method | Endpoint                | Description          | Auth Required |
| ------ | ----------------------- | -------------------- | ------------- |
| POST   | `/upload/profile-image` | Upload profile image | Business      |

#### Request/Response Examples

**Upload Profile Image**

```http
POST /api/upload/profile-image
Content-Type: multipart/form-data

image: [file]
```

**Response**

```json
{
  "filename": "profile_123.webp",
  "url": "/uploads/profile/profile_123.webp"
}
```

---

### UserController

Manages user authentication and profiles.

#### Endpoints

| Method | Endpoint                  | Description           | Auth Required  |
| ------ | ------------------------- | --------------------- | -------------- |
| POST   | `/users/register`         | Register new user     | Public         |
| POST   | `/users/admin-login`      | Admin login           | Public         |
| POST   | `/users/business-login`   | Business login        | Public         |
| PUT    | `/users/:userId/status`   | Update user status    | Admin          |
| GET    | `/users`                  | Get all users         | Admin          |
| POST   | `/users`                  | Create user (admin)   | Admin          |
| PUT    | `/users/:id`              | Update user profile   | Business/Admin |
| DELETE | `/users/:id`              | Delete user           | Admin          |
| POST   | `/users/check-exists`     | Check if user exists  | Public         |
| GET    | `/users/:id`              | Get user by ID        | Business/Admin |
| POST   | `/users/verify-otp`       | Verify business OTP   | Public         |
| GET    | `/users/validate-session` | Validate user session | Business       |
| POST   | `/users/logout`           | Logout user           | Business       |

#### Request/Response Examples

**Register User**

```http
POST /api/users/register
Content-Type: multipart/form-data

{
  "type": "business",
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone_number": "+1234567890",
  "business_name": "John's Jewelry",
  "address_line1": "123 Main St",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "gst_number": "GST123456",
  "pan_number": "PAN123456",
  "image": [file]
}
```

**Response**

```json
{
  "message": "User registered successfully",
  "userId": 123
}
```

**Business Login**

```http
POST /api/users/business-login
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

**Response**

```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": 123,
    "name": "John Doe",
    "phone_number": "+1234567890",
    "type": "business",
    "status": "approved"
  }
}
```

---

## Common Features

### Real-time Updates

All controllers support real-time updates via WebSocket connections. When data is modified, relevant clients receive instant notifications.

### Image Processing

Advanced image processing with:

- Automatic watermarking
- Format conversion (WebP)
- Multiple image sizes
- Cloudinary integration

### Error Handling

Consistent error responses with:

- HTTP status codes
- Descriptive error messages
- Detailed logging
- User-friendly error messages

### Validation

Comprehensive input validation:

- Required field checking
- Data type validation
- Business rule validation
- SQL injection prevention

### Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Session management
- Token expiration handling

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  }
}
```

### Pagination Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Real-time Update Format

```json
{
  "action": "created|updated|deleted",
  "data": {
    // Updated data
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Getting Started

### Prerequisites

- Node.js 14+
- MySQL 8.0+
- Redis (for sessions)

### Installation

```bash
cd Backend
npm install
```

### Environment Variables

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=gold_app
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FCM_SERVER_KEY=your_fcm_key
```

### Running the Server

```bash
npm start
```

The API will be available at `http://172.20.10.10:3001`

---

## Support

For technical support or questions about the API, please contact the development team or refer to the source code documentation.
