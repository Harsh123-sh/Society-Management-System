import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { fetchMyBills } from "../services/billingApi";
import { fetchMyDocuments } from "../services/documentApi";
import { createVisitorRequest } from "../services/securityApi";

function TenantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [bills, setBills] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [visitorForm, setVisitorForm] = useState({ visitorName: "", phone: "", purpose: "", expectedAt: "" });

  const stats = useMemo(
    () => ({
      unpaidBills: bills.filter((bill) => bill.status === "unpaid").length,
      totalRentAmount: bills.reduce((acc, bill) => acc + Number(bill.total_amount || 0), 0),
      pendingDocuments: documents.filter((doc) => doc.status === "pending").length,
    }),
    [bills, documents]
  );

  const tenantNotifications = [
    "Rent reminder due on 5th of this month",
    "Complaint status updated to In Progress",
    "Visitor request approval needed",
  ];

  async function handleVisitorSubmit(event) {
    event.preventDefault();

    if (!visitorForm.visitorName || !visitorForm.purpose) {
      setAlert({ type: "error", message: "Visitor name and purpose are required" });
      return;
    }

    try {
      await createVisitorRequest(visitorForm);
      setAlert({ type: "success", message: "Visitor request submitted" });
      setVisitorForm({ visitorName: "", phone: "", purpose: "", expectedAt: "" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not submit visitor request") });
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [billsRes, docsRes] = await Promise.all([fetchMyBills(), fetchMyDocuments()]);
        setBills(billsRes.data || []);
        setDocuments(docsRes.data || []);
      } catch (error) {
        setAlert({
          type: "error",
          message: getApiMessage(error, "Could not load tenant dashboard"),
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <div className="resident-page resident-tenant-page text-sm text-[rgb(var(--app-text-muted-rgb))]">Loading...</div>;

  return (
    <div className="resident-page resident-tenant-page space-y-6">
      <section className="surface-card app-surface rounded-[28px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">Tenant Dashboard</p>
        <h2 className="mt-2 text-3xl font-bold text-[rgb(var(--app-text-rgb))]">Rent, documents, and visitor requests</h2>
        <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--app-text-muted-rgb))]">The tenant view now uses the same premium surface system as the rest of the application.</p>
      </section>
      <AlertMessage type={alert.type} message={alert.message} />

      <section className="resident-metric-grid grid gap-4 md:grid-cols-3">
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Unpaid Rent / Maintenance</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.unpaidBills}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Total Due Amount</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.totalRentAmount.toFixed(2)}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Pending Documents</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.pendingDocuments}</p>
        </div>
      </section>

      <section className="surface-card app-surface p-4">
        <h3 className="mb-3 text-base font-semibold text-[rgb(var(--app-text-rgb))]">Rent Info</h3>
        {bills.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[rgb(var(--app-surface-muted-rgb))] text-[rgb(var(--app-text-muted-rgb))]">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Due Date</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-t border-[rgb(var(--app-border-rgb))]">
                    <td className="px-3 py-2">{bill.title}</td>
                    <td className="px-3 py-2">{bill.due_date?.slice(0, 10)}</td>
                    <td className="px-3 py-2">{Number(bill.total_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-2">{bill.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">No bills available.</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">Visitor Pre-Approval</h3>
          <form className="mt-3 space-y-2" onSubmit={handleVisitorSubmit}>
            <input className="ui-input w-full px-3 py-2 text-sm" placeholder="Visitor name" value={visitorForm.visitorName} onChange={(event) => setVisitorForm((prev) => ({ ...prev, visitorName: event.target.value }))} />
            <input className="ui-input w-full px-3 py-2 text-sm" placeholder="Phone" value={visitorForm.phone} onChange={(event) => setVisitorForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input className="ui-input w-full px-3 py-2 text-sm" placeholder="Purpose" value={visitorForm.purpose} onChange={(event) => setVisitorForm((prev) => ({ ...prev, purpose: event.target.value }))} />
            <input className="ui-input w-full px-3 py-2 text-sm" type="datetime-local" value={visitorForm.expectedAt} onChange={(event) => setVisitorForm((prev) => ({ ...prev, expectedAt: event.target.value }))} />
            <button className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition-all hover:opacity-90">Approve Visitor</button>
          </form>
        </article>

        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">Parking & Delivery</h3>
          <div className="mt-3 space-y-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
            <p className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2">Assigned parking slot: B-14</p>
            <p className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2">Vehicle details: MH12AB2044</p>
            <p className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2">Package delivery status: 2 pending</p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">Notifications</h3>
          <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
            {tenantNotifications.map((note) => (
              <li key={note} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2">{note}</li>
            ))}
          </ul>
        </article>

        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">AI Tenant Features</h3>
          <div className="mt-3 space-y-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">Smart complaint assistant: "AC not working" =&gt; Electrical, Medium priority</p>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">Expense insight: rent + maintenance are your biggest monthly costs</p>
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">Rent reminder AI predicts late payment and sends smart reminders</p>
          </div>
        </article>
      </section>

      <section className="surface-card app-surface p-4">
        <h3 className="mb-3 text-base font-semibold text-[rgb(var(--app-text-rgb))]">Document Status</h3>
        {documents.length ? (
          <ul className="space-y-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
            {documents.slice(0, 8).map((doc) => (
              <li key={doc.id} className="rounded-xl border border-[rgb(var(--app-border-rgb))] p-2">
                {doc.document_type} - {doc.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">No documents uploaded yet.</p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition-all hover:opacity-90" to="/resident/documents">
          Upload Documents
        </Link>
        <Link className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]" to="/resident/billing">
          View Bills
        </Link>
      </div>
    </div>
  );
}

export default TenantDashboardPage;
