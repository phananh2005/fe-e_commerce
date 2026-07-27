import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { register, verifySms, resendOtp } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { translateError } from "../../lib/i18n";
import { auth } from "../../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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
      const formattedPhone = phoneNumber.trim().replace(/^0/, "+84");

      await register({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: formattedPhone,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      });

      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      toast.show("Mã xác nhận đã được gửi!", "info");
    } catch (err) {
      setError(translateError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSubmitting(true);
    try {
      const formattedPhone = phoneNumber.trim().replace(/^0/, "+84");
      
      await resendOtp({ phoneNumber: formattedPhone });
      
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      
      toast.show("Mã xác nhận mới đã được gửi!", "info");
    } catch (err: any) {
      if (err.name === "ApiError" && (err.status === 404 || err.status === 400)) {
        toast.show("Phiên đăng ký đã hết hạn, vui lòng thực hiện lại.", "error");
        setStep(1);
      } else {
        setError(translateError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (!confirmationResult) return;
      const result = await confirmationResult.confirm(otp.trim());
      const idToken = await result.user.getIdToken();
      
      const formattedPhone = phoneNumber.trim().replace(/^0/, "+84");
      await verifySms({
        phoneNumber: formattedPhone,
        idToken,
      });

      toast.show("Xác thực và đăng ký thành công!", "success");
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

        <div id="recaptcha-container"></div>

        {step === 1 ? (
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
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 mb-4 text-center">
              Mã xác nhận đã được gửi. Bạn có <b>30 phút</b> để xác nhận đăng ký.
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-semibold">Mã xác nhận (SMS) *</span>
              <input
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Nhập mã 6 số"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-4 w-full"
            >
              {submitting ? "Đang xử lý..." : "Xác nhận"}
            </button>
            <div className="mt-4 text-center text-sm">
              Chưa nhận được mã?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
              >
                Gửi lại OTP
              </button>
            </div>
          </form>
        )}

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

