---
version: V2.1.2
date: 2026-07-28
author: Antigravity
---

# V2.1.2: Thêm kiểm tra trùng lặp số điện thoại trong API đăng ký

## 1. Tóm tắt thay đổi
- API bị ảnh hưởng: `POST /api/v1/auth/register` (hoặc endpoint tương ứng với hàm `register` của hệ thống).
- Thêm kiểm tra số điện thoại (phone number) đã tồn tại trong hệ thống trước khi cho phép đăng ký.

## 2. Chi tiết thay đổi

### 2.1. Response bổ sung
API `register` hiện có thể trả về một mã lỗi (error code) mới nếu người dùng sử dụng số điện thoại đã tồn tại.

- **Status Code**: `409 CONFLICT`
- **Error Code**: `PHONE_NUMBER_ALREADY_EXISTS`
- **Message**: "Phone number already exists"

## 3. Hướng dẫn cập nhật phía Frontend
- Cập nhật hàm xử lý lỗi khi gọi API đăng ký.
- Nếu nhận được `ErrorCode` là `PHONE_NUMBER_ALREADY_EXISTS`, hiển thị thông báo lỗi cho người dùng (ví dụ: "Số điện thoại này đã được đăng ký, vui lòng sử dụng số khác hoặc đăng nhập").
- Có thể thêm highlight hoặc focus vào ô nhập số điện thoại trên giao diện khi gặp lỗi này.

## 4. Breaking change
- KHÔNG (Đây chỉ là bổ sung logic validation và một error code mới, không thay đổi cấu trúc request/response hiện tại).
