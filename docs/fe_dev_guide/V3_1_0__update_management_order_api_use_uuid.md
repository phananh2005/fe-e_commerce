---
version: V3.1.0
date: 2026-07-29
summary: Update Management Order API to use UUID
breaking_change: true
---

# V3.1.0: Cập nhật API Quản trị Đơn hàng sử dụng UUID

## Danh sách API thay đổi
- `GET /management/order/{orderUuid}` (Lấy chi tiết đơn hàng cho quản trị)
- `PATCH /management/order/{orderUuid}` (Cập nhật trạng thái đơn hàng)

## Chi tiết thay đổi

Hai API quản lý đơn hàng đã được chuyển đổi từ việc sử dụng ID (kiểu Long) sang UUID (kiểu String) ở Path Variable. **Đây là một Breaking Change**.

1. **`GET /management/order/{orderUuid}`**:
   - Thay vì truyền `orderId` kiểu số, giờ truyền `orderUuid` kiểu chuỗi vào path.
   - Ví dụ: `GET /management/order/123e4567-e89b-12d3-a456-426614174000`

2. **`PATCH /management/order/{orderUuid}`**:
   - Thay vì truyền `orderId` kiểu số, giờ truyền `orderUuid` kiểu chuỗi vào path.
   - Ví dụ: `PATCH /management/order/123e4567-e89b-12d3-a456-426614174000`

## Hướng dẫn FE cập nhật
- Khi gọi các API này từ màn hình chi tiết đơn hàng quản trị viên, hãy đảm bảo lấy giá trị `orderUuid` (từ danh sách đơn hàng đã lấy trước đó) thay vì dùng `id`.
- Cập nhật các hàm fetch/update tương ứng trên frontend để nhận vào một tham số kiểu chuỗi (string) đại diện cho UUID.
