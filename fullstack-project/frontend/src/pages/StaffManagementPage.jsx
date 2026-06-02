import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { fetchUsers } from "../services/userApi";

function StaffManagementPage() {
  const [staffRows, setStaffRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function loadStaff() {
    try {
      setLoading(true);
      const response = await fetchUsers({ role: "all", status: "all", limit: 100 });
      const users = response?.data || [];
      const scopedStaff = users.filter((user) => ["staff", "security"].includes(String(user?.role || "").toLowerCase()));
      setStaffRows(scopedStaff);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load staff data") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  const stats = useMemo(() => {
    return {
      total: staffRows.length,
      active: staffRows.filter((item) => String(item?.status || "").toLowerCase() === "active").length,
      roleTypes: new Set(staffRows.map((item) => String(item?.role || "").toLowerCase())).size,
    };
  }, [staffRows]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Staff Management</h2>
        <p className="text-sm text-slate-600">
          Add society staff, assign roles, and monitor work responsibility coverage.
        </p>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Staff</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.active}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Role Types</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.roleTypes}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Staff Register</h3>

        {loading ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading staff...</div>
        ) : staffRows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map((staff) => (
                  <tr key={staff.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{staff.name}</td>
                    <td className="px-3 py-2 text-slate-700">{staff.role}</td>
                    <td className="px-3 py-2 text-slate-700">{staff.email || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          String(staff.status || "").toLowerCase() === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {staff.status || "inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No staff registered yet.
          </div>
        )}
      </section>
    </div>
  );
}

export default StaffManagementPage;
