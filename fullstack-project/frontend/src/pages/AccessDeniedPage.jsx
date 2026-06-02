import { Link } from "react-router-dom";

function AccessDeniedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-rose-700">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          You are not authorized to access this page.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
