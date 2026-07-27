# V1.6.0: Thêm xác thực số điện thoại bằng Firebase Phone Auth

**Ngày tạo:** 2026-07-27
**API thay đổi:** `POST /register`, `POST /users/verify-phone` (Mới)
**Loại thay đổi:** Cập nhật, Tạo mới
**Breaking change:** Có

## Chi tiết thay đổi

### 1. Đăng ký tài khoản (POST `/register`)
Yêu cầu frontend phải gửi kèm `idToken` lấy từ Firebase sau khi người dùng nhập OTP thành công để xác thực số điện thoại ngay lúc đăng ký. Số điện thoại truyền lên sẽ được kiểm tra chéo với số điện thoại trong Firebase token.

#### Cập nhật Request Body
- Thêm trường `idToken` (bắt buộc)
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "address": "123 Street, City",
  "fullName": "Test User",
  "phoneNumber": "+84123456789",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZ..."
}
```

#### Các mã lỗi mới có thể trả về:
- `PHONE_NUMBER_MISMATCH` (400): Số điện thoại gửi lên không khớp với số trong Firebase token.
- `INVALID_FIREBASE_TOKEN` (401): Token không hợp lệ hoặc đã hết hạn.

---

### 2. Xác thực số điện thoại sau đăng nhập (POST `/users/verify-phone`) - API Mới
Dành cho trường hợp tài khoản được tạo bởi admin (chưa được xác thực số điện thoại). Người dùng tự xác thực trong trang cá nhân bằng cách gọi Firebase Phone Auth lấy token, sau đó gọi API này.

#### Request
- Header: `Authorization: Bearer <access_token>`
- Body:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZ..."
}
```

#### Response
- Status: `204 No Content` nếu thành công.

#### Các mã lỗi có thể trả về:
- `PHONE_NUMBER_MISMATCH` (400): Số điện thoại trong token không khớp với số đã đăng ký của tài khoản.
- `INVALID_FIREBASE_TOKEN` (401): Token không hợp lệ.

## Hướng dẫn cập nhật cho Frontend
1. **Trang đăng ký:** Tích hợp Firebase SDK, thực hiện luồng gửi OTP (`signInWithPhoneNumber`). Sau khi có user credential, lấy `idToken` (`user.getIdToken()`) và truyền vào trường `idToken` khi gọi API `/register`.
2. **Trang cá nhân:** Kiểm tra `isPhoneVerified` (nếu có trả về trong thông tin cá nhân - hiện tại BE đã hỗ trợ qua `UserInfoResponse` nếu map đúng trường). Nếu `false`, hiển thị nút "Xác thực số điện thoại". Nút này kích hoạt Firebase Phone Auth, lấy `idToken` và gọi `POST /users/verify-phone`.
