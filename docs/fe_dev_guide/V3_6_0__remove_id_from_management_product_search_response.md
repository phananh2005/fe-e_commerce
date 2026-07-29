---
version: V3.6.0
date: 2026-07-29
summary: Xóa trường id khỏi Management Product Search Response
breaking_change: true
---

# V3.6.0: Xóa trường ID cũ khỏi API Management Product Search

## Danh sách API thay đổi
- `GET /management/product/search` (Tìm kiếm sản phẩm cho quản trị viên)

## Chi tiết thay đổi

Trong phiên bản API này, trường `id` (kiểu `Long`) đã bị loại bỏ hoàn toàn khỏi JSON response nhằm bảo mật và bắt buộc FE chuyển sang sử dụng `uuid`. **Đây là một Breaking Change**.

Chi tiết thay đổi trong `ProductSummaryResponseForManagement`:
1. Trường `id` bị ẩn đi, sử dụng `uuid` thay thế.

*Lưu ý:* Trường `id` đã bị ẩn bằng `@JsonIgnore` và sẽ không còn xuất hiện trong chuỗi JSON trả về.

## Hướng dẫn FE cập nhật
- Kiểm tra màn hình Danh sách/Tìm kiếm sản phẩm quản trị, không đọc trường `id` nữa mà lấy định danh sản phẩm thông qua `uuid`.
- Sử dụng `uuid` để điều hướng sang trang chi tiết, lấy danh sách biến thể hoặc cập nhật trạng thái nếu cần.
