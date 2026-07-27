# V1.8.0 - Bỏ API xác thực số điện thoại

- **Ngày:** 2026-07-27
- **Breaking Change:** Có

## API thay đổi
- Xóa API: `POST /users/verify-phone`

## Thay đổi chi tiết
- Backend đã xóa endpoint `POST /users/verify-phone` trong `CustomerUserController`.
- Không còn hỗ trợ gọi API xác thực số điện thoại từ customer profile (tại controller này).

## Hướng dẫn FE
- Xóa tất cả request gọi đến endpoint `POST /users/verify-phone`.
- Cập nhật UI, bỏ tính năng verify phone theo API cũ nếu đang dùng.
