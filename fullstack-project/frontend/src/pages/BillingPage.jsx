import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  createBill,
  createPaymentOrder,
  fetchAllBills,
  fetchInvoice,
  fetchMyBills,
  fetchMyPaymentPortal,
  fetchResidents,
  markBillPaid,
  payViaUpi,
  runLateFeeAutomation,
  runPaymentReminders,
} from "../services/billingApi";

const BILL_TYPES = ["maintenance", "parking", "utility", "other"];

function BillingPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const role = currentUser?.role || "resident";
  const canCreateBill = role === "admin" || role === "secretary";
  const canViewAllBills = role === "admin" || role === "secretary";

  const [residents, setResidents] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [myBills, setMyBills] = useState([]);
  const [portal, setPortal] = useState({ bills: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [billTypeFilter, setBillTypeFilter] = useState("");
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [activePaymentBillId, setActivePaymentBillId] = useState(null);

  const [form, setForm] = useState({
    residentId: "",
    title: "",
    dueDate: "",
    billingMonth: "",
    billType: "maintenance",
    notes: "",
    charges: [{ charge_name: "", charge_type: "maintenance", amount: "" }],
  });

  async function loadData({ searchValue = search, statusValue = statusFilter, billTypeValue = billTypeFilter } = {}) {
    try {
      setLoading(true);

      const queryParams = {
        search: searchValue || undefined,
        status: statusValue || undefined,
        billType: billTypeValue || undefined,
      };

      const tasks = [fetchMyBills(queryParams), fetchMyPaymentPortal()];
      if (canViewAllBills) tasks.push(fetchAllBills(queryParams));
      if (canCreateBill) tasks.push(fetchResidents());

      const results = await Promise.all(tasks);
      let cursor = 0;

      const myBillsResponse = results[cursor++];
      const myPortalResponse = results[cursor++];

      setMyBills(myBillsResponse.data || []);
      setPortal(myPortalResponse.data || { bills: [], payments: [] });

      if (canViewAllBills) {
        const allBillsResponse = results[cursor++];
        setAllBills(allBillsResponse.data || []);
      }

      if (canCreateBill) {
        const residentsResponse = results[cursor++];
        const residentUsers = (residentsResponse.data || []).filter((user) => user.role === "resident" && user.status === "active");
        setResidents(residentUsers);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load billing data"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function updateCharge(index, key, value) {
    setForm((prev) => {
      const updatedCharges = [...prev.charges];
      updatedCharges[index] = { ...updatedCharges[index], [key]: value };
      return { ...prev, charges: updatedCharges };
    });
  }

  async function handleCreateBill(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    try {
      setSubmitting(true);
      await createBill({
        residentId: Number(form.residentId),
        title: form.title,
        dueDate: form.dueDate,
        billingMonth: form.billingMonth || null,
        billType: form.billType,
        notes: form.notes || null,
        charges: form.charges.map((charge) => ({
          charge_name: charge.charge_name,
          charge_type: charge.charge_type,
          amount: Number(charge.amount),
        })),
      });

      setAlert({ type: "success", message: "Bill generated successfully" });
      setForm({
        residentId: "",
        title: "",
        dueDate: "",
        billingMonth: "",
        billType: "maintenance",
        notes: "",
        charges: [{ charge_name: "", charge_type: "maintenance", amount: "" }],
      });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create bill") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRunLateFee() {
    try {
      await runLateFeeAutomation({ lateFeeType: "percentage", lateFeeValue: 5, graceDays: 0 });
      setAlert({ type: "success", message: "Late fee automation completed" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not run late fee automation") });
    }
  }

  async function handleRunReminders() {
    try {
      await runPaymentReminders({ dueSoonDays: 3 });
      setAlert({ type: "success", message: "Payment reminders triggered" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not run reminders") });
    }
  }

  async function handleOpenInvoice(billId) {
    try {
      const response = await fetchInvoice(billId);
      setInvoicePreview(response.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load invoice") });
    }
  }

  async function handlePayWithUpi(bill) {
    try {
      setActivePaymentBillId(bill.id);
      const orderResponse = await createPaymentOrder(bill.id, {
        method: "upi",
        amount: Number(bill.total_amount || 0) - Number(bill.paid_amount || 0),
      });

      await payViaUpi(bill.id, {
        paymentId: orderResponse.data.paymentId,
        upiReference: `UPI-${Date.now()}`,
        upiId: "resident@upi",
      });

      setAlert({ type: "success", message: "UPI payment completed" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not complete UPI payment") });
    } finally {
      setActivePaymentBillId(null);
    }
  }

  async function handleManualMarkPaid(billId) {
    try {
      await markBillPaid(billId);
      setAlert({ type: "success", message: "Bill marked as paid" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update bill") });
    }
  }

  const historyBills = canViewAllBills ? allBills : myBills;
  const outstandingAmount = historyBills.reduce((sum, bill) => sum + Math.max(0, Number(bill.total_amount || 0) - Number(bill.paid_amount || 0)), 0);

  const billingStats = useMemo(() => {
    const source = canViewAllBills ? allBills : myBills;
    return {
      total: source.length,
      paid: source.filter((bill) => bill.status === "paid").length,
      overdue: source.filter((bill) => bill.status === "overdue").length,
      outstandingAmount,
    };
  }, [allBills, canViewAllBills, myBills, outstandingAmount]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Billing and payments</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Invoice and payment center</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
          Maintenance, parking, and utility billing with online UPI and Razorpay-ready payment APIs, reminders, late fees, and invoice tracking.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total bills</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{billingStats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{billingStats.paid}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{billingStats.overdue}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">INR {Number(outstandingAmount).toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_auto]">
          <input
            type="text"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
            placeholder="Search bills"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All status</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="partially_paid">Partially paid</option>
            <option value="paid">Paid</option>
          </select>
          <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={billTypeFilter} onChange={(event) => setBillTypeFilter(event.target.value)}>
            <option value="">All types</option>
            {BILL_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <button type="button" onClick={() => loadData()} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Apply</button>
        </div>
      </section>

      {canCreateBill ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Generate bill / invoice</h3>
            <div className="flex gap-2">
              <button type="button" onClick={handleRunLateFee} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Run late fee</button>
              <button type="button" onClick={handleRunReminders} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">Send reminders</button>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleCreateBill}>
            <div className="grid gap-3 md:grid-cols-3">
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.residentId} onChange={(event) => setForm((prev) => ({ ...prev, residentId: event.target.value }))}>
                <option value="">Select resident</option>
                {residents.map((resident) => (
                  <option key={resident.id} value={resident.id}>{resident.name} ({resident.email})</option>
                ))}
              </select>
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.billType} onChange={(event) => setForm((prev) => ({ ...prev, billType: event.target.value }))}>
                {BILL_TYPES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Bill title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
              <input type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.billingMonth} onChange={(event) => setForm((prev) => ({ ...prev, billingMonth: event.target.value }))} />
              <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Notes" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {form.charges.map((charge, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_170px_140px_90px]">
                  <input type="text" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" placeholder="Charge name" value={charge.charge_name} onChange={(event) => updateCharge(index, "charge_name", event.target.value)} />
                  <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" value={charge.charge_type} onChange={(event) => updateCharge(index, "charge_type", event.target.value)}>
                    <option value="maintenance">maintenance</option>
                    <option value="parking">parking</option>
                    <option value="utility">utility</option>
                    <option value="misc">misc</option>
                  </select>
                  <input type="number" min="0" step="0.01" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none" placeholder="Amount" value={charge.amount} onChange={(event) => updateCharge(index, "amount", event.target.value)} />
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, charges: prev.charges.filter((_, i) => i !== index) || [{ charge_name: "", charge_type: "maintenance", amount: "" }] }))} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">Remove</button>
                </div>
              ))}

              <button type="button" onClick={() => setForm((prev) => ({ ...prev, charges: [...prev.charges, { charge_name: "", charge_type: "maintenance", amount: "" }] }))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Add charge</button>
            </div>

            <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {submitting ? "Generating..." : "Generate invoice"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Resident payment portal</h3>
        <div className="grid gap-4 xl:grid-cols-2">
          {(canViewAllBills ? historyBills : portal.bills || historyBills).map((bill) => {
            const balance = Number(bill.total_amount || 0) - Number(bill.paid_amount || 0);
            return (
              <article key={bill.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-950">{bill.title}</h4>
                    <p className="text-sm text-slate-600">{bill.invoice_number || `BILL-${bill.id}`} • {bill.bill_type} • Due {String(bill.due_date).slice(0, 10)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{bill.status}</span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                  <div>Total: INR {Number(bill.total_amount).toFixed(2)}</div>
                  <div>Paid: INR {Number(bill.paid_amount || 0).toFixed(2)}</div>
                  <div>Balance: INR {Math.max(0, balance).toFixed(2)}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleOpenInvoice(bill.id)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">View invoice</button>
                  {!canViewAllBills && balance > 0 ? (
                    <button type="button" disabled={activePaymentBillId === bill.id} onClick={() => handlePayWithUpi(bill)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
                      {activePaymentBillId === bill.id ? "Processing..." : "Pay online (UPI)"}
                    </button>
                  ) : null}
                  {!canViewAllBills && balance > 0 ? (
                    <button type="button" onClick={() => handleManualMarkPaid(bill.id)} className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Mark as paid</button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {invoicePreview ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Invoice preview</h3>
            <button type="button" onClick={() => setInvoicePreview(null)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Close</button>
          </div>
          <div className="mt-3 text-sm text-slate-700">
            <p><strong>{invoicePreview.invoiceNumber}</strong> • {String(invoicePreview.invoiceDate).slice(0, 10)}</p>
            <p>Resident: {invoicePreview.resident?.name} ({invoicePreview.resident?.email})</p>
            <p>Type: {invoicePreview.bill?.type}</p>
            <p>Balance: INR {Number(invoicePreview.bill?.balanceAmount || 0).toFixed(2)}</p>
          </div>
        </section>
      ) : null}

      {!loading && !historyBills.length ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No billing history found.</div>
      ) : null}
    </div>
  );
}

export default BillingPage;
