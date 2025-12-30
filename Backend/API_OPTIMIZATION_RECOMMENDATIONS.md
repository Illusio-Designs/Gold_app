# API Optimization Recommendations

## 📋 Summary
This document lists APIs that can be **merged** (combined into single endpoints) or **removed** (unused/debug endpoints).

---

## 🔄 APIs TO MERGE (Combine Similar Functionality)

### 1. **Product APIs** - Merge GET endpoints
**Current (4 separate endpoints):**
- `GET /api/products` - Get all products
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/sku/:sku` - Get product by SKU
- `GET /api/products/:id` - Get product by ID

**Recommended (1 unified endpoint):**
- `GET /api/products` 
  - Query params: `?category_id=123&sku=ABC123&id=456&search=term`
  - Returns: Filtered products based on query params
  - **Benefit**: Single endpoint, easier to maintain, more flexible

**Status**: ✅ Used in frontend - Need to update frontend calls

---

### 2. **Order APIs** - Merge GET endpoints
**Current (3 separate endpoints):**
- `GET /api/orders` - Get all orders
- `GET /api/orders/my-orders` - Get current user's orders
- `GET /api/orders/user/:user_id` - Get orders by user ID

**Recommended (1 unified endpoint):**
- `GET /api/orders`
  - Query params: `?user_id=123&my_orders=true&status=pending`
  - Returns: Filtered orders based on query params
  - **Benefit**: Single endpoint, consistent API pattern

**Status**: ✅ Used in frontend - Need to update frontend calls

---

### 3. **Search APIs** - Merge into single endpoint
**Current (3 separate endpoints):**
- `GET /api/search/all` - Search all
- `GET /api/search/categories` - Search categories only
- `GET /api/search/products` - Search products only

**Recommended (1 unified endpoint):**
- `GET /api/search`
  - Query params: `?q=term&type=all|categories|products`
  - Returns: Search results based on type
  - **Benefit**: Single endpoint, cleaner API structure

**Status**: ✅ Used in frontend - Need to update frontend calls

---

### 4. **App Version APIs** - Merge check-update and latest
**Current (2 separate endpoints):**
- `GET /api/app-versions/check-update` - Check for update
- `GET /api/app-versions/latest/:platform` - Get latest version

**Recommended (1 unified endpoint):**
- `GET /api/app-versions/latest/:platform`
  - Query params: `?current_version=1.0.0` (optional, for update check)
  - Returns: Latest version + update info if current_version provided
  - **Benefit**: Single endpoint handles both use cases

**Status**: ⚠️ Check frontend usage

---

### 5. **App Icon APIs** - Merge current icon endpoints
**Current (3 separate endpoints):**
- `GET /api/app-icons/current/:platform` - Get current icon
- `GET /api/app-icons/current/:platform/:type` - Get current icon with type
- `GET /api/app-icons/active/:platform` - Get active icons

**Recommended (1 unified endpoint):**
- `GET /api/app-icons/current/:platform`
  - Query params: `?type=icon_type&active_only=true`
  - Returns: Current/active icons based on params
  - **Benefit**: Single endpoint, more flexible

**Status**: ⚠️ Check frontend usage

---

### 6. **Media Gallery APIs** - Merge all and processed-images
**Current (2 separate endpoints):**
- `GET /api/media-gallery/all` - Get all media files
- `GET /api/media-gallery/processed-images` - Get processed images

**Recommended (1 unified endpoint):**
- `GET /api/media-gallery`
  - Query params: `?processed_only=true&type=product|category`
  - Returns: Filtered media items
  - **Benefit**: Single endpoint, clearer purpose

**Status**: ✅ Used in frontend - Need to update frontend calls

---

### 7. **Dashboard APIs** - Merge stats and quick-stats
**Current (2 separate endpoints):**
- `GET /api/dashboard/stats` - Comprehensive stats
- `GET /api/dashboard/quick-stats` - Lightweight stats

**Recommended (1 unified endpoint):**
- `GET /api/dashboard/stats`
  - Query params: `?quick=true` (for lightweight version)
  - Returns: Stats based on quick param
  - **Benefit**: Single endpoint, less duplication

**Status**: ✅ Used in frontend - Need to update frontend calls

---

## 🗑️ APIs TO REMOVE (Unused/Debug/Development Only)

### 1. **Debug/Development Endpoints** - Remove in production
**Endpoints to remove:**
- `GET /api/media-gallery/debug-database` - Debug endpoint
- `GET /api/notifications/debug/tokens` - Debug endpoint
- `POST /api/products/debug-excel` - Debug Excel structure
- `POST /api/admin-notifications/test-notification` - Test endpoint

**Reason**: Debug/test endpoints should not be in production
**Status**: ⚠️ Remove or protect with environment check

---

### 2. **Unused Media Gallery Endpoints**
**Endpoints to check/remove:**
- `GET /api/media-gallery/stats` - Media statistics (if not used)
- `GET /api/media-gallery/available-items` - Available items (if not used)
- `GET /api/media-gallery/file-info/:encodedPath` - File info (if not used)
- `GET /api/media-gallery/serve/:type/:filename` - Serve file (if not used)
- `DELETE /api/media-gallery/orphaned` - Delete orphaned (if not used)
- `POST /api/media-gallery/cleanup-orphaned-records` - Cleanup (if not used)
- `POST /api/media-gallery/upload` - Single upload (if only bulk-upload is used)

**Reason**: Check if these are actually used in frontend
**Status**: ⚠️ Verify usage before removing

---

### 3. **Unused Product Endpoints**
**Endpoints to check/remove:**
- `GET /api/products/:id/stock-status` - Stock status (if product object already includes this)
- `GET /api/products/:id/stock-history` - Stock history (if not used)
- `GET /api/products/:productId/images` - Product images (if product object already includes images)
- `POST /api/products/add-watermarks` - Add watermarks (one-time operation, can be removed after use)

**Reason**: Check if these are actually used
**Status**: ⚠️ Verify usage before removing

---

### 4. **Unused Order Endpoints**
**Endpoints to check/remove:**
- `GET /api/orders/stats/statistics` - Order statistics (if dashboard stats already includes this)
- `PUT /api/orders/:id` - Full order update (if PATCH is sufficient)
- `DELETE /api/orders/:id` - Delete order (if orders should not be deleted)

**Reason**: Check if these are actually used
**Status**: ⚠️ Verify usage before removing

---

### 5. **Unused Cart Endpoints**
**Endpoints to check/remove:**
- `GET /api/cart/item/:cart_item_id` - Get specific cart item (if not used)

**Reason**: Check if this is actually used
**Status**: ⚠️ Verify usage before removing

---

### 6. **Unused Notification Endpoints**
**Endpoints to check/remove:**
- `POST /api/notifications/subscribe-topic` - Subscribe to topic (if not used)
- `POST /api/notifications/unsubscribe-topic` - Unsubscribe from topic (if not used)
- `GET /api/notifications/vapid-key` - VAPID key (if web push not used)
- `GET /api/notifications/sse` - Server-Sent Events (if not used)

**Reason**: Check if these features are actually implemented
**Status**: ⚠️ Verify usage before removing

---

### 7. **Unused User Endpoints**
**Endpoints to check/remove:**
- `POST /api/users/check-exists` - Check if user exists (if not used)
- `POST /api/users/upload-profile` - Upload profile (if PUT /users/:id already handles this)

**Reason**: Check if these are actually used
**Status**: ⚠️ Verify usage before removing

---

### 8. **Unused App Version/Icon Endpoints**
**Endpoints to check/remove:**
- `GET /api/app-versions/platform/:platform` - Get versions by platform (if not used)
- `GET /api/app-icons/stats` - Icon statistics (if not used)

**Reason**: Check if these are actually used
**Status**: ⚠️ Verify usage before removing

---

## 📊 Summary Statistics

### Current API Count: ~107 endpoints

### After Optimization:
- **Merged APIs**: ~15 endpoints can be merged into ~5 endpoints
- **Removed APIs**: ~20-25 endpoints can be removed (debug/unused)
- **Final Count**: ~75-80 endpoints (30% reduction)

### Benefits:
1. ✅ Cleaner API structure
2. ✅ Easier to maintain
3. ✅ Better performance (fewer endpoints to route)
4. ✅ More consistent API patterns
5. ✅ Reduced codebase size

---

## ⚠️ Action Required

### Before Making Changes:
1. ✅ **Verify Frontend Usage**: Check which endpoints are actually called
2. ✅ **Update Frontend**: Modify frontend to use new merged endpoints
3. ✅ **Test Thoroughly**: Ensure all functionality still works
4. ✅ **Update Documentation**: Update API_LIST.md after changes

### Recommended Order:
1. **Phase 1**: Remove debug/test endpoints (safest)
2. **Phase 2**: Merge search APIs (simple merge)
3. **Phase 3**: Merge product/order APIs (requires frontend updates)
4. **Phase 4**: Remove unused endpoints (after verification)

---

## 📝 Notes

- All merges should maintain backward compatibility initially (or provide migration path)
- Debug endpoints can be kept but protected with environment checks
- Some endpoints might be used by mobile app - verify before removing
- Consider API versioning if breaking changes are needed

---

**Created**: 2025-01-XX
**Status**: Pending Approval

