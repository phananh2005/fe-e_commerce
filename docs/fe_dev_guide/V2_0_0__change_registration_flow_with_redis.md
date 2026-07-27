# V2.0.0 - Thay đổi luồng đăng ký tài khoản (Lưu Redis 15 phút)

- **Ngày tạo:** 2026-07-27
- **Loại thay đổi:** Cập nhật flow đăng ký
- **Breaking Change:** Có

## Chi tiết thay đổi

Trước đây, khi gọi API `POST /auth/register`, hệ thống sẽ lưu ngay user vào database (trạng thái chưa verify số điện thoại). 
Từ phiên bản này, luồng đăng ký đã thay đổi:
1. Gọi API `POST /auth/register`: Hệ thống sẽ lưu tạm thông tin đăng ký vào Redis với thời gian hết hạn là 15 phút. User chưa được lưu vào database.
2. Gọi API `POST /auth/verify-sms`: Hệ thống sẽ kiểm tra Redis, nếu có thông tin đăng ký tạm thời, hệ thống mới tiến hành tạo user trong database và đánh dấu là đã xác thực số điện thoại.

## Hướng dẫn cập nhật Frontend

- Cần đảm bảo UI thông báo rõ ràng cho người dùng rằng họ có **15 phút** để hoàn tất việc xác thực số điện thoại bằng mã OTP.
- Nếu người dùng gọi `/auth/verify-sms` sau 15 phút, sẽ nhận lỗi vì thông tin đăng ký đã bị xóa khỏi Redis.
- Flow bắt buộc: `register` -> (trong vòng 15p) -> `verify-sms`. Không thể bỏ qua bước `verify-sms` nếu muốn tài khoản được lưu.
