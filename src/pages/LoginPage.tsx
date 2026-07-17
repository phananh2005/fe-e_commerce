import { useState } from "react";
import { LogIn, ArrowRight } from "lucide-react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { getHomePathForRoles, useAuth } from "../context/AuthContext";
import { translateError } from "../lib/i18n";

export function LoginPage() {
  const { status, session, error, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-foreground)]">
        <div className="card">Đang tải phiên đăng nhập...</div>
      </div>
    );
  }

  if (session) {
    return <Navigate to={getHomePathForRoles(session.user.roles)} replace />;
  }

  const currentError = error || localError;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");
    setIsSubmitting(true);

    try {
      const nextSession = await signIn({ username: username.trim(), password });
      navigate(getHomePathForRoles(nextSession.user.roles), { replace: true });
    } catch (authError) {
      setLocalError(translateError(authError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="card w-full max-w-[400px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-primary)]">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Đăng nhập</h1>
            <p className="text-slate-500">Chào mừng bạn quay trở lại</p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-semibold">Tên đăng nhập</span>
              <input
                className="input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                autoComplete="username"
                required
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-semibold">Mật khẩu</span>
              <input
                className="input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          {currentError && (
            <div className="rounded-lg bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
              {currentError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary inline-flex w-full items-center justify-center gap-2"
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-center text-sm">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-[var(--color-primary)] hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
