# V1_3_4: Thêm query parameter `status` cho API tìm kiếm sản phẩm quản trị

**Ngày tạo**: 2026-07-23  
**Loại thay đổi**: Cập nhật  
**Breaking Change**: Không

## 1. Các API thay đổi
- **`GET /management/product/search`**: Thêm query parameter `status` để lọc sản phẩm theo trạng thái.

## 2. Chi tiết thay đổi

### Request
Thêm query parameter `status` tùy chọn:

```
GET /management/product/search?status=ACTIVE&page=0&size=10
```

**Giá trị hợp lệ**: `ACTIVE`, `INACTIVE`, `DRAFT`

**Hành vi**:
- Omitting `status`: trả về tất cả sản phẩm (mặc định, không lọc theo status)
- Valid values: Lọc sản phẩm theo status tương ứng
- Invalid values: Bị từ chối bởi request validation

### Mẫu request mới
```
GET /management/product/search?status=ACTIVE&page=0&size=10

GET /management/product/search?status=INACTIVE&page=0&size=10

GET /management/product/search?status=DRAFT&page=0&size=10

GET /management/product/search?page=0&size=10  // omit status, returns all
```

### Response
Response không thay đổi, vẫn giữ nguyên từ V1_3_3.

## 3. Hướng dẫn cập nhật FE
- Cập nhật request type/interface để bao gồm trường `status?: ProductStatus` (tùy chọn)
- Thêm UI filter/dropdown hoặc module để người dùng có thể chọn status filter (ACTIVE, INACTIVE, DRAFT)
- Khi gửi request search, nếu người dùng chọn status thì truyền tham số; nếu không chọn thì omit
- Test lại flow tìm kiếm sản phẩm với các giá trị status khác nhau

## 4. Ảnh hưởng tới FE
- Module danh sách sản phẩm quản trị
- Request type cho product search
- UI filter/dropdown status (tùy chọn)
