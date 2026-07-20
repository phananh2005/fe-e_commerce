export const ERROR_MAPPINGS: Record<string, string> = {
  "Invalid username or password": "Tên đăng nhập hoặc mật khẩu không đúng.",
  "Token has expired": "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.",
  "Invalid token": "Phiên đăng nhập không hợp lệ.",
  "Account is disabled": "Tài khoản của bạn đã bị vô hiệu hóa.",
  "User not found": "Không tìm thấy người dùng.",
  "Product not found": "Sản phẩm không tồn tại.",
  "Product variant not found": "Phiên bản sản phẩm không tồn tại.",
  "Category not found": "Danh mục không tồn tại.",
  "Brand not found": "Thương hiệu không tồn tại.",
  "Order not found": "Đơn hàng không tồn tại.",
  "Cart item not found": "Sản phẩm trong giỏ hàng không tồn tại.",
  "User already exists": "Người dùng đã tồn tại.",
  "Username already exists": "Tên đăng nhập đã được sử dụng.",
  "Email already exists": "Email đã được sử dụng.",
  "Old password is incorrect": "Mật khẩu cũ không chính xác.",
  "Insufficient stock": "Sản phẩm đã hết hàng.",
  "Validation failed": "Dữ liệu không hợp lệ.",
  "Internal server error": "Đã có lỗi hệ thống xảy ra.",
  "Failed to update status": "Không thể cập nhật trạng thái.",
  "Failed to load orders": "Không thể tải danh sách đơn hàng.",
  "Failed to load order": "Không thể tải chi tiết đơn hàng.",
  "Unable to save user": "Không thể lưu thông tin người dùng.",
  "Cannot generate token": "Lỗi tạo phiên đăng nhập.",
};

export const translateError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  const mapped = ERROR_MAPPINGS[message];
  if (mapped) {
    return mapped;
  }
  console.warn('Unmapped error message:', message);
  return "Có lỗi xảy ra, vui lòng thử lại sau.";
};

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  DELIVERED: "Giao thành công",
  CANCELLED: "Đã hủy",
  RETURNED: "Trả hàng / Hoàn tiền",
};

const PRODUCT_STATUS_MAP: Record<string, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Tạm ẩn",
  DRAFT: "Nháp",
};

export const translateOrderStatus = (status: string): string =>
  ORDER_STATUS_MAP[status] ?? status;

export const translateProductStatus = (status: string): string =>
  PRODUCT_STATUS_MAP[status] ?? status;

const ROLE_MAP: Record<string, string> = {
  ROLE_SUPER_ADMIN: "Super Admin",
  ROLE_STORE_ADMIN: "Quản lý cửa hàng",
  ROLE_DELIVERY_STAFF: "Nhân viên giao hàng",
  ROLE_CUSTOMER: "Khách hàng",
};

export const translateRole = (role: string): string =>
  ROLE_MAP[role] ?? role;
