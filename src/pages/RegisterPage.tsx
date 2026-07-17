import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { register } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { translateError } from "../lib/i18n";

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { status } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      toast.show("Đăng ký thành công!", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <section className="card w-full max-w-[500px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Tạo tài khoản</h1>
          <p className="text-slate-500">Đăng ký để trải nghiệm mua sắm tuyệt vời</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-[var(--color-destructive)]/10 p-3 text-sm text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Tên đăng nhập *</span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Họ tên *</span>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Số điện thoại *</span>
            <input
              className="input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Email</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Địa chỉ</span>
            <input
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-semibold">Mật khẩu *</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary mt-4 w-full"
          >
            {submitting ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    </main>
  );
}

