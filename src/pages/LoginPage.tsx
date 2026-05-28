import { useEffect, useState } from "react";
import { ShieldCheck, LogIn, ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../lib/api";
import { getHomePathForRoles, useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { status, session, error, setError, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      navigate(getHomePathForRoles(session?.user.roles), { replace: true });
    }
  }, [navigate, session?.user.roles, status]);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 shadow-2xl backdrop-blur">
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
    setError("");
    setIsSubmitting(true);

    try {
      const nextSession = await signIn({ username: username.trim(), password });
      navigate(getHomePathForRoles(nextSession.user.roles), { replace: true });
    } catch (authError) {
      setLocalError(
        authError instanceof Error ? authError.message : "Đăng nhập thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen gap-6 bg-slate-950 p-4 text-slate-100 lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-950 to-cyan-500/10 p-8 shadow-2xl lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.35),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(34,211,238,0.18),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-between gap-10">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-slate-300">
              <ShieldCheck className="h-4 w-4" />
              Admin access
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              Trang quản trị cho toàn bộ vận hành thương mại điện tử.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Đăng nhập một lần để truy cập dashboard, quản lý product catalog,
              user, product và order trong một giao diện tập trung.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Dashboard", "Tổng quan real-time"],
              ["Router", "React Router DOM v6+"],
              ["Tailwind", "Responsive by design"],
            ].map(([title, subtitle]) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
              </article>
            ))}
          </div>

          <p className="text-sm text-slate-400">
            Backend mặc định: {API_BASE_URL}
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl sm:p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              <LogIn className="h-4 w-4" />
              Sign in
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              Đăng nhập quản trị
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Dùng tài khoản có quyền admin để vào hệ thống.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              type="text"
              name="username"
              autoComplete="username"
              placeholder="john_doe"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            />
          </label>

          {currentError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {currentError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
