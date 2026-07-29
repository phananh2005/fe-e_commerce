# V2.2.1: Thay đổi logic kiểm tra refresh token (sử dụng Database thay vì Redis)

- **Version**: V2.2.1
- **Ngày tạo**: 2026-07-28
- **API bị ảnh hưởng**: `POST /auth/refresh`
- **Loại thay đổi**: Cập nhật logic (Internal)
- **Breaking change**: Không

## Chi tiết thay đổi

- Trước đây, API `/auth/refresh` kiểm tra tính hợp lệ của `refreshToken` (đã bị thu hồi hay chưa) thông qua Redis.
- Hiện tại, logic đã được thay đổi để kiểm tra trực tiếp trong Database. Khi một refresh token được sử dụng để lấy token mới, nó sẽ được tìm và xóa khỏi Database thay vì lưu vào danh sách thu hồi trong Redis.
- Thay đổi này giúp quản lý trạng thái refresh token chính xác và chủ động hơn ở phía server.
- Cấu trúc request và response của API `POST /auth/refresh` **KHÔNG THAY ĐỔI**.

## Hướng dẫn cho Frontend

- Frontend **không cần thay đổi** bất kỳ đoạn code nào, vẫn tiếp tục gọi API `/auth/refresh` và truyền vào `{ "refreshToken": "..." }` như trước đây.
- Lưu ý: refresh token cũ sẽ tự động hết hiệu lực (xóa khỏi DB) ngay khi API refresh được gọi thành công. Frontend phải cập nhật và sử dụng ngay cặp `accessToken` và `refreshToken` mới trả về từ response.
