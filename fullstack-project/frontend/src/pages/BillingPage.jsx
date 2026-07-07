import { useMemo, useState } from "react";
import ModulePageHeader from "../components/ModulePageHeader";
import { getStoredRole } from "../utils/session";
import "./billing-page.css";

const BILLING_KEY = "chairman_billing_records_v2";

const seedBills = [
  { id: "BILL-1024", billName: "July Maintenance", billType: "Maintenance", month: "July 2026", resident: "Aarav Mehta", tower: "A", wing: "A1", floor: "10", flat: "1004", dueDate: "2026-07-10", amount: 4200, lateFee: 250, status: "paid", paidAmount: 4200, notes: "Monthly maintenance", createdAt: "2026-07-01T08:00:00.000Z" },
  { id: "BILL-1025", billName: "July Maintenance", billType: "Maintenance", month: "July 2026", resident: "Nisha Shah", tower: "B", wing: "B2", floor: "7", flat: "704", dueDate: "2026-07-10", amount: 4200, lateFee: 250, status: "pending", paidAmount: 0, notes: "Monthly maintenance", createdAt: "2026-07-01T08:10:00.000Z" },
  { id: "BILL-1026", billName: "June Water Charge", billType: "Water", month: "June 2026", resident: "Rohan Patel", tower: "C", wing: "C1", floor: "3", flat: "302", dueDate: "2026-06-15", amount: 900, lateFee: 100, status: "overdue", paidAmount: 0, notes: "Metered water bill", createdAt: "2026-06-01T08:10:00.000Z" },
];

const residentChoices = ["All residents", "Tower A", "Tower B", "Tower C", "Owners", "Tenants"];
const aiCharges = [
  ["Maintenance", 3200],
  ["Water", 650],
  ["Electricity", 420],
  ["Parking", 500],
  ["Penalty", 0],
  ["Special charges", 350],
  ["Festival fund", 250],
  ["Repair charges", 300],
  ["Emergency fund", 450],
];

function readBills() {
  if (typeof window === "undefined") return seedBills;
  try {
    return JSON.parse(localStorage.getItem(BILLING_KEY)) || seedBills;
  } catch {
    return seedBills;
  }
}

function Icon({ name }) {
  const paths = {
    ai: "M12 3l1.6 5L18 10l-5.4 2L11 17l-1.6-5L4 10l5.4-2L12 3Zm6 12l.7 2.1L21 18l-2.3.9L18 21l-.7-2.1L15 18l2.3-.9L18 15Z",
    bill: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm4 6h4m-4 4h6",
    download: "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16",
    edit: "m16 3 5 5L9 20H4v-5L16 3Z",
    export: "M14 3h7v7m0-7L10 14M5 5h7M5 12h4M5 19h14",
    paid: "M20 6 9 17l-5-5",
    print: "M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3a2 2 0 0 1-2 2h-2M6 14h12v7H6v-7Z",
    reminder: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 13h4",
    send: "m22 2-7 20-4-9-9-4 20-7Z",
    view: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  };
  return <svg className="bf-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.bill} /></svg>;
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

const blankBill = {
  billName: "Monthly Society Bill",
  billType: "Maintenance",
  month: "July 2026",
  residents: "All residents",
  tower: "",
  wing: "",
  floor: "",
  flat: "",
  dueDate: "2026-07-10",
  lateFee: 250,
  amount: 4200,
  notes: "",
  attachment: "",
};

function BillingPage() {
  const role = getStoredRole();
  const canManage = ["admin", "chairman", "secretary", "accountant", "super_admin"].includes(role);
  const [bills, setBills] = useState(readBills);
  const [draft, setDraft] = useState(blankBill);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState("");

  const metrics = useMemo(() => {
    const totalAmount = bills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const paidAmount = bills.reduce((sum, bill) => sum + Number(bill.paidAmount || 0), 0);
    const paid = bills.filter((bill) => bill.status === "paid").length;
    const pending = bills.filter((bill) => bill.status === "pending").length;
    const overdue = bills.filter((bill) => bill.status === "overdue").length;
    return {
      total: bills.length,
      paid,
      pending,
      overdue,
      collection: totalAmount ? Math.round((paidAmount / totalAmount) * 100) : 0,
      revenue: paidAmount,
    };
  }, [bills]);

  const previewTotal = Number(draft.amount || 0) + Number(draft.lateFee || 0);

  function update(key, value) {
    setToast("");
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function persist(next) {
    setBills(next);
    localStorage.setItem(BILLING_KEY, JSON.stringify(next));
  }

  function applyAiSuggestion() {
    const amount = aiCharges.reduce((sum, [, value]) => sum + value, 0);
    setDraft((current) => ({ ...current, amount, notes: "AI suggested charges based on previous bills: maintenance, water, electricity, parking, repair, festival, and emergency fund." }));
    setToast("AI Bill Generator prepared an itemized amount from previous billing patterns.");
  }

  function sendBills() {
    const bill = {
      ...draft,
      id: `BILL-${Date.now().toString().slice(-6)}`,
      resident: draft.residents,
      status: "pending",
      paidAmount: 0,
      createdAt: new Date().toISOString(),
    };
    persist([bill, ...bills]);
    setSelected(bill);
    setToast("Bills sent. Residents can download PDF, pay, and receive receipts automatically.");
  }

  function markPaid(bill) {
    const next = bills.map((item) => item.id === bill.id ? { ...item, status: "paid", paidAmount: item.amount, receiptId: `RCT-${Date.now().toString().slice(-6)}` } : item);
    persist(next);
    setToast(`${bill.id} marked paid. Receipt generated automatically.`);
  }

  function action(message) {
    setToast(message);
  }

  if (!canManage) {
    return <ResidentBilling bills={bills} onAction={action} />;
  }

  return (
    <main className="billing-finance-page bf-enterprise">
      <ModulePageHeader title="Billing & Finance" subtitle="Generate, preview, send, collect, receipt, and monitor society bills." />
      {toast ? <div className="bf-toast">{toast}</div> : null}

      <section className="bf-metrics">
        <Metric label="Total Bills" value={metrics.total} icon="bill" />
        <Metric label="Paid Bills" value={metrics.paid} icon="paid" />
        <Metric label="Pending Bills" value={metrics.pending} icon="reminder" />
        <Metric label="Overdue Bills" value={metrics.overdue} icon="bill" />
        <Metric label="Collection %" value={`${metrics.collection}%`} icon="view" />
        <Metric label="Revenue" value={currency(metrics.revenue)} icon="paid" />
      </section>

      <section className="bf-workflow">
        {["Generate Bill", "Select Residents", "AI Bill Generator", "Preview", "Send Bills", "Payment Status Live"].map((step, index) => (
          <article key={step}><span>{index + 1}</span><strong>{step}</strong></article>
        ))}
      </section>

      <section className="bf-builder-grid">
        <div className="bf-panel">
          <div className="bf-panel-head">
            <div><span>Create Bill</span><h2>Bill details</h2></div>
            <button type="button" onClick={applyAiSuggestion}><Icon name="ai" /> AI Billing</button>
          </div>
          <div className="bf-form-grid">
            <label>Bill Name<input value={draft.billName} onChange={(event) => update("billName", event.target.value)} /></label>
            <label>Bill Type<select value={draft.billType} onChange={(event) => update("billType", event.target.value)}><option>Maintenance</option><option>Water</option><option>Electricity</option><option>Parking</option><option>Penalty</option><option>Special Charges</option></select></label>
            <label>Month<input value={draft.month} onChange={(event) => update("month", event.target.value)} /></label>
            <label>Residents<select value={draft.residents} onChange={(event) => update("residents", event.target.value)}>{residentChoices.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Tower<input value={draft.tower} onChange={(event) => update("tower", event.target.value)} placeholder="A" /></label>
            <label>Wing<input value={draft.wing} onChange={(event) => update("wing", event.target.value)} placeholder="A1" /></label>
            <label>Floor<input value={draft.floor} onChange={(event) => update("floor", event.target.value)} placeholder="10" /></label>
            <label>Flat<input value={draft.flat} onChange={(event) => update("flat", event.target.value)} placeholder="1004" /></label>
            <label>Due Date<input type="date" value={draft.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label>
            <label>Late Fee<input type="number" value={draft.lateFee} onChange={(event) => update("lateFee", event.target.value)} /></label>
            <label>Amount<input type="number" value={draft.amount} onChange={(event) => update("amount", event.target.value)} /></label>
            <label>Attachment<input value={draft.attachment} onChange={(event) => update("attachment", event.target.value)} placeholder="Attachment URL" /></label>
            <label className="is-wide">Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          </div>
        </div>

        <aside className="bf-panel">
          <div className="bf-panel-head"><div><span>Preview</span><h2>{draft.billName}</h2></div><strong>{currency(previewTotal)}</strong></div>
          <div className="bf-ai-list">
            {aiCharges.map(([label, value]) => <div key={label}><span>{label}</span><strong>{currency(value)}</strong></div>)}
          </div>
          <div className="bf-preview-box">
            <p><strong>Resident scope:</strong> {draft.residents}</p>
            <p><strong>Due date:</strong> {draft.dueDate}</p>
            <p><strong>Notes:</strong> {draft.notes || "No notes added."}</p>
          </div>
          <div className="bf-action-row">
            <button type="button" onClick={() => action("Preview opened for chairman review.")}><Icon name="view" /> View</button>
            <button type="button" onClick={sendBills} className="is-primary"><Icon name="send" /> Send Bills</button>
          </div>
        </aside>
      </section>

      <section className="bf-table-panel">
        <div className="bf-panel-head"><div><span>Chairman Dashboard</span><h2>Live payment status</h2></div><ExportButtons onAction={action} /></div>
        <div className="bf-responsive-table">
          <table>
            <thead><tr><th>Bill</th><th>Resident</th><th>Flat</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td><strong>{bill.id}</strong><span>{bill.billName}</span></td>
                  <td>{bill.resident}</td>
                  <td>{[bill.tower, bill.wing, bill.flat].filter(Boolean).join("-") || bill.flat || "-"}</td>
                  <td>{currency(bill.amount)}</td>
                  <td><span className={`bf-status bf-status--${bill.status}`}>{bill.status}</span></td>
                  <td><BillActions bill={bill} onAction={action} onPaid={markPaid} onSelect={setSelected} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bf-insight-grid">
        <Activity title="Recent Payments" items={bills.filter((bill) => bill.status === "paid").map((bill) => `${bill.id} paid ${currency(bill.paidAmount)}`)} />
        <Activity title="Late Payments" items={bills.filter((bill) => bill.status === "overdue").map((bill) => `${bill.id} overdue since ${bill.dueDate}`)} />
      </section>

      {selected ? <BillDrawer bill={selected} onClose={() => setSelected(null)} onAction={action} /> : null}
    </main>
  );
}

function Metric({ label, value, icon }) {
  return <article className="bf-metric"><span><Icon name={icon} /></span><strong>{value}</strong><p>{label}</p></article>;
}

function ExportButtons({ onAction }) {
  return (
    <div className="bf-action-row">
      <button type="button" onClick={() => onAction("Excel export prepared.")}><Icon name="export" /> Excel</button>
      <button type="button" onClick={() => onAction("PDF export prepared.")}><Icon name="download" /> PDF</button>
      <button type="button" onClick={() => window.print()}><Icon name="print" /> Print</button>
    </div>
  );
}

function BillActions({ bill, onAction, onPaid, onSelect }) {
  return (
    <div className="bf-row-actions">
      <button type="button" title="View" onClick={() => onSelect(bill)}><Icon name="view" /></button>
      <button type="button" title="Edit" onClick={() => onAction(`${bill.id} ready to edit.`)}><Icon name="edit" /></button>
      <button type="button" title="Cancel" onClick={() => onAction(`${bill.id} cancelled.`)}>Cancel</button>
      <button type="button" title="Regenerate" onClick={() => onAction(`${bill.id} regenerated.`)}>Regenerate</button>
      <button type="button" title="Reminder" onClick={() => onAction(`Reminder sent for ${bill.id}.`)}><Icon name="reminder" /></button>
      <button type="button" title="Paid" onClick={() => onPaid(bill)} disabled={bill.status === "paid"}><Icon name="paid" /></button>
      <button type="button" title="Download" onClick={() => onAction(`${bill.id} PDF downloaded.`)}><Icon name="download" /></button>
    </div>
  );
}

function Activity({ title, items }) {
  return <section className="bf-panel"><div className="bf-panel-head"><div><span>{title}</span><h2>{items.length}</h2></div></div>{items.length ? items.map((item) => <p className="bf-activity" key={item}>{item}</p>) : <p className="bf-empty">No records.</p>}</section>;
}

function BillDrawer({ bill, onClose, onAction }) {
  return (
    <div className="bf-drawer-layer" role="presentation" onMouseDown={onClose}>
      <aside className="bf-drawer" role="dialog" aria-modal="true" aria-label="Bill details" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="bf-close" onClick={onClose}>Close</button>
        <span>Bill Preview</span>
        <h2>{bill.billName}</h2>
        <p>{bill.resident} receives this bill instantly with PDF download, payment, and receipt options.</p>
        <div className="bf-preview-box">
          <p><strong>Bill ID:</strong> {bill.id}</p>
          <p><strong>Type:</strong> {bill.billType}</p>
          <p><strong>Month:</strong> {bill.month}</p>
          <p><strong>Due:</strong> {bill.dueDate}</p>
          <p><strong>Amount:</strong> {currency(bill.amount)}</p>
          <p><strong>Status:</strong> {bill.status}</p>
        </div>
        <div className="bf-action-row">
          <button type="button" onClick={() => onAction(`${bill.id} bill PDF downloaded.`)}><Icon name="download" /> Bill PDF</button>
          <button type="button" onClick={() => onAction(`${bill.id} receipt PDF downloaded.`)}><Icon name="download" /> Receipt PDF</button>
        </div>
      </aside>
    </div>
  );
}

function ResidentBilling({ bills, onAction }) {
  return (
    <main className="billing-finance-page bf-enterprise">
      <ModulePageHeader title="My Bills" subtitle="Download bills, pay dues, view status, and access receipt history." />
      <section className="bf-table-panel">
        <div className="bf-panel-head"><div><span>Resident Side</span><h2>Payment History</h2></div></div>
        <div className="bf-responsive-table">
          <table>
            <thead><tr><th>Bill</th><th>Month</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td><strong>{bill.id}</strong><span>{bill.billName}</span></td>
                  <td>{bill.month}</td>
                  <td>{currency(bill.amount)}</td>
                  <td><span className={`bf-status bf-status--${bill.status}`}>{bill.status}</span></td>
                  <td><div className="bf-row-actions"><button type="button" onClick={() => onAction("Bill PDF downloaded.")}>Download Bill PDF</button><button type="button" onClick={() => onAction("Payment started.")}>Pay Bill</button><button type="button" onClick={() => onAction("Receipt PDF downloaded.")}>Download Receipt PDF</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default BillingPage;
