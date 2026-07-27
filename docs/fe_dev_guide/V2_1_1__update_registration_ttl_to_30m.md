# V2.1.1 - Cập nhật thời hạn lưu đăng ký lên 30 phút

- **Ngày tạo:** 2026-07-27
- **Loại thay đổi:** Cập nhật logic hệ thống
- **Breaking Change:** Không

## Chi tiết thay đổi

- Vì OTP của Firebase có hiệu lực trong 15 phút, việc chỉ lưu thông tin trong Redis 15 phút sẽ khiến việc gửi lại OTP bị gián đoạn.
- Đã tăng thời gian lưu thông tin đăng ký tạm (khi gọi `POST /auth/register`) từ **15 phút lên 30 phút**.
- API `POST /auth/resend-otp` cũng sẽ reset lại thời gian lưu trữ trong Redis thành **30 phút**.

## Hướng dẫn cập nhật Frontend

- Cập nhật lại UI thông báo thời gian để phù hợp với logic mới (nếu UI có ghi cứng "15 phút", vui lòng đổi thành "30 phút" hoặc thông báo phù hợp).
