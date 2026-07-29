import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrderSuccessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-24 w-24 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Đặt hàng thành công!
      </h1>
      <p className="mt-4 text-base text-slate-500">
        Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi. Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận. Bạn có thể theo dõi trạng thái đơn hàng trong phần Quản lý đơn hàng.
      </p>
      
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          to="/orders"
          className="btn-primary w-full sm:w-auto"
        >
          Xem đơn hàng
        </Link>
        <Link
          to="/"
          className="btn-secondary w-full sm:w-auto"
        >
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
