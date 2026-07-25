# V1_4_6: Xóa tính năng xóa variant khỏi API update product

**Phiên bản**: V1_4_6  
**Ngày tạo**: 2026-07-25  
**Loại thay đổi**: Xóa field khỏi API (breaking)  
**Breaking change**: Có

## Mô tả thay đổi

Xóa field `deletedVariantIds` khỏi request `PUT /management/product/{productId}`. Backend không còn hỗ trợ xóa variant thông qua API update product nữa.

**Lý do**: Để "xóa" variant, sử dụng cách đặt `status: "INACTIVE"` thay vì xóa vật lý. Điều này đảm bảo:
- Không phá vỡ dữ liệu order cũ
- Giữ được lịch sử dữ liệu
- Có thể khôi phục variant nếu cần

## API bị ảnh hưởng

### PUT /management/product/{productId}

**Request trước đây**:
```json
{
  "productId": 1,
  "name": "Product Name",
  "existVariants": [...],
  "newVariants": [...],
  "deletedVariantIds": [100, 101]  // ❌ BỊ XÓA
}
```

**Request mới**:
```json
{
  "productId": 1,
  "name": "Product Name",
  "existVariants": [...],
  "newVariants": [...]
  // deletedVariantIds không còn tồn tại
}
```

## Hướng dẫn Frontend

### Thay đổi logic xóa variant

**Trước đây**: Gửi variant ID vào `deletedVariantIds`

```typescript
// ❌ Cách cũ - không hoạt động nữa
await updateProduct(productId, {
  existVariants: [...],
  deletedVariantIds: [100, 101]
});
```

**Bây giờ**: Đặt `status: "INACTIVE"` cho variant cần "xóa"

```typescript
// ✅ Cách mới - đặt status INACTIVE
await updateProduct(productId, {
  existVariants: [
    {
      variantId: 100,
      skuCode: "SKU001",
      price: 100.00,
      stockQuantity: 0,
      status: "INACTIVE"  // Đánh dấu inactive thay vì xóa
    }
  ]
});
```

### Cập nhật UI

**Nút "Xóa variant"**:
- Đổi label: "Xóa" → "Vô hiệu hóa" / "Ẩn"
- Action: Đặt `status: "INACTIVE"` thay vì thêm vào `deletedVariantIds`
- Có thể thêm nút "Kích hoạt lại" để đặt `status: "ACTIVE"`

**Confirm dialog**:
```
Trước: "Bạn có chắc muốn xóa variant này?"
Sau: "Bạn có chắc muốn vô hiệu hóa variant này? Variant sẽ không hiển thị cho khách hàng."
```

### Xử lý migration dữ liệu

Nếu frontend đang có code gửi `deletedVariantIds`:
1. Xóa field `deletedVariantIds` khỏi request interface
2. Thay logic "xóa" thành "set INACTIVE"
3. Test lại flow xóa variant

## Ảnh hưởng tới màn hình/flow

### Màn hình quản trị sản phẩm - Edit Product

- **Nút xóa variant**: Đổi thành "Vô hiệu hóa"
- **Danh sách variant**: Hiển thị cả variant ACTIVE và INACTIVE
- **Filter**: Có thể thêm filter để chỉ hiển thị ACTIVE hoặc INACTIVE

### Không ảnh hưởng tới customer

Customer API đã filter variant inactive từ trước, không có thay đổi.

## Lưu ý

- Variant inactive vẫn tồn tại trong database
- Variant inactive vẫn có thể được sử dụng trong order cũ
- Có thể "khôi phục" variant bằng cách đặt lại `status: "ACTIVE"`
- Field `deletedVariantIds` trong request sẽ bị ignore nếu frontend vẫn gửi (không gây lỗi)

## Migration từ V1_4_4

Nếu đang dùng tính năng xóa variant (V1_4_4):
1. Xóa logic validate lỗi 409 `PRODUCT_VARIANT_IN_USE` (không còn xảy ra)
2. Đổi action "Xóa" thành "Vô hiệu hóa" với `status: "INACTIVE"`

## Status

✅ Đã triển khai backend  
⏳ Chờ frontend cập nhật
