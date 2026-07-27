# V1_5_2 – Dashboard Statistics APIs

**Ngày tạo:** 2026-07-25

## Mô tả thay đổi
Thêm hướng dẫn Frontend cho ba API thống kê trong Dashboard:
- `GET /management/statistics/overview` – Lấy tổng quan thống kê.
- `POST /management/statistics/orders` – Lấy thống kê đơn hàng theo tiêu chí.
- `POST /management/statistics/revenue` – Lấy báo cáo doanh thu theo khoảng thời gian.

## API chi tiết

### 1. Overview
- **Method:** GET
- **Endpoint:** `/management/statistics/overview`
- **Response:** `StatisticsResponse` chứa các trường tổng quan (totalOrders, totalRevenue, activeUsers, …).
- **FE action:** Gọi API khi tải Dashboard, cập nhật các thẻ thống kê tổng quan.
- **Breaking change:** Không

### 2. Order Statistics
- **Method:** POST
- **Endpoint:** `/management/statistics/orders`
- **Request body:** `DashboardOrderStatisticRequest` (filter by dateRange, status, …).
- **Response:** `DashboardResponse` với danh sách order và các trường tổng hợp.
- **FE action:** Khi người dùng mở tab "Thống kê đơn hàng", gửi request với bộ lọc đã chọn, hiển thị bảng và biểu đồ.
- **Breaking change:** Không

### 3. Revenue Report
- **Method:** POST
- **Endpoint:** `/management/statistics/revenue`
- **Request body:** `DashboardRevenueReportRequest` (fromDate, toDate, interval).
- **Response:** `SalesStatsResponse` gồm tổng doanh thu, số đơn, trung bình/order, dữ liệu cho biểu đồ thời gian.
- **FE action:** Khi người dùng chọn thời gian báo cáo, gửi request, render biểu đồ doanh thu.
- **Breaking change:** Không

## Hướng dẫn cập nhật Frontend
1. Thêm service `statisticsService` trong `api/dashboard.js` với các hàm `getOverview`, `getOrderStats`, `getRevenueReport`.
2. Cập nhật Redux/Store (hoặc Context) để lưu kết quả.
3. Tạo component UI tương ứng (`OverviewCard`, `OrderStatsTable`, `RevenueChart`).
4. Viết test UI để kiểm tra rendering dựa trên mock response.
5. Kiểm tra tích hợp toàn bộ Dashboard sau khi triển khai.

## Kiểm thử
- Mock API trả về dữ liệu mẫu, xác nhận UI hiển thị đúng.
- Kiểm tra lỗi 400/500 và hiển thị thông báo.
- Đảm bảo không gây breaking change cho các trang hiện có.