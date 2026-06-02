import { useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { createVisitorRequest } from "../services/securityApi";

function TenantVisitorsPage() {
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [form, setForm] = useState({ visitorName: "", phone: "", purpose: "", expectedAt: "", notes: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.visitorName || !form.purpose) {
      setAlert({ type: "error", message: "Visitor name and purpose are required" });
      return;
    }

    try {
      await createVisitorRequest(form);
      setAlert({ type: "success", message: "Visitor request submitted" });
      setForm({ visitorName: "", phone: "", purpose: "", expectedAt: "", notes: "" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not submit visitor request") });
    }
  }

  const requests = [
    { visitorName: "Food Delivery", status: "Approved", time: "12:00 PM" },
    { visitorName: "John Doe", status: "Pending", time: "4:30 PM" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Visitor Pre-Approval</h2>
        <p className="mt-1 text-sm text-slate-200">Add visitors before arrival and approve delivery access from one place.</p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Add Visitor</h3>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Visitor name" value={form.visitorName} onChange={(event) => setForm((prev) => ({ ...prev, visitorName: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Purpose" value={form.purpose} onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" type="datetime-local" value={form.expectedAt} onChange={(event) => setForm((prev) => ({ ...prev, expectedAt: event.target.value }))} />
            <textarea className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Submit Request</button>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Recent Requests</h3>
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <div key={`${request.visitorName}-${request.time}`} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="font-semibold text-slate-900">{request.visitorName}</p>
                <p className="text-xs text-slate-500">{request.status} | {request.time}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default TenantVisitorsPage;
