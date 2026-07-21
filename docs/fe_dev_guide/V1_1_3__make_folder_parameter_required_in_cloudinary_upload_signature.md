# V1_1_3 - Bắt buộc truyền parameter `folder` trong API lấy chữ ký upload Cloudinary

**Version**: V1_1_3  
**Ngày tạo**: 2026-07-21  
**Mục đích**: Bắt buộc frontend truyền `folder` parameter để xác định loại tài nguyên upload (brand, category, product)

## API thay đổi

1. **Get Upload Signature** - Lấy chữ ký upload file lên Cloudinary

## Chi tiết thay đổi

### Get Upload Signature
- **Endpoint**: `GET /cloudinary/signature`
- **Loại thay đổi**: Cập nhật request parameter
- **Trường bị thay đổi**:
  - `folder` - từ optional → **required**

**Request cũ** (folder optional):
```bash
GET /cloudinary/signature
GET /cloudinary/signature?folder=brand
```

**Request mới** (folder bắt buộc):
```bash
GET /cloudinary/signature?folder=brand
GET /cloudinary/signature?folder=category
GET /cloudinary/signature?folder=product
```

## Giá trị folder hợp lệ

- `brand` - Upload logo/ảnh thương hiệu
- `category` - Upload ảnh danh mục
- `product` - Upload ảnh sản phẩm

**Response** (không thay đổi):
```json
{
  "message": "Cloudinary upload signature generated",
  "result": {
    "signature": "abc123def456...",
    "timestamp": 1234567890,
    "apiKey": "your_api_key",
    "cloudName": "your_cloud_name",
    "publicId": "brand/upload-1721574379000-a1b2c3d4"
  }
}
```

## Error Response

Nếu không truyền `folder`:
```json
{
  "status": 400,
  "message": "Required parameter 'folder' is missing",
  "error": "Bad Request"
}
```

## Luồng upload ảnh lên Cloudinary

### 1. Frontend gọi API lấy chữ ký
```javascript
const response = await fetch('/cloudinary/signature?folder=product');
const data = await response.json();
const signature = data.result;
```

### 2. Frontend upload file trực tiếp lên Cloudinary
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('upload_preset', 'your_preset');
formData.append('signature', signature.signature);
formData.append('timestamp', signature.timestamp);
formData.append('api_key', signature.apiKey);
formData.append('public_id', signature.publicId);

const uploadResponse = await fetch(
  `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
  {
    method: 'POST',
    body: formData
  }
);

const uploadedImage = await uploadResponse.json();
```

### 3. Frontend trả URL ảnh về backend
```javascript
const imageUrl = uploadedImage.secure_url;
// Gửi imageUrl kèm với request tạo product, category, hoặc update brand
```

### Sơ đồ luồng
```
Frontend
   ↓
[Step 1] GET /cloudinary/signature?folder=product
   ↓ (nhận signature)
[Step 2] Upload file → Cloudinary API
   ↓ (nhận URL ảnh)
[Step 3] POST /api/v1/products (kèm imageUrl)
   ↓
Backend
```

## Hướng dẫn FE cập nhật

### 1. Cập nhật tất cả lệnh gọi API

**Cũ** - không truyền hoặc truyền không bắt buộc:
```javascript
const response = await fetch('/cloudinary/signature');
// Hoặc
const response = await fetch('/cloudinary/signature?folder=product');
```

**Mới** - bắt buộc truyền folder:
```javascript
// ❌ Không hợp lệ
const response = await fetch('/cloudinary/signature');

// ✅ Hợp lệ
const response = await fetch('/cloudinary/signature?folder=product');
```

### 2. Xác định folder type trước khi upload

```javascript
function getUploadSignature(folderType) {
  if (!['brand', 'category', 'product'].includes(folderType)) {
    throw new Error('Invalid folder type: ' + folderType);
  }
  return fetch(`/cloudinary/signature?folder=${folderType}`);
}

// Sử dụng
const signatureForProduct = await getUploadSignature('product');
const signatureForBrand = await getUploadSignature('brand');
const signatureForCategory = await getUploadSignature('category');
```

### 3. Thêm error handling

```javascript
async function uploadImageToCloudinary(file, folderType) {
  try {
    // Lấy chữ ký
    const signatureResponse = await fetch(
      `/cloudinary/signature?folder=${folderType}`
    );
    
    if (!signatureResponse.ok) {
      // 400 Bad Request nếu folder bị thiếu/sai
      throw new Error('Failed to get upload signature');
    }
    
    const signatureData = await signatureResponse.json();
    const signature = signatureData.result;
    
    // Upload lên Cloudinary...
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

## Status

- **Breaking Change**: Có (frontend bắt buộc truyền folder parameter)
- **Ảnh hưởng**: 
  - Trang thêm/sửa sản phẩm
  - Trang thêm/sửa thương hiệu
  - Trang thêm/sửa danh mục
  - Bất kỳ form upload ảnh nào sử dụng API này
- **Độ ưu tiên**: Cao

## Ghi chú

- Chỉ thêm `required = true` vào backend, không thay đổi response
- Frontend phải cập nhật tất cả lệnh gọi API để truyền `folder` parameter
- Response chứa đầy đủ: `signature`, `timestamp`, `apiKey`, `cloudName`, `publicId`
- `publicId` được tự động sinh bởi backend với format `{folder}/{timestamp}-{uuid}` và phải được append vào FormData khi upload
- Signature được tính từ `timestamp` + `public_id`, không bao gồm `folder`. Chỉ append các tham số đã có trong response vào FormData
- Giá trị `folder` chỉ dùng để backend xác định loại tài nguyên và sinh `publicId`, không truyền riêng lẻ khi upload
- Các giá trị khác ngoài `brand`, `category`, `product` sẽ được backend xử lý theo business logic
