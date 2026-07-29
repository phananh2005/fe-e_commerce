---
version: V3.7.0
date: 2026-07-29
summary: Cập nhật Management User API sử dụng UUID
breaking_change: true
---

# V3.7.0: Cập nhật API Quản lý Người dùng (Management) sử dụng UUID

## Danh sách API thay đổi
- `GET /management/users` (Lấy danh sách người dùng)
- `GET /management/users/info/{uuid}` (Lấy thông tin chi tiết người dùng)
- `PATCH /management/users/update-role` (Cập nhật vai trò người dùng)
- `PATCH /management/users/{uuid}/{status}` (Cập nhật trạng thái người dùng)

## Chi tiết thay đổi

Toàn bộ các ID mang tính chất nội bộ (kiểu `Long`) trong API quản trị người dùng đã bị loại bỏ khỏi request/response và path variable, yêu cầu FE sử dụng `UUID` để thay thế. **Đây là một Breaking Change**.

1. **`GET /management/users`**:
   - Response DTO (`UserSummaryForManagementResponse`): Trường `id` bị ẩn đi (không trả về). FE dùng trường `uuid` thay thế.

2. **`GET /management/users/info/{uuid}`**:
   - Path variable: Thay `id` (Long) bằng `uuid` (String).
   - Response DTO (`UserInfoResponseForManagement`): Trường `id` bị ẩn đi (không trả về). FE dùng trường `uuid` thay thế.

3. **`PATCH /management/users/update-role`**:
   - Request DTO (`UserRoleUpdateRequest`): Xóa trường `userId` (Long), thêm trường `userUuid` (String). 

4. **`PATCH /management/users/{uuid}/{status}`**:
   - Path variable: Thay `id` (Long) bằng `uuid` (String) đại diện cho User UUID.

*Lưu ý:* Các trường `id` trong response đã bị ẩn bằng `@JsonIgnore` và sẽ không xuất hiện trong chuỗi JSON trả về.

## Hướng dẫn FE cập nhật
- Khi cần xem chi tiết, phân quyền hoặc khóa/mở khóa tài khoản, FE lấy `uuid` của user thay vì `id`.
- Sửa lại các request body (khi update role) dùng `userUuid`.
- Sửa lại các endpoint truyền `uuid` lên thay cho `id` (như get info và update status).
