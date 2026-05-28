import { Navigate, Outlet } from "react-router-dom";
import { useAuth, getHomePathForRoles } from "../context/AuthContext";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
        Đang kiểm tra quyền truy cập...
      </div>
    </div>
  );
}

export function RoleRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { status, session } = useAuth();

  if (status === "checking") {
    return <LoadingScreen />;
  }

  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  const roles = session?.user.roles ?? [];
  const hasAccess = allowedRoles.some((role) => roles.includes(role));

  if (!hasAccess) {
    return <Navigate to={getHomePathForRoles(roles)} replace />;
  }

  return <Outlet />;
}
