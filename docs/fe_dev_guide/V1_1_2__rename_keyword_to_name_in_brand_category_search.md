# V1_1_2 - Đổi tên trường `keyword` thành `name` trong API tìm kiếm

**Version**: V1_1_2  
**Ngày tạo**: 2026-07-21  
**Mục đích**: Chuẩn hóa tên trường request parameter cho API tìm kiếm thương hiệu và danh mục

## API thay đổi

1. **Search Brand** - Tìm kiếm thương hiệu cho quản trị
2. **Search Category** - Tìm kiếm danh mục cho quản trị

## Chi tiết thay đổi

### Search Brand (Quản trị)
- **Endpoint**: `GET /api/v1/admin/brands/search`
- **Loại thay đổi**: Cập nhật request parameter
- **Trường bị thay đổi**:
  - `keyword` → `name`

**Request cũ**:
```json
{
  "keyword": "Nike",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

**Request mới**:
```json
{
  "name": "Nike",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

### Search Category (Quản trị)
- **Endpoint**: `GET /api/v1/admin/categories/search`
- **Loại thay đổi**: Cập nhật request parameter
- **Trường bị thay đổi**:
  - `keyword` → `name`

**Request cũ**:
```json
{
  "keyword": "Electronics",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

**Request mới**:
```json
{
  "name": "Electronics",
  "page": 0,
  "size": 10,
  "sortBy": "createdAt",
  "sortType": "DESC"
}
```

## Lý do thay đổi

Trường `keyword` chỉ dùng để lọc theo tên (name) của thương hiệu/danh mục. Việc đổi tên thành `name` giúp:
- Làm rõ ý nghĩa của trường
- Tránh nhầm lẫn với tìm kiếm full-text (mô tả, tags, v.v.)
- Cải thiện khả năng đọc và bảo trì code

## Hướng dẫn FE cập nhật

1. **Tìm kiếm thương hiệu**:
   - Thay thế `keyword` bằng `name` trong request object
   - Cập nhật form input hoặc state management nếu có mapping

2. **Tìm kiếm danh mục**:
   - Thay thế `keyword` bằng `name` trong request object
   - Cập nhật form input hoặc state management nếu có mapping

**Ví dụ cập nhật code**:
```javascript
// Cũ
const params = {
  keyword: searchTerm,
  page: 0,
  size: 10
};

// Mới
const params = {
  name: searchTerm,
  page: 0,
  size: 10
};
```

## Status

- **Breaking Change**: Có
- **Ảnh hưởng**: Trang quản lý thương hiệu, trang quản lý danh mục
- **Độ ưu tiên**: Cao

## Ghi chú

- Response không thay đổi
- HTTP method, endpoint URL không thay đổi
- Các trường khác trong request/response không bị ảnh hưởng
