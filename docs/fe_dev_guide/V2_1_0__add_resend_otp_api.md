# V2.1.0 - Thêm API gửi lại OTP (Reset thời gian lưu Redis)

- **Ngày tạo:** 2026-07-27
- **Loại thay đổi:** Thêm API mới
- **Breaking Change:** Không

## Chi tiết thay đổi

Trong luồng đăng ký (lưu Redis 15 phút), nếu người dùng yêu cầu gửi lại mã OTP (qua Firebase), thời gian 15 phút cần được reset lại để họ có đủ thời gian nhập OTP mới.
Đã thêm API mới để reset lại thời gian (TTL) của thông tin đăng ký trong Redis về 15 phút.

### API: Yêu cầu gửi lại OTP

- **Endpoint:** `POST /auth/resend-otp`
- **Mô tả:** Reset lại thời gian lưu trữ thông tin đăng ký trong Redis về 15 phút.
- **Request Body:**

```json
{
  "phoneNumber": "0987654321"
}
```

- **Response:** 
  - Thành công: `204 No Content`
  - Thất bại: Lỗi `USER_NOT_FOUND` (404/400 tuỳ exception handler) nếu thông tin đăng ký không tồn tại hoặc đã hết hạn (quá 15 phút trước khi gọi resend).

## Hướng dẫn cập nhật Frontend

- Khi người dùng bấm nút "Gửi lại OTP" trên giao diện xác thực SMS, FE cần:
  1. Yêu cầu Firebase gửi lại OTP.
  2. Đồng thời gọi API `POST /auth/resend-otp` với số điện thoại đang đăng ký để backend reset thời gian lưu thông tin trong Redis thêm 15 phút.
  3. Xử lý lỗi nếu API trả về không tìm thấy user (người dùng đã chờ quá 15 phút mới bấm gửi lại), yêu cầu người dùng quay lại màn hình đăng ký ban đầu.
