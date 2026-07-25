# V1_4_4: Thêm validation khi xóa product variant

**Phiên bản**: V1_4_4  
**Ngày tạo**: 2026-07-25  
**Loại thay đổi**: Cập nhật behavior API (không breaking)  
**Breaking change**: Không

## Mô tả thay đổi

Backend thêm validation để kiểm tra product variant trước khi xóa. Nếu variant đã được sử dụng trong bất kỳ order nào, API sẽ trả về lỗi `409 Conflict` thay vì cố gắng xóa và gặp lỗi database.

## API bị ảnh hưởng

### PUT /management/product/{productId}

**Request**: Không thay đổi. Frontend vẫn gửi `deletedVariantIds` như trước.

**Response**: Thêm lỗi mới có thể gặp

| HTTP Status | Error Code | Message | Giải thích |
|-------------|-----------|---------|-----------|
| 409 | 409 | `Product variant cannot be deleted because it is used in existing orders` | Variant đã được dùng trong order, không thể xóa |

## Hướng dẫn Frontend

### Cập nhật xử lý lỗi

Khi gọi API `PUT /management/product/{productId}` với `deletedVariantIds`, frontend cần xử lý lỗi 409:

```typescript
// Trước (không cần cập nhật nữa)
// Backend sẽ reject ở database level với lỗi 500

// Sau (cần xử lý)
try {
  await updateProduct(productId, {
    existVariants: [],
    newVariants: [],
    deletedVariantIds: [123, 456]
  });
  // Thành công
} catch (error) {
  if (error.response?.status === 409) {
    // Variant đã được dùng trong order
    toast.error('Không thể xóa variant vì đã có đơn hàng sử dụng. Vui lòng kiểm tra lại.');
    // Có thể thêm logic để refresh danh sách variant và hiển thị thông tin
  } else {
    toast.error('Lỗi cập nhật sản phẩm');
  }
}
```

### Tại sao thay đổi này?

- **Trước**: Nếu variant đã có trong order, API trả về 500 Internal Server Error (database constraint violation)
- **Sau**: API trả về 409 Conflict với message rõ ràng, Frontend có thể hiển thị thông báo lỗi phù hợp

### Business logic

Variant không thể xóa nếu:
- Đã có order item sử dụng variant đó
- Dù order ở trạng thái gì (PENDING, CONFIRMED, DELIVERED, etc.)

Để xóa variant, cần:
1. Kiểm tra variant này có được dùng trong order nào không
2. Nếu không, xóa bình thường
3. Nếu có, báo lỗi và yêu cầu người dùng xử lý

## Ảnh hưởng tới màn hình/flow

### Màn hình quản trị sản phẩm - Edit Product

- **Hiện tượng**: Khi người dùng xóa variant và click Save, có thể gặp lỗi 409
- **Xử lý**: Hiển thị toast thông báo variant không thể xóa vì đã có đơn hàng

### Không ảnh hưởng tới flow khác

## Lưu ý

- Chỉ áp dụng khi gọi `PUT /management/product/{productId}` với `deletedVariantIds`
- Nếu `deletedVariantIds` rỗng hoặc không có, không ảnh hưởng
- Lỗi này xảy ra trước khi xóa, không gây mất dữ liệu

## Status

✅ Đã triển khai backend  
⏳ Chờ frontend cập nhật error handling
