import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">404</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-3 text-slate-600">The page you requested does not exist.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" to="/">
            Go home
          </Link>
          <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" to="/login">
            User login
          </Link>
          <Link className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" to="/super-admin/login">
            Super admin login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;