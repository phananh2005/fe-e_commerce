# V1_3_3: Cập nhật response `GET /management/product/search` bổ sung audit fields

**Ngày tạo**: 2026-07-23  
**Loại thay đổi**: Cập nhật  
**Breaking Change**: Không

## 1. Các API thay đổi
- **`GET /management/product/search`**: Bổ sung các field audit vào response danh sách sản phẩm.

## 2. Chi tiết thay đổi

### Response
Thêm các field sau vào từng item trong `result.content`:
- `createdBy`
- `createdAt`
- `modifiedBy`
- `modifiedAt` đã tồn tại trước đó, giữ nguyên

### Mẫu response mới
```json
{
  "code": 1000,
  "message": "Get product successfully",
  "result": {
    "content": [
      {
        "id": 123,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "avatarUrl": "https://example.com/image.jpg",
        "name": "Sản phẩm A",
        "status": "ACTIVE",
        "createdBy": "admin@example.com",
        "createdAt": "2026-07-23T01:15:56",
        "modifiedBy": "admin@example.com",
        "modifiedAt": "2026-07-23T01:20:10"
      }
    ]
  }
}
```

## 3. Hướng dẫn cập nhật FE
- Cập nhật model/typing của danh sách sản phẩm quản trị để đọc thêm `createdBy`, `createdAt`, `modifiedBy`.
- Nếu màn hình danh sách chưa hiển thị các cột này thì không cần thay đổi UI ngay.
- Nếu có export hoặc tooltip audit, dùng các field mới từ response này.

## 4. Ảnh hưởng tới FE
- Module danh sách sản phẩm quản trị
- Các component hiển thị meta/audit của sản phẩm nếu có
