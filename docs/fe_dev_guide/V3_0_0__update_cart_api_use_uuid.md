---
version: V3.0.0
date: 2026-07-29
summary: Update Cart API to use UUID instead of ID
breaking_change: true
---

# V3.0.0: Cập nhật API Giỏ Hàng sử dụng UUID thay vì ID

## Danh sách API thay đổi
- `GET /cart` (Lấy danh sách giỏ hàng)
- `POST /cart/add` (Thêm sản phẩm vào giỏ hàng)
- `DELETE /cart/remove/{uuids}` (Xóa sản phẩm khỏi giỏ hàng)
- `PUT /cart/update` (Cập nhật số lượng/biến thể sản phẩm trong giỏ hàng)

## Chi tiết thay đổi

Toàn bộ các API liên quan đến giỏ hàng đã được chuyển đổi từ việc sử dụng ID (kiểu Long) sang UUID (kiểu String). **Đây là một Breaking Change**.

1. **`GET /cart`**:
   - Xóa bỏ trường `cartItemId`.
   - Xóa bỏ trường `currentVariantId`.
   - Đã có `cartItemUuid` (thêm từ phiên bản trước) thay thế cho `cartItemId`.
   - Thêm trường `currentVariantUuid` thay thế cho `currentVariantId`.

   **Response mới:**
   ```json
   {
       "cartItemUuid": "123e4567-e89b-12d3-a456-426614174000",
       "productUuid": "...",
       "productName": "...",
       "productStatus": "...",
       "currentVariantUuid": "123e4567-e89b-12d3-a456-426614174001",
       "variantSkuCode": "...",
       "variantImageUrl": "...",
       "variantPrice": 100000.0,
       "stockQuantity": 50,
       "cartItemQuantity": 2
   }
   ```

2. **`POST /cart/add`**:
   - Payload request đổi `variantId` (Long) thành `variantUuid` (String).

   **Request mới:**
   ```json
   {
       "variantUuid": "123e4567-e89b-12d3-a456-426614174001",
       "quantity": 1
   }
   ```

3. **`DELETE /cart/remove/{uuids}`**:
   - Path variable thay đổi từ một mảng IDs sang mảng UUIDs.
   - Ví dụ: `DELETE /cart/remove/123e4567-e89b-12d3-a456-426614174000,123e4567-e89b-12d3-a456-426614174002`

4. **`PUT /cart/update`**:
   - Payload request đổi `cartItemId` thành `cartItemUuid`.
   - Payload request đổi `variantId` thành `variantUuid`.

   **Request mới:**
   ```json
   {
       "cartItemUuid": "123e4567-e89b-12d3-a456-426614174000",
       "variantUuid": "123e4567-e89b-12d3-a456-426614174001",
       "quantity": 3
   }
   ```

## Hướng dẫn FE cập nhật
- Cập nhật toàn bộ các interface, kiểu dữ liệu lưu trữ giỏ hàng ở Frontend từ number sang string đối với ID của giỏ hàng và biến thể sản phẩm.
- Sửa lại các hàm gọi API truyền vào UUID thay vì ID tương ứng.
- Đảm bảo hiển thị giỏ hàng lấy đúng key `cartItemUuid` để định danh sản phẩm.
