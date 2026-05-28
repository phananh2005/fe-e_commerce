# Dashboard API

Module thống kê và báo cáo dành cho **Admin**.

---

## Wrapper Response chung

```json
{
  "code": 1000,
  "message": "...",
  "result": { ... }
}
```

---

## Enum: RevenueGroupBy

```
DAY      – Nhóm theo ngày
MONTH    – Nhóm theo tháng
QUARTER  – Nhóm theo quý
YEAR     – Nhóm theo năm
```

---

> Yêu cầu: role `ROLE_ADMIN`  
> Base path: `/admin/statistics`

---

## 1. Tổng quan hệ thống

```
GET /admin/statistics/overview
```

Không có request param / body.

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get dashboard overview successfully",
  "result": {
    "totalUsers": 1250,
    "totalProducts": 340
  }
}
```

| Field           | Type | Mô tả                        |
|-----------------|------|------------------------------|
| `totalUsers`    | Long | Tổng số người dùng hệ thống  |
| `totalProducts` | Long | Tổng số sản phẩm hệ thống    |

---

## 2. Thống kê đơn hàng theo khoảng thời gian

```
POST /admin/statistics/orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-06-30"
}
```

| Field      | Type       | Bắt buộc | Ghi chú              |
|------------|------------|----------|----------------------|
| `fromDate` | LocalDate  | ✅        | Định dạng `YYYY-MM-DD` |
| `toDate`   | LocalDate  | ✅        | Định dạng `YYYY-MM-DD` |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get order statistics successfully",
  "result": {
    "fromDate": "2024-01-01",
    "toDate": "2024-06-30",
    "totalOrders": 520,
    "paidOrders": 410,
    "pendingOrders": 30,
    "confirmedOrders": 25,
    "shippingOrders": 15,
    "deliveredOrders": 400,
    "cancelledOrders": 40,
    "returnedOrders": 10,
    "totalRevenue": 625000000.00,
    "statusStatistics": [
      { "status": "PENDING",   "count": 30 },
      { "status": "CONFIRMED", "count": 25 },
      { "status": "SHIPPING",  "count": 15 },
      { "status": "DELIVERED", "count": 400 },
      { "status": "CANCELLED", "count": 40 },
      { "status": "RETURNED",  "count": 10 }
    ]
  }
}
```

| Field               | Type                  | Mô tả                                          |
|---------------------|-----------------------|------------------------------------------------|
| `fromDate`          | LocalDate             | Ngày bắt đầu của khoảng lọc                   |
| `toDate`            | LocalDate             | Ngày kết thúc của khoảng lọc                  |
| `totalOrders`       | Long                  | Tổng số đơn hàng trong khoảng                 |
| `paidOrders`        | Long                  | Số đơn đã thanh toán                          |
| `pendingOrders`     | Long                  | Số đơn chờ xác nhận                           |
| `confirmedOrders`   | Long                  | Số đơn đã xác nhận                            |
| `shippingOrders`    | Long                  | Số đơn đang giao                              |
| `deliveredOrders`   | Long                  | Số đơn đã giao thành công                     |
| `cancelledOrders`   | Long                  | Số đơn đã hủy                                 |
| `returnedOrders`    | Long                  | Số đơn trả hàng                               |
| `totalRevenue`      | BigDecimal            | Tổng doanh thu (chỉ tính đơn đã thanh toán)   |
| `statusStatistics`  | array                 | Danh sách thống kê theo từng trạng thái        |
| `statusStatistics[].status` | string      | Tên trạng thái (`OrderStatus`)                |
| `statusStatistics[].count`  | Long        | Số lượng đơn ở trạng thái đó                  |

---

## 3. Báo cáo doanh thu theo chu kỳ

```
POST /admin/statistics/revenue
Content-Type: application/json
```

**Request Body:**
```json
{
  "fromDate": "2024-01-01",
  "toDate": "2024-06-30",
  "groupBy": "MONTH"
}
```

| Field      | Type          | Bắt buộc | Mặc định | Ghi chú                                    |
|------------|---------------|----------|----------|--------------------------------------------|
| `fromDate` | LocalDate     | ✅        |          | Định dạng `YYYY-MM-DD`                     |
| `toDate`   | LocalDate     | ✅        |          | Định dạng `YYYY-MM-DD`                     |
| `groupBy`  | RevenueGroupBy| ❌        | `DAY`    | `DAY` / `MONTH` / `QUARTER` / `YEAR`       |

**Response 200:**
```json
{
  "code": 1000,
  "message": "Get revenue report successfully",
  "result": {
    "groupBy": "MONTH",
    "fromDate": "2024-01-01",
    "toDate": "2024-06-30",
    "totalOrders": 520,
    "paidOrders": 410,
    "totalRevenue": 625000000.00,
    "items": [
      {
        "period": "2024-01",
        "orders": 80,
        "paidOrders": 65,
        "revenue": 98000000.00
      },
      {
        "period": "2024-02",
        "orders": 75,
        "paidOrders": 60,
        "revenue": 91500000.00
      },
      {
        "period": "2024-03",
        "orders": 95,
        "paidOrders": 78,
        "revenue": 118000000.00
      }
    ]
  }
}
```

| Field          | Type       | Mô tả                                                  |
|----------------|------------|--------------------------------------------------------|
| `groupBy`      | string     | Chu kỳ nhóm đã dùng                                   |
| `fromDate`     | LocalDate  | Ngày bắt đầu                                          |
| `toDate`       | LocalDate  | Ngày kết thúc                                         |
| `totalOrders`  | Long       | Tổng đơn hàng toàn khoảng                             |
| `paidOrders`   | Long       | Tổng đơn đã thanh toán toàn khoảng                    |
| `totalRevenue` | BigDecimal | Tổng doanh thu toàn khoảng                            |
| `items`        | array      | Dữ liệu chi tiết từng chu kỳ                          |
| `items[].period`     | string     | Nhãn chu kỳ (xem bảng format bên dưới)         |
| `items[].orders`     | Long       | Số đơn trong chu kỳ                             |
| `items[].paidOrders` | Long       | Số đơn đã thanh toán trong chu kỳ               |
| `items[].revenue`    | BigDecimal | Doanh thu trong chu kỳ                          |

**Format của `period` theo `groupBy`:**

| groupBy   | Ví dụ `period`  |
|-----------|-----------------|
| `DAY`     | `2024-01-15`    |
| `MONTH`   | `2024-01`       |
| `QUARTER` | `2024-Q1`       |
| `YEAR`    | `2024`          |

---

## Lỗi phổ biến

| HTTP Status | Ý nghĩa                                   |
|-------------|-------------------------------------------|
| 400         | Dữ liệu request không hợp lệ (validation) |
| 401         | Chưa xác thực (thiếu / sai token)         |
| 403         | Không có quyền truy cập (không phải Admin)|

**Ví dụ response lỗi:**
```json
{
  "code": 4003,
  "message": "Access denied"
}
```
