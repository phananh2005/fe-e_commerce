# V1.1.1 — Add userId Filter to Management Order Search

**Version:** V1.1.1  
**Date:** 2026-07-21  
**Breaking Change:** No

## Summary

Thêm bộ lọc `userId` vào API `GET /management/order/search` để quản trị viên có thể lọc đơn hàng theo người dùng/khách hàng cụ thể.

## API Changes

### Endpoint: `GET /management/order/search`

**New Request Parameter:**

```typescript
interface OrderFilterRequest {
    orderCode?: string;
    createdFromDate?: string; // ISO 8601 datetime
    createdToDate?: string;   // ISO 8601 datetime
    status?: OrderStatus;
    userId?: number;          // NEW: Customer user ID to filter by
    page?: number;
    size?: number;
    sortBy?: string;
    sortType?: string;
}
```

**Response:** No change — same as previous version

## Frontend Implementation Guide

### 1. Update API Call (if using service/client library)

Add optional `userId` parameter to your order search request:

```typescript
// Example: Axios
const searchOrders = async (filters: OrderFilterRequest) => {
    const response = await axios.get('/management/order/search', {
        params: {
            orderCode: filters.orderCode,
            createdFromDate: filters.createdFromDate,
            createdToDate: filters.createdToDate,
            status: filters.status,
            userId: filters.userId,  // NEW
            page: filters.page,
            size: filters.size,
            sortBy: filters.sortBy,
            sortType: filters.sortType
        }
    });
    return response.data.result;
};
```

### 2. Update Order Filter Form (if applicable)

Add a new input field for userId filter:

```html
<!-- Example: React -->
<input
    type="number"
    placeholder="Customer User ID"
    value={filters.userId}
    onChange={(e) => setFilters({
        ...filters,
        userId: e.target.value ? parseInt(e.target.value) : undefined
    })}
/>
```

### 3. Backward Compatibility

- Omitting `userId` parameter (leaving it null/undefined) will return all orders regardless of user
- No changes needed if you don't want to use this filter

## Testing

Test cases for QA:

1. **Filter by userId:** Call API with userId=123 → should return only orders where userId=123
2. **Multiple filters combined:** Call with userId=123 AND status=CONFIRMED → should return only CONFIRMED orders of user 123
3. **Null userId:** Call without userId parameter → should return all orders (like before)
4. **Invalid userId:** Call with userId that doesn't exist → should return empty page (no error)

## Ảnh Hưởng

- **Màn hình:** Quản trị viên có thể áp dụng trên trang quản lý đơn hàng
- **Module:** Order Management
- **Flow:** Không thay đổi flow, chỉ thêm khả năng filter mới
