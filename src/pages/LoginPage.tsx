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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          Đang tải phiên đăng nhập...
        </div>
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.06),transparent_50%),radial-gradient(circle_at_80%_50%,rgba(168,85,247,0.06),transparent_50%)]" />
      <section className="relative w-full max-w-sm rounded-xl border-2 border-slate-200 bg-white/90 p-5 shadow">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
              Đăng nhập
            </h2>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              name="username"
              autoComplete="username"
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-500/8"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Mật khẩu</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-500/8"
            />
          </label>

          {currentError ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-600">
              {currentError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <p className="text-center text-xs text-slate-500">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
