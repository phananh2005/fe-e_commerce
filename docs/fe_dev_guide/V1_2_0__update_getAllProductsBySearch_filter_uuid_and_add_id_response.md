# V1_2_0: Cập nhật API getAllProductsBySearch (Tìm kiếm bằng uuid, bổ sung id)

**Ngày tạo**: 2026-07-23  
**Loại thay đổi**: Cập nhật  
**Breaking Change**: Không

## 1. Các API thay đổi
- **`GET /management/product/search`**: Cập nhật bộ lọc và response.

## 2. Chi tiết thay đổi

### A. Thay đổi logic bộ lọc (Request)
- Tham số `productSearch` trước đây lọc theo `id` (nếu là số) và `name`.
- **Hiện tại**: `productSearch` lọc theo `uuid` (khớp chính xác) và `name` (tìm kiếm một phần).
- FE không cần thay đổi request payload, chỉ cần lưu ý hành vi tìm kiếm (nhập uuid hoặc tên sản phẩm để tìm kiếm).

### B. Thay đổi Response
- Thêm trường `id` vào `ProductResponseForManagement`.

**Mẫu response mới**:
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "content": [
      {
        "id": 123,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Sản phẩm A",
        "avatarUrl": "https://example.com/image.jpg",
        "status": "ACTIVE",
        "modifiedAt": "2026-07-23T01:15:56"
      }
    ],
    // ... pagination data
  }
}
```

## 3. Hướng dẫn cập nhật FE
- **Lưu ý**: FE **KHÔNG CẦN** hiển thị trường `id` này lên giao diện cho người dùng xem.
- Trường `id` được thêm vào payload response để phục vụ cho các API nội bộ khác (nếu cần gọi các tác vụ hoặc điều hướng sử dụng `id`).
- Các hàm gọi API search hiện tại vẫn hoạt động bình thường mà không cần sửa code giao diện.
