# V1_3_2 - Thêm bộ lọc enabled cho tìm kiếm brand và category

- Ngày tạo: 2026-07-23
- Loại thay đổi: Cập nhật API
- Breaking change: Không

## API thay đổi

### `GET /management/brands/search`

Thêm query parameter tùy chọn:

- `enabled`: Boolean (`true` hoặc `false`)

Khi không truyền `enabled`, API trả về tất cả brand phù hợp từ khóa. Khi truyền giá trị, API chỉ trả về brand có trạng thái tương ứng.

### `GET /management/categories/search`

Thêm query parameter tùy chọn:

- `enabled`: Boolean (`true` hoặc `false`)

Khi không truyền `enabled`, API trả về tất cả category phù hợp từ khóa. Khi truyền giá trị, API chỉ trả về category có trạng thái tương ứng.

## Frontend cần cập nhật

- Bổ sung `enabled?: boolean` vào request model của brand search và category search.
- Gửi `enabled=true` để lấy bản ghi đang hoạt động hoặc `enabled=false` để lấy bản ghi đã vô hiệu hóa.
- Không gửi parameter khi cần tìm kiếm không lọc theo trạng thái.
- Không thay đổi response và status code.

## Ảnh hưởng

Ảnh hưởng đến màn hình quản trị brand và category nếu có bộ lọc trạng thái.
