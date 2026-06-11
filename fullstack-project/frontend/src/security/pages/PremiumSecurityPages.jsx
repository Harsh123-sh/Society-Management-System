import { useEffect, useMemo, useState } from "react";
import CameraCapture from "../../components/CameraCapture";
import AlertMessage from "../../components/AlertMessage";
import { getApiMessage } from "../../services/authApi";
import {
  createVisitorEntry,
  fetchVisitorLogs,
  markVisitorExit,
  fetchSecurityPreapprovals,
  securityUpdatePreapprovalStatus,
  verifyPreapprovalQr,
  securityCheckInPreapproval,
  sendVisitorOtp,
  verifyVisitorOtp,
  fetchVisitorVehicles,
  fetchVisitorDeliveries,
  fetchVisitorEmergencyAlerts,
} from "../../services/visitorApi";

const WING_LABELS = ["A", "B", "C", "D"];


const deliverySeed = [
  { id: 1, vendor: "Zippy Courier", flat: "A-110", type: "Courier", status: "pending" },
  { id: 2, vendor: "FoodDash", flat: "C-502", type: "Food", status: "delivered" },
  { id: 3, vendor: "FreshKart", flat: "B-405", type: "Grocery", status: "pending" },
];

const vehicleSeed = [
  { id: 1, vehicleNumber: "MH12AB2044", owner: "Visitor", flat: "A-302", status: "inside" },
  { id: 2, vehicleNumber: "MH14PQ8843", owner: "Resident", flat: "B-108", status: "inside" },
  { id: 3, vehicleNumber: "DL01KD9921", owner: "Visitor", flat: "C-502", status: "outside" },
];

const gatePassSeed = [
  { id: 1, name: "Suresh", type: "Worker", validity: "Weekly", passCode: "GP-4102", active: true },
  { id: 2, name: "Ravi", type: "Temporary", validity: "Daily", passCode: "GP-4127", active: true },
];

const staffSeed = [
  { id: 1, name: "Anita", role: "Maid", flat: "A-401", checkIn: "08:10", status: "inside" },
  { id: 2, name: "Kishore", role: "Electrician", flat: "B-309", checkIn: "09:20", status: "outside" },
  { id: 3, name: "Ramu", role: "Driver", flat: "D-101", checkIn: "10:05", status: "inside" },
];

const alertsSeed = [
  { id: 1, level: "critical", title: "Unauthorized entry alert", detail: "No token used at Gate-2", time: "11:23" },
  { id: 2, level: "warning", title: "Suspicious repeated visitor", detail: "Same phone visited 3 flats this week", time: "10:08" },
  { id: 3, level: "info", title: "Late-night entry pattern", detail: "After-hours requests increased by 18%", time: "09:40" },
];

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, helper, tone = "slate" }) {
  const toneClass = {
    slate: "border-slate-200",
    blue: "border-blue-200",
    green: "border-emerald-200",
    amber: "border-amber-200",
    red: "border-rose-200",
  }[tone];

  return (
    <article className={`security-metric-card rounded-xl border ${toneClass} bg-white p-4 shadow-sm`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </article>
  );
}

function useVisitorHub() {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [logs, setLogs] = useState([]);
  const [preapprovals, setPreapprovals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [otpMap, setOtpMap] = useState({});

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    wing: "all",
  });

  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    flatNumber: "",
    wing: "A",
    purpose: "Guest",
    idProof: "",
    photoBase64: "",
    isFaceValid: false,
    faceDetectionConfidence: 0,
  });

  const [showCamera, setShowCamera] = useState(false);

  async function loadLogs() {
    try {
      setLoading(true);
      const response = await fetchVisitorLogs();
      setLogs(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load security logs"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPreapprovals() {
    try {
      const response = await fetchSecurityPreapprovals();
      setPreapprovals(response.data || []);
    } catch (error) {
      setPreapprovals([]);
    }
  }

  async function loadVehicles() {
    try {
      const response = await fetchVisitorVehicles();
      setVehicles(response.data || []);
    } catch (error) {
      setVehicles([]);
    }
  }

  async function loadDeliveries() {
    try {
      const response = await fetchVisitorDeliveries();
      setDeliveries(response.data || []);
    } catch (error) {
      setDeliveries([]);
    }
  }

  async function loadAlerts() {
    try {
      const response = await fetchVisitorEmergencyAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      setAlerts([]);
    }
  }

  useEffect(() => {
    loadLogs();
    loadPreapprovals();
    loadVehicles();
    loadDeliveries();
    loadAlerts();
  }, []);

  async function checkInVisitor(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.visitorName || !form.phone || !form.flatNumber) {
      setAlert({ type: "error", message: "Visitor name, phone and flat are required" });
      return;
    }

    try {
      await createVisitorEntry(form);
      setAlert({ type: "success", message: "Visitor checked in successfully" });
      setForm({
        visitorName: "",
        phone: "",
        flatNumber: "",
        wing: "A",
        purpose: "Guest",
        idProof: "",
        photoBase64: "",
        isFaceValid: false,
        faceDetectionConfidence: 0,
      });
      await loadLogs();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not create visitor entry"),
      });
    }
  }

  async function checkOutVisitor(visitorId) {
    try {
      await markVisitorExit(visitorId);
      setAlert({ type: "success", message: "Visitor checked out" });
      await loadLogs();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not checkout visitor"),
      });
    }
  }

  // Security actions for pre-approvals
  async function handleSendOtp(preapprovalId) {
    try {
      await sendVisitorOtp(preapprovalId);
      setAlert({ type: "success", message: "OTP sent" });
      await loadPreapprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to send OTP") });
    }
  }

  async function handleVerifyOtp(preapprovalId, otpCode) {
    if (!otpCode?.trim()) {
      setAlert({ type: "error", message: "Enter the OTP code before verifying" });
      return;
    }

    try {
      await verifyVisitorOtp(preapprovalId, otpCode.trim());
      setAlert({ type: "success", message: "OTP verified" });
      setOtpMap((prev) => ({ ...prev, [preapprovalId]: "" }));
      await loadPreapprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "OTP verification failed") });
    }
  }

  async function handleVerifyQr(token) {
    if (!token) {
      setAlert({ type: "error", message: "QR token is missing" });
      return;
    }

    try {
      const resp = await verifyPreapprovalQr(token);
      setAlert({ type: "success", message: resp.message || "QR verified" });
      await loadPreapprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "QR verification failed") });
    }
  }

  async function handleApprove(preapprovalId) {
    try {
      await securityUpdatePreapprovalStatus(preapprovalId, "approved");
      setAlert({ type: "success", message: "Pre-approval approved" });
      await loadPreapprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not approve pre-approval") });
    }
  }

  async function handleReject(preapprovalId) {
    try {
      await securityUpdatePreapprovalStatus(preapprovalId, "rejected");
      setAlert({ type: "success", message: "Pre-approval rejected" });
      await loadPreapprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not reject pre-approval") });
    }
  }

  async function handleCheckIn(preapprovalId) {
    try {
      await securityCheckInPreapproval(preapprovalId, { entryMethod: "guard" });
      setAlert({ type: "success", message: "Visitor checked in" });
      await loadPreapprovals();
      await loadLogs();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not check-in visitor") });
    }
  }

  function onCapture(payload) {
    setForm((prev) => ({
      ...prev,
      photoBase64: payload.imageSrc,
      isFaceValid: payload.isFaceValid,
      faceDetectionConfidence: payload.confidence,
    }));
    setShowCamera(false);
    setAlert({ type: "success", message: "Photo captured for visitor" });
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const name = String(item.visitor_name || "").toLowerCase();
      const phone = String(item.phone || "").toLowerCase();
      const wing = String(item.wing || "").toLowerCase();
      const status = item.check_out_time ? "outside" : "inside";

      const searchPass =
        !filters.search ||
        name.includes(filters.search.toLowerCase()) ||
        phone.includes(filters.search.toLowerCase());

      const statusPass = filters.status === "all" || filters.status === status;
      const wingPass = filters.wing === "all" || wing === filters.wing.toLowerCase();

      return searchPass && statusPass && wingPass;
    });
  }, [logs, filters]);

  const liveStats = useMemo(() => {
    const today = new Date().toDateString();

    const todayVisitors = logs.filter((item) => {
      const dt = item.check_in_time ? new Date(item.check_in_time) : null;
      return dt && dt.toDateString() === today;
    }).length;

    const currentlyInside = logs.filter((item) => !item.check_out_time).length;

    const byWing = WING_LABELS.map((wing) => ({
      wing,
      count: logs.filter((item) => String(item.wing || "").toUpperCase() === wing).length,
    }));

    const checkIns = logs.length;
    const checkOuts = logs.filter((item) => item.check_out_time).length;

    return { todayVisitors, currentlyInside, byWing, checkIns, checkOuts };
  }, [logs]);

  return {
    loading,
    alert,
    setAlert,
    logs,
    preapprovals,
    vehicles,
    deliveries,
    alerts,
    otpMap,
    setOtpMap,
    filters,
    setFilters,
    form,
    setForm,
    showCamera,
    setShowCamera,
    filteredLogs,
    liveStats,
    checkInVisitor,
    checkOutVisitor,
    handleSendOtp,
    handleVerifyOtp,
    handleVerifyQr,
    handleApprove,
    handleReject,
    handleCheckIn,
    onCapture,
  };
}

function VisitorEntryForm({ hub }) {
  return (
    <section className="security-operation-panel rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Visitor Entry System</h3>
      <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={hub.checkInVisitor}>
        <input
          type="text"
          placeholder="Visitor Name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.visitorName}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, visitorName: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Phone Number"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.phone}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
        <input
          type="text"
          placeholder="Visiting Flat"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.flatNumber}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, flatNumber: event.target.value }))}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.wing}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, wing: event.target.value }))}
        >
          {WING_LABELS.map((wing) => (
            <option key={wing} value={wing}>
              Wing {wing}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.purpose}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, purpose: event.target.value }))}
        >
          <option value="Guest">Guest</option>
          <option value="Delivery">Delivery</option>
          <option value="Service">Service</option>
        </select>
        <input
          type="text"
          placeholder="ID Proof (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.form.idProof}
          onChange={(event) => hub.setForm((prev) => ({ ...prev, idProof: event.target.value }))}
        />

        <button
          type="button"
          className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          onClick={() => hub.setShowCamera(true)}
        >
          Capture Photo
        </button>
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 md:col-span-2">
          {hub.form.photoBase64
            ? `Photo ready. Face confidence: ${Number(hub.form.faceDetectionConfidence || 0).toFixed(2)}`
            : "No photo captured yet"}
        </div>

        <button
          type="submit"
          className="rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:theme-surface md:col-span-2"
        >
          Check-in
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          onClick={() => hub.setForm((prev) => ({ ...prev, visitorName: "", phone: "", flatNumber: "" }))}
        >
          Clear
        </button>
      </form>
    </section>
  );
}

function VisitorLogTable({ hub }) {
  return (
    <section className="security-operation-panel rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 grid gap-3 md:grid-cols-[1fr_160px_140px]">
        <input
          type="text"
          placeholder="Search name or phone"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.filters.search}
          onChange={(event) => hub.setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.filters.status}
          onChange={(event) => hub.setFilters((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="inside">Inside</option>
          <option value="outside">Outside</option>
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={hub.filters.wing}
          onChange={(event) => hub.setFilters((prev) => ({ ...prev, wing: event.target.value }))}
        >
          <option value="all">All Wings</option>
          {WING_LABELS.map((wing) => (
            <option key={wing} value={wing}>
              Wing {wing}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th className="px-3 py-2">Visitor</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Flat</th>
              <th className="px-3 py-2">Purpose</th>
              <th className="px-3 py-2">Check-in</th>
              <th className="px-3 py-2">Check-out</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {hub.loading ? (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={8}>
                  Loading visitor logs...
                </td>
              </tr>
            ) : hub.filteredLogs.length ? (
              hub.filteredLogs.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{item.visitor_name}</td>
                  <td className="px-3 py-2 text-slate-700">{item.phone}</td>
                  <td className="px-3 py-2 text-slate-700">{item.wing}-{item.flat_number}</td>
                  <td className="px-3 py-2 text-slate-700">{item.purpose || "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.check_in_time ? new Date(item.check_in_time).toLocaleTimeString() : "-"}</td>
                  <td className="px-3 py-2 text-slate-700">{item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString() : "-"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.check_out_time ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {item.check_out_time ? "Outside" : "Inside"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {!item.check_out_time ? (
                      <button
                        type="button"
                        className="rounded-md theme-surface px-2 py-1 text-xs font-semibold text-[var(--text-main)]"
                        onClick={() => hub.checkOutVisitor(item.id)}
                      >
                        Check-out
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Closed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={8}>
                  No visitor records found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SecurityDashboard() {
  const hub = useVisitorHub();

  const insideByWing = hub.liveStats.byWing;

  const suspiciousSignals = [
    "Repeated unknown visitors detected for Wing C",
    "One person has requested access to 3 flats in 2 days",
    "Unusual late-night entries observed after 11:30 PM",
  ];

  return (
    <div className="security-page security-hub-page space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-red-700 p-6 text-[var(--text-main)] shadow-lg">
        <SectionHeader
          title="Security Dashboard"
          subtitle="Live view for visitor movement, deliveries, alerts, and emergency controls"
          action={
            <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-red-400">
              Emergency Button
            </button>
          }
        />
      </section>

      <AlertMessage type={hub.alert.type} message={hub.alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total visitors today" value={hub.liveStats.todayVisitors} helper="Auto-updated" tone="blue" />
        <StatCard label="Currently inside" value={hub.liveStats.currentlyInside} helper="Real-time inside count" tone="green" />
        <StatCard label="Deliveries pending" value={hub.deliveries.filter((item) => item.status === "pending").length} helper="Courier and food" tone="amber" />
        <StatCard label="Active alerts" value={hub.alerts.length} helper="AI and emergency flags" tone="red" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Live Widget: Check-ins / Check-outs</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Check-ins</p>
              <p className="text-2xl font-bold text-slate-900">{hub.liveStats.checkIns}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Check-outs</p>
              <p className="text-2xl font-bold text-slate-900">{hub.liveStats.checkOuts}</p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Live Widget: Visitor count by wing</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {insideByWing.map((item) => (
              <div key={item.wing} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Wing {item.wing}</p>
                <p className="text-2xl font-bold text-slate-900">{item.count}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">AI Suspicious Activity Detection</h3>
        <div className="mt-3 space-y-2">
          {suspiciousSignals.map((signal) => (
            <p key={signal} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {signal}
            </p>
          ))}
        </div>
      </section>

      <VisitorEntryForm hub={hub} />
      <VisitorLogTable hub={hub} />

      {hub.showCamera ? <CameraCapture onCapture={hub.onCapture} onClose={() => hub.setShowCamera(false)} /> : null}
    </div>
  );
}

function VisitorsPage() {
  const hub = useVisitorHub();

  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Visitor Management"
        subtitle="Check-in, check-out, photo capture, ID details, and status filtering"
      />
      <AlertMessage type={hub.alert.type} message={hub.alert.message} />
      <VisitorEntryForm hub={hub} />
      <VisitorLogTable hub={hub} />
      {hub.showCamera ? <CameraCapture onCapture={hub.onCapture} onClose={() => hub.setShowCamera(false)} /> : null}
    </div>
  );
}

function PreApprovedPage() {
  const hub = useVisitorHub();

  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Pre-Approved Visitors"
        subtitle="Resident-created pre-approvals — verify via OTP/QR, then check-in at the gate"
      />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-3 py-2">Visitor</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Visit Date</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hub.loading ? (
                <tr>
                  <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={6}>
                    Loading pre-approvals...
                  </td>
                </tr>
              ) : hub.preapprovals.length ? (
                hub.preapprovals.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{item.visitor_name}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{item.phone}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{item.wing}-{item.flat_number}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{item.visit_date}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "approved" ? "bg-emerald-100 text-emerald-700" : item.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 space-x-2">
                      <button onClick={() => hub.handleSendOtp(item.id)} className="rounded-md border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)]">Send OTP</button>
                      <input
                        placeholder="OTP"
                        className="rounded-md border border-[var(--border)] bg-[var(--input-bg)] px-2 py-1 text-xs text-[var(--text-primary)]"
                        value={hub.otpMap[item.id] || ""}
                        onChange={(e) => hub.setOtpMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      />
                      <button onClick={() => hub.handleVerifyOtp(item.id, hub.otpMap[item.id] || "")} className="rounded-md bg-[rgb(var(--app-primary-rgb))] px-2 py-1 text-xs font-semibold text-[var(--text-main)]">Verify OTP</button>
                      <button onClick={() => hub.handleVerifyQr(item.qr_pass_token || "")} className="rounded-md bg-[rgb(var(--app-secondary-rgb))] px-2 py-1 text-xs font-semibold text-[var(--text-main)]">Verify QR</button>
                      <button onClick={() => hub.handleApprove(item.id)} className="rounded-md bg-[rgb(var(--app-accent-rgb))] px-2 py-1 text-xs font-semibold text-[var(--text-main)]">Approve</button>
                      <button onClick={() => hub.handleReject(item.id)} className="rounded-md bg-rose-600 px-2 py-1 text-xs font-semibold text-[var(--text-main)]">Reject</button>
                      <button onClick={() => hub.handleCheckIn(item.id)} className="rounded-md bg-[rgb(var(--app-primary-rgb))] px-2 py-1 text-xs font-semibold text-[var(--text-main)]">Check-In</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={6}>
                    No pre-approved visitors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DeliveriesPage() {
  const hub = useVisitorHub();

  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Delivery Management"
        subtitle="Courier and food delivery entries, pending tracking, and resident contact actions"
      />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {hub.deliveries.length ? (
                hub.deliveries.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{row.delivery_partner || row.recipient_name || "Delivery"}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.flatId || row.flat_id || "-"}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.deliveryType || row.delivery_type || "N/A"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {row.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={4}>
                    No delivery records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function VehiclesPage() {
  const hub = useVisitorHub();

  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Vehicle Tracking"
        subtitle="Visitor vehicle numbers, resident vehicles database, and parking logs"
      />
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <th className="px-3 py-2">Vehicle No.</th>
                <th className="px-3 py-2">Owner Type</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {hub.vehicles.length ? (
                hub.vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{vehicle.vehicleNumber || vehicle.vehicle_number}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{vehicle.ownerName || vehicle.owner_name || "Unknown"}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{vehicle.flatId || vehicle.flat_id || "-"}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${vehicle.status === "inside" ? "bg-emerald-100 text-emerald-700" : "bg-[rgb(var(--app-surface-muted-rgb))] text-[var(--text-primary)]"}`}>
                        {vehicle.status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-4 text-[var(--text-secondary)]" colSpan={4}>
                    No vehicle records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function GatePassPage() {
  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Gate Pass System"
        subtitle="Temporary, worker, daily, and weekly pass issuance with validation"
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Create New Pass</h3>
          <div className="mt-3 grid gap-3">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option>Temporary</option>
              <option>Worker</option>
            </select>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option>Daily</option>
              <option>Weekly</option>
            </select>
            <button className="rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)]">Generate Pass</button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Active Passes</h3>
          <div className="mt-3 space-y-2">
            {gatePassSeed.map((pass) => (
              <div key={pass.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{pass.name}</p>
                <p className="text-xs text-slate-600">{pass.type} | {pass.validity} | {pass.passCode}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function StaffEntryPage() {
  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Staff & Worker Entry"
        subtitle="Maid, driver, electrician and other worker attendance tracking"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Check-in</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {staffSeed.map((staff) => (
                <tr key={staff.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{staff.name}</td>
                  <td className="px-3 py-2 text-slate-700">{staff.role}</td>
                  <td className="px-3 py-2 text-slate-700">{staff.flat}</td>
                  <td className="px-3 py-2 text-slate-700">{staff.checkIn}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${staff.status === "inside" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                      {staff.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AlertsPage() {
  const hub = useVisitorHub();

  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Alert & Emergency System"
        subtitle="Panic button, fire alerts, unauthorized entry alerts, and AI suspicious monitoring"
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <button className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-[var(--text-main)] hover:bg-red-500">Panic Button</button>
        <button className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-[var(--text-main)] hover:bg-amber-400">Fire Alert</button>
        <button className="rounded-xl theme-surface px-4 py-3 text-sm font-semibold text-[var(--text-main)] hover:theme-surface">Unauthorized Entry Alert</button>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Active Alerts</h3>
        <div className="mt-3 space-y-2">
          {(hub.alerts.length ? hub.alerts : []).map((alertItem) => (
            <div key={alertItem.id} className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--input-bg)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{alertItem.title || alertItem.message || "Security alert"}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${alertItem.level === "critical" ? "bg-rose-100 text-rose-700" : alertItem.level === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {alertItem.level || "info"}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{alertItem.detail || alertItem.message || "No additional details"}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{alertItem.created_at || alertItem.createdAt || alertItem.time || "Unknown time"}</p>
            </div>
          ))}
          {!hub.alerts.length ? (
            <p className="text-sm text-[var(--text-secondary)]">No active alerts found.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ReportsPage() {
  return (
    <div className="security-page security-hub-page space-y-6">
      <SectionHeader
        title="Logs & History Reports"
        subtitle="Visitor logs, entry and exit history, with date and flat filters"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input type="text" placeholder="Flat" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option>Visitor Type: All</option>
            <option>Guest</option>
            <option>Delivery</option>
            <option>Service</option>
          </select>
          <button className="rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)]">Apply Filters</button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Auto Report Generator</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Daily Visitor Report</button>
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Security Activity Report</button>
            <button className="rounded-lg theme-surface px-3 py-2 text-sm font-semibold text-[var(--text-main)]">Generate AI Report</button>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Smart Insights</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Peak visitor time: 6:00 PM to 8:00 PM</li>
            <li>Most visited flats: A-302, B-108, C-502</li>
            <li>Frequent visitors: 7 recurring profiles this week</li>
            <li>Delivery prediction: High volume expected at 1:00 PM</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Security Settings"
        subtitle="Configure real-time alerts, AI modules, and communication channels"
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" defaultChecked /> Enable real-time visitor notifications
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" defaultChecked /> Enable suspicious activity detection
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" defaultChecked /> Enable blacklist detection
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" /> Enable SMS alerts
          </label>
        </div>
      </section>
    </div>
  );
}

export {
  AlertsPage,
  DeliveriesPage,
  GatePassPage,
  PreApprovedPage,
  ReportsPage,
  SecurityDashboard,
  SecuritySettingsPage,
  StaffEntryPage,
  VehiclesPage,
  VisitorsPage,
};
