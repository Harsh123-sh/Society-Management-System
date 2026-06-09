import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/authApi";

function SocietyPage() {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSocieties() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/societies");
        setSocieties(response?.data?.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load societies. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadSocieties();
  }, []);

  const metrics = useMemo(
    () => ({
      total: societies.length,
      active: societies.filter((society) => society.status === "active").length,
      archived: societies.filter((society) => society.status === "archived").length,
    }),
    [societies]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Society data manager</h1>
          <p className="mt-2 text-slate-600">Browse society records loaded from the backend API, including society codes and location fields.</p>
        </div>
        <button className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:shadow-lg xl:w-auto">
          ➕ Add Society
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total societies</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{metrics.total}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Active societies</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{metrics.active}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Archived societies</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{metrics.archived}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Database powered</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">API</p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Society dataset</h2>
            <p className="mt-1 text-sm text-slate-500">Data comes from /api/societies and includes society_code, city, state, subscription plan, and status.</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">Loading societies...</div>
        ) : error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
        ) : societies.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No societies found.</div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Society code</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">City</th>
                  <th className="px-4 py-3 font-semibold">State</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {societies.map((society) => (
                  <tr key={society.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-4 text-slate-600">{society.id}</td>
                    <td className="px-4 py-4 text-slate-900 font-medium">{society.society_code || society.code}</td>
                    <td className="px-4 py-4 text-slate-700">{society.name}</td>
                    <td className="px-4 py-4 text-slate-600">{society.city || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{society.state || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{society.subscription_plan || "-"}</td>
                    <td className="px-4 py-4 text-slate-600 capitalize">{society.status || "-"}</td>
                    <td className="px-4 py-4 text-slate-600">{society.created_at ? new Date(society.created_at).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SocietyPage;
