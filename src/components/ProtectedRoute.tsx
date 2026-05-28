import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
        Đang kiểm tra phiên đăng nhập...
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "checking") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
