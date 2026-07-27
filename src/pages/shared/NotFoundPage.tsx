import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-center">
        <svg className="h-40 w-40 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-slate-700">Trang không tồn tại</h2>
      <p className="mt-4 text-base text-slate-500">
        Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
      </p>
      <div className="mt-10">
        <Link to="/" className="btn-primary">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
