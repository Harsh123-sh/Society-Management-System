import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  createBillTemplate,
  createPaymentOrder,
  fetchAllBills,
  fetchBillingDashboard,
  fetchFinancialAnalytics,
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
const BILLING_PERIODS = ["monthly", "quarterly", "yearly", "special"];

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
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [wingFilter, setWingFilter] = useState("");
  const [floorFilter, setFloorFilter] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [page, setPage] = useState(1);

  const [form, setForm] = useState({
    name: "",
    description: "",
    amount: "",
    dueDate: "",
    billingMonth: "",
    billingPeriod: "monthly",
    billType: "maintenance",
    gracePeriodDays: "0",
    lateFeeFixedAmount: "0",
    lateFeePercentage: "0",
    targetType: "society",
    wing: "",
    floor: "",
    flatIds: [],
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
      if (canViewAllBills) tasks.push(fetchAllBills({ ...queryParams, wing: wingFilter || undefined, floor: floorFilter || undefined }), fetchBillingDashboard(), fetchFinancialAnalytics());
      if (canCreateBill) tasks.push(fetchResidents());

      const results = await Promise.all(tasks);
      let cursor = 0;

      const myBillsResponse = results[cursor++];
      const myPortalResponse = results[cursor++];

      setMyBills(myBillsResponse.data || []);
      setPortal(myPortalResponse.data || { bills: [], payments: [] });

      if (canViewAllBills) {
        const allBillsResponse = results[cursor++];
        const dashboardResponse = results[cursor++];
        const analyticsResponse = results[cursor++];
        setAllBills(allBillsResponse.data || []);
        setDashboard(dashboardResponse.data || null);
        setAnalytics(analyticsResponse.data || null);
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

  async function handleCreateBill(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    try {
      setSubmitting(true);
      const response = await createBillTemplate({
        name: form.name,
        description: form.description || null,
        amount: Number(form.amount),
        dueDate: form.dueDate,
        billingMonth: form.billingMonth || null,
        billingPeriod: form.billingPeriod,
        billType: form.billType,
        gracePeriodDays: Number(form.gracePeriodDays || 0),
        lateFeeFixedAmount: Number(form.lateFeeFixedAmount || 0),
        lateFeePercentage: Number(form.lateFeePercentage || 0),
        targetType: form.targetType,
        wing: form.wing || null,
        floor: form.floor || null,
        flatIds: form.flatIds,
      });

      setAlert({ type: "success", message: `${response.data?.generatedCount || 0} bills generated successfully` });
      setForm({
        name: "",
        description: "",
        amount: "",
        dueDate: "",
        billingMonth: "",
        billingPeriod: "monthly",
        billType: "maintenance",
        gracePeriodDays: "0",
        lateFeeFixedAmount: "0",
        lateFeePercentage: "0",
        targetType: "society",
        wing: "",
        floor: "",
        flatIds: [],
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
  const sortedBills = useMemo(() => {
    const rows = [...historyBills];
    rows.sort((a, b) => {
      if (sortKey === "amount") return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      if (sortKey === "due_date") return String(a.due_date || "").localeCompare(String(b.due_date || ""));
      if (sortKey === "status") return String(a.status || "").localeCompare(String(b.status || ""));
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
    return rows;
  }, [historyBills, sortKey]);
  const pageSize = 8;
  const pagedBills = sortedBills.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(sortedBills.length / pageSize));
  const outstandingAmount = historyBills.reduce((sum, bill) => sum + Math.max(0, Number(bill.total_amount || 0) - Number(bill.paid_amount || 0)), 0);

  const billingStats = useMemo(() => {
    const source = canViewAllBills ? allBills : myBills;
    return {
      total: source.length,
      paid: source.filter((bill) => bill.status === "paid").length,
      overdue: source.filter((bill) => bill.status === "overdue").length,
      unpaid: source.filter((bill) => bill.status === "unpaid").length,
      collected: source.reduce((sum, bill) => sum + Number(bill.paid_amount || 0), 0),
      outstandingAmount,
    };
  }, [allBills, canViewAllBills, myBills, outstandingAmount]);

  const kpiTotals = dashboard?.totals || {};

  function exportCsv(extension = "csv") {
    const headers = ["Bill Number", "Bill Name", "Flat", "Resident", "Amount", "Paid", "Due Date", "Status", "Created"];
    const rows = sortedBills.map((bill) => [
      bill.invoice_number || `BILL-${bill.id}`,
      bill.title || "",
      bill.flat_number || "",
      bill.resident_name || "",
      Number(bill.total_amount || 0).toFixed(2),
      Number(bill.paid_amount || 0).toFixed(2),
      String(bill.due_date || "").slice(0, 10),
      bill.status || "",
      String(bill.created_at || "").slice(0, 10),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billing-export.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="chairman-page space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-cyan-900 p-6 text-[var(--text-main)] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">Billing and payments</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Invoice and payment center</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
          Maintenance, parking, and utility billing with online UPI and Razorpay-ready payment APIs, reminders, late fees, and invoice tracking.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total bills</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{kpiTotals.totalbills || billingStats.total}</p>
        </div>
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{kpiTotals.paidbills || billingStats.paid}</p>
        </div>
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Unpaid</p>
          <p className="mt-2 text-2xl font-bold text-cyan-700">{kpiTotals.unpaidbills || billingStats.unpaid}</p>
        </div>
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Overdue</p>
          <p className="mt-2 text-2xl font-bold text-rose-700">{kpiTotals.overduecount || billingStats.overdue}</p>
        </div>
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Collection</p>
          <p className="mt-2 text-2xl font-bold text-indigo-700">INR {Number(kpiTotals.totalcollected || billingStats.collected).toFixed(2)}</p>
        </div>
        <div className="chairman-page rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">INR {Number(kpiTotals.totaloutstanding || outstandingAmount).toFixed(2)}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="chairman-page grid gap-3 lg:grid-cols-[1fr_150px_150px_120px_120px_150px_auto_auto_auto_auto]">
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
          <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Wing" value={wingFilter} onChange={(event) => setWingFilter(event.target.value)} />
          <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Floor" value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)} />
          <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            <option value="created_at">Newest</option>
            <option value="due_date">Due date</option>
            <option value="amount">Amount</option>
            <option value="status">Status</option>
          </select>
          <button type="button" onClick={() => loadData()} className="rounded-2xl theme-surface px-4 py-3 text-sm font-semibold text-[var(--text-main)]">Apply</button>
          <button type="button" onClick={() => exportCsv("csv")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">CSV</button>
          <button type="button" onClick={() => exportCsv("xls")} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Excel</button>
          <button type="button" onClick={() => window.print()} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Print</button>
        </div>
      </section>

      {canCreateBill ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="chairman-page flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Generate bill / invoice</h3>
            <div className="chairman-page flex gap-2">
              <button type="button" onClick={handleRunLateFee} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Run late fee</button>
              <button type="button" onClick={handleRunReminders} className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-800">Send reminders</button>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleCreateBill}>
            <div className="chairman-page grid gap-3 md:grid-cols-4">
              <input required type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Bill name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input required type="number" min="1" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Amount" value={form.amount} onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))} />
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.billType} onChange={(event) => setForm((prev) => ({ ...prev, billType: event.target.value }))}>
                {BILL_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.billingPeriod} onChange={(event) => setForm((prev) => ({ ...prev, billingPeriod: event.target.value }))}>
                {BILLING_PERIODS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>

            <div className="chairman-page grid gap-3 md:grid-cols-4">
              <input required type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.dueDate} onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))} />
              <input type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.billingMonth} onChange={(event) => setForm((prev) => ({ ...prev, billingMonth: event.target.value }))} />
              <input type="number" min="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Grace days" value={form.gracePeriodDays} onChange={(event) => setForm((prev) => ({ ...prev, gracePeriodDays: event.target.value }))} />
              <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            </div>

            <div className="chairman-page grid gap-3 md:grid-cols-4">
              <input type="number" min="0" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Late fee fixed" value={form.lateFeeFixedAmount} onChange={(event) => setForm((prev) => ({ ...prev, lateFeeFixedAmount: event.target.value }))} />
              <input type="number" min="0" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Late fee %" value={form.lateFeePercentage} onChange={(event) => setForm((prev) => ({ ...prev, lateFeePercentage: event.target.value }))} />
              <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" value={form.targetType} onChange={(event) => setForm((prev) => ({ ...prev, targetType: event.target.value, flatIds: [] }))}>
                <option value="society">Entire society</option>
                <option value="wing">Wing wise</option>
                <option value="floor">Floor wise</option>
                <option value="custom">Custom flats</option>
              </select>
              {form.targetType === "wing" ? (
                <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Wing" value={form.wing} onChange={(event) => setForm((prev) => ({ ...prev, wing: event.target.value }))} />
              ) : form.targetType === "floor" ? (
                <input type="text" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none" placeholder="Floor" value={form.floor} onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))} />
              ) : (
                <div className="chairman-page rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{form.targetType === "society" ? "All active flats" : `${form.flatIds.length} flats selected`}</div>
              )}
            </div>

            {form.targetType === "custom" ? (
              <div className="chairman-page grid max-h-48 gap-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {residents.map((resident) => (
                  <label key={resident.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.flatIds.includes(resident.flat_id)}
                      onChange={(event) => setForm((prev) => ({
                        ...prev,
                        flatIds: event.target.checked
                          ? [...prev.flatIds, resident.flat_id].filter(Boolean)
                          : prev.flatIds.filter((id) => id !== resident.flat_id),
                      }))}
                    />
                    <span>{resident.flat_number || "Flat"} - {resident.name}</span>
                  </label>
                ))}
              </div>
            ) : null}

            <button type="submit" disabled={submitting} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">
              {submitting ? "Generating..." : "Generate society bills"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-950">Resident payment portal</h3>
        <div className="chairman-page grid gap-4 xl:grid-cols-2">
          {(canViewAllBills ? historyBills : portal.bills || historyBills).map((bill) => {
            const balance = Number(bill.total_amount || 0) - Number(bill.paid_amount || 0);
            return (
              <article key={bill.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="chairman-page flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-950">{bill.title}</h4>
                    <p className="text-sm text-slate-600">{bill.invoice_number || `BILL-${bill.id}`} • {bill.bill_type} • Due {String(bill.due_date).slice(0, 10)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{bill.status}</span>
                </div>

                <div className="chairman-page mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                  <div>Total: INR {Number(bill.total_amount).toFixed(2)}</div>
                  <div>Paid: INR {Number(bill.paid_amount || 0).toFixed(2)}</div>
                  <div>Balance: INR {Math.max(0, balance).toFixed(2)}</div>
                </div>

                <div className="chairman-page mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleOpenInvoice(bill.id)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">View invoice</button>
                  {!canViewAllBills && balance > 0 ? (
                    <button type="button" disabled={activePaymentBillId === bill.id} onClick={() => handlePayWithUpi(bill)} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-[var(--text-main)] disabled:opacity-60">
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
          <div className="chairman-page flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-950">Invoice preview</h3>
            <button type="button" onClick={() => setInvoicePreview(null)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Close</button>
          </div>
          <div className="chairman-page mt-3 text-sm text-slate-700">
            <p><strong>{invoicePreview.invoiceNumber}</strong> • {String(invoicePreview.invoiceDate).slice(0, 10)}</p>
            <p>Resident: {invoicePreview.resident?.name} ({invoicePreview.resident?.email})</p>
            <p>Type: {invoicePreview.bill?.type}</p>
            <p>Balance: INR {Number(invoicePreview.bill?.balanceAmount || 0).toFixed(2)}</p>
          </div>
        </section>
      ) : null}

      {!loading && !historyBills.length ? (
        <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No billing history found.</div>
      ) : null}
    </div>
  );
}

export default BillingPage;
