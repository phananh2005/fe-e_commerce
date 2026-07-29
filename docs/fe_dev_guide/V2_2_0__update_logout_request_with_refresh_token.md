---
version: 2.2.0
date: 2026-07-28
author: Antigravity
---
# Cập nhật API Đăng xuất (Logout)

## Thay đổi
Cập nhật API `/auth/logout` để nhận thêm `accessToken` và `refreshToken` thay vì chỉ nhận `token`.

## Chi tiết API
- **Endpoint**: `POST /auth/logout`
- **Thay đổi request body**:
  - Xóa field: `token`
  - Thêm field: `accessToken` (chuỗi JWT của access token, bắt buộc)
  - Thêm field: `refreshToken` (chuỗi JWT của refresh token, bắt buộc)

### Request mới
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

## Lý do thay đổi
Bảo mật hệ thống bằng việc lưu trữ Refresh Token trong Database. Khi người dùng đăng xuất, cả Access Token (bị chặn qua Redis) và Refresh Token (bị xoá khỏi DB) sẽ không thể được sử dụng lại nữa.

## Hướng dẫn cho Frontend
- FE cần cập nhật hàm gọi API `/auth/logout` để truyền lên cả 2 tham số `accessToken` và `refreshToken`.
- Đảm bảo bắt được lỗi 400 nếu truyền thiếu 1 trong 2 tham số này.

## Trạng thái Breaking Change
**CÓ** (Breaking Change). Mọi client cũ gửi `token` sẽ không được hỗ trợ nữa.
