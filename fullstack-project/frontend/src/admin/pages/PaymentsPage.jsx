import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getApiMessage } from "../../services/authApi";
import { fetchBillingDashboard, fetchFinancialAnalytics, runLateFeeAutomation, runPaymentReminders } from "../../services/billingApi";

function StatCard({ label, value, tone = "slate" }) {
  const toneClass = {
    slate: "text-slate-900",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    rose: "text-rose-700",
  }[tone] || "text-slate-900";

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-200">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    totals: { totalBills: 0, totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0, overdueCount: 0 },
    billTypeBreakdown: [],
    monthlyCollections: [],
    recentPayments: [],
  });
  const [analytics, setAnalytics] = useState({ collectionEfficiency: [], defaulters: [], aiInsights: null });
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const [dashboardResponse, analyticsResponse] = await Promise.all([
        fetchBillingDashboard(),
        fetchFinancialAnalytics(),
      ]);

      setDashboard(dashboardResponse.data || dashboard);
      setAnalytics(analyticsResponse.data || analytics);
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Could not load payment analytics"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLateFee() {
    try {
      setActionLoading("late-fee");
      await runLateFeeAutomation({ lateFeeType: "percentage", lateFeeValue: 5, graceDays: 0 });
      await loadData();
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Could not run late fee automation"));
    } finally {
      setActionLoading("");
    }
  }

  async function handleReminders() {
    try {
      setActionLoading("reminders");
      await runPaymentReminders({ dueSoonDays: 3 });
      await loadData();
    } catch (error) {
      setErrorMessage(getApiMessage(error, "Could not trigger reminders"));
    } finally {
      setActionLoading("");
    }
  }

  const collectionRate = useMemo(() => {
    const invoiced = Number(dashboard.totals?.totalInvoiced || 0);
    const collected = Number(dashboard.totals?.totalCollected || 0);
    if (!invoiced) return 0;
    return ((collected / invoiced) * 100).toFixed(2);
  }, [dashboard.totals]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Billing Dashboard</h1>
          <p className="mt-1 text-slate-600">Maintenance, parking, utility invoices, payment collection, and AI insights</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLateFee}
            disabled={actionLoading === "late-fee"}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {actionLoading === "late-fee" ? "Applying..." : "Run Late Fee"}
          </button>
          <button
            type="button"
            onClick={handleReminders}
            disabled={actionLoading === "reminders"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {actionLoading === "reminders" ? "Sending..." : "Send Reminders"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Invoiced" value={`INR ${Number(dashboard.totals?.totalInvoiced || 0).toFixed(2)}`} />
        <StatCard label="Total Collected" value={`INR ${Number(dashboard.totals?.totalCollected || 0).toFixed(2)}`} tone="emerald" />
        <StatCard label="Outstanding" value={`INR ${Number(dashboard.totals?.totalOutstanding || 0).toFixed(2)}`} tone="amber" />
        <StatCard label="Overdue Bills" value={dashboard.totals?.overdueCount || 0} tone="rose" />
        <StatCard label="Collection Rate" value={`${collectionRate}%`} tone="emerald" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Monthly Invoiced vs Collected</h3>
          <div className="mt-4 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboard.monthlyCollections || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="invoiced" stroke="#0f172a" strokeWidth={2} />
                  <Line type="monotone" dataKey="collected" stroke="#059669" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Bill Type Distribution</h3>
          <div className="mt-4 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.billTypeBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bill_type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">AI Financial Analytics</h3>
        <p className="mt-1 text-sm text-slate-600">Smart recommendations and risk insights generated from billing behavior.</p>
        <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {analytics.aiInsights?.summary || "AI summary unavailable"}
        </div>
        {(analytics.aiInsights?.recommendations || []).length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {analytics.aiInsights.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Top Defaulters</h3>
          <div className="mt-3 space-y-2">
            {(analytics.defaulters || []).map((item) => (
              <div key={`${item.resident_id}-${item.outstandingAmount}`} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{item.resident_name}</p>
                  <p className="text-slate-600">{item.resident_email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-rose-700">INR {Number(item.outstandingAmount || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{item.overdueBills} overdue bills</p>
                </div>
              </div>
            ))}
            {!analytics.defaulters?.length ? (
              <p className="text-sm text-slate-500">No defaulters found.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Recent Payment Transactions</h3>
          <div className="mt-3 space-y-2">
            {(dashboard.recentPayments || []).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{payment.invoice_number || `BILL-${payment.bill_id}`}</p>
                  <p className="text-slate-600">{payment.resident_name} • {payment.payment_method || payment.gateway_provider}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">INR {Number(payment.amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-500">{payment.status}</p>
                </div>
              </div>
            ))}
            {!dashboard.recentPayments?.length ? (
              <p className="text-sm text-slate-500">No recent payments.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentsPage;
