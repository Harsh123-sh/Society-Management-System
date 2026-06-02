import { getStoredUser } from "../utils/session";

function RoleHomePage({ title, description }) {
  const user = getStoredUser();

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-2 text-sm text-slate-100">{description}</p>
      </section>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Logged in as</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{user?.email || "Unknown user"}</p>
        <p className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {user?.role || "unknown"}
        </p>
        {user?.resident_type ? (
          <p className="mt-2 text-sm text-slate-600">Resident type: {user.resident_type}</p>
        ) : null}
        {user?.status ? (
          <p className="mt-1 text-sm text-slate-600">Account status: {user.status}</p>
        ) : null}
      </div>
    </div>
  );
}

export default RoleHomePage;
