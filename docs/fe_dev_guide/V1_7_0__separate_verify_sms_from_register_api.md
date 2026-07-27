# V1.7.0: Tách riêng API xác thực SMS OTP khỏi API đăng ký tài khoản

**Ngày tạo:** 2026-07-27
**API thay đổi:** `POST /auth/register` (Cập nhật), `POST /auth/verify-sms` (Mới)
**Loại thay đổi:** Cập nhật, Tạo mới
**Breaking change:** Có

## Chi tiết thay đổi

### 1. Đăng ký tài khoản (POST `/auth/register`)
Tách việc xác thực Firebase SMS OTP ra khỏi luồng đăng ký tài khoản. Request đăng ký không còn chứa trường `idToken`.

#### Cập nhật Request Body
- Bỏ trường `idToken`
```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "address": "123 Street, City",
  "fullName": "Test User",
  "phoneNumber": "+84123456789"
}
```

---

### 2. Xác thực SMS OTP (POST `/auth/verify-sms`) - API Mới
API độc lập dùng để xác thực số điện thoại và OTP thông qua Firebase ID Token trong các luồng xác thực/đăng ký.

#### Request
- Body:
```json
{
  "phoneNumber": "+84123456789",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZ..."
}
```

#### Response
- Status: `204 No Content` nếu xác thực thành công.

#### Các mã lỗi có thể trả về:
- `PHONE_NUMBER_MISMATCH` (400): Số điện thoại gửi lên không khớp với số trong Firebase token.
- `INVALID_FIREBASE_TOKEN` (401): Firebase token không hợp lệ hoặc đã hết hạn.

## Hướng dẫn cập nhật cho Frontend
1. **Trang đăng ký:** Không gửi `idToken` trong payload `POST /auth/register`.
2. **Luồng xác thực SMS:** Gọi riêng API `POST /auth/verify-sms` khi muốn xác thực SMS OTP của số điện thoại bất kỳ độc lập với API đăng ký.
