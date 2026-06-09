import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../../components/AlertMessage";
import { getApiMessage } from "../../services/authApi";
import {
  createVisitorDeliveryEntry,
  createVisitorEntry,
  createVisitorEmergencyAlert,
  createVisitorVehicleEntry,
  fetchSecurityPreapprovals,
  fetchVisitorHistory,
  issueVisitorQrPass,
  recognizeVisitorFace,
  sendVisitorOtp,
  verifyPreapprovalQr,
  verifyVisitorOtp,
} from "../../services/visitorApi";
import { connectVisitorSocket, disconnectVisitorSocket, onVisitorBlacklist, onVisitorEmergencyAlert, onVisitorNewEntry } from "../../services/visitorSocket";
import VisitorCameraModal from "../components/VisitorCameraModal";

const initialForm = {
  visitorName: "",
  visitorEmail: "",
  phone: "",
  purpose: "Visitor Entry",
  personToMeet: "",
  vehicleNumber: "",
  flatNumber: "",
  wing: "A",
  photoBase64: "",
  faceDetectionConfidence: 0,
  isFaceValid: false,
  qrPassToken: "",
  otpCode: "",
  flatId: "",
  preapprovalId: "",
};

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pill({ children, tone = "slate" }) {
  const toneClass = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    blue: "bg-blue-100 text-blue-700",
  }[tone];

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function VisitorEntryPage() {
  const [form, setForm] = useState(initialForm);
  const [preapprovals, setPreapprovals] = useState([]);
  const [history, setHistory] = useState([]);
  const [realtimeFeed, setRealtimeFeed] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
  const [otpResult, setOtpResult] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [scanToken, setScanToken] = useState("");
  const [deliveryForm, setDeliveryForm] = useState({ deliveryType: "Courier", packageId: "", recipientName: "", deliveryPartner: "" });
  const [vehicleForm, setVehicleForm] = useState({ vehicleNumber: "", vehicleType: "Car", ownerName: "", flatId: "" });

  async function loadData() {
    try {
      setLoading(true);
      const [approvalResponse, historyResponse] = await Promise.all([
        fetchSecurityPreapprovals(),
        fetchVisitorHistory({ fromDate: new Date().toISOString().slice(0, 10) }),
      ]);

      setPreapprovals(approvalResponse?.data || []);
      setHistory(historyResponse?.data || []);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load visitor data") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    connectVisitorSocket();

    const offEntry = onVisitorNewEntry((payload) => {
      setRealtimeFeed((prev) => [{ type: "entry", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      loadData();
    });
    const offBlacklist = onVisitorBlacklist((payload) => {
      setRealtimeFeed((prev) => [{ type: "blacklist", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      loadData();
    });
    const offAlert = onVisitorEmergencyAlert((payload) => {
      setRealtimeFeed((prev) => [{ type: "alert", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
    });

    return () => {
      offEntry();
      offBlacklist();
      offAlert();
      disconnectVisitorSocket();
    };
  }, []);

  const selectedApproval = useMemo(
    () => preapprovals.find((item) => String(item.id) === String(form.preapprovalId)) || null,
    [preapprovals, form.preapprovalId]
  );

  useEffect(() => {
    if (!selectedApproval) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      visitorName: prev.visitorName || selectedApproval.visitor_name || "",
      phone: prev.phone || selectedApproval.phone || "",
      purpose: prev.purpose === "Visitor Entry" ? selectedApproval.purpose || "Visitor Entry" : prev.purpose,
      flatNumber: prev.flatNumber || selectedApproval.flat_number || "",
      wing: prev.wing || selectedApproval.wing || "A",
      flatId: prev.flatId || selectedApproval.flat_id || "",
    }));
  }, [selectedApproval]);

  async function handleCapture(payload) {
    if (!payload?.imageSrc) {
      setForm((prev) => ({
        ...prev,
        photoBase64: "",
        faceDetectionConfidence: 0,
        isFaceValid: false,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      photoBase64: payload.imageSrc,
      faceDetectionConfidence: payload.confidence,
      isFaceValid: payload.isFaceValid,
    }));
    setAlert({ type: "success", message: "Visitor face captured. Save the photo or retake if needed." });
  }

  async function handleCreatePass() {
    if (!form.preapprovalId) {
      setAlert({ type: "error", message: "Select a pre-approved visitor first" });
      return;
    }

    try {
      const response = await issueVisitorQrPass(form.preapprovalId, { deviceLabel: "Mobile guard app" });
      setQrResult(response.data || response);
      setAlert({ type: "success", message: response.message || "QR pass issued" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not issue QR pass") });
    }
  }

  async function handleSendOtp() {
    if (!form.preapprovalId) {
      setAlert({ type: "error", message: "Select a pre-approved visitor first" });
      return;
    }

    try {
      const response = await sendVisitorOtp(form.preapprovalId);
      setOtpResult(response.data || response);
      setAlert({ type: "success", message: response.message || "OTP sent" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not send OTP") });
    }
  }

  async function handleVerifyOtp() {
    if (!form.preapprovalId || !form.otpCode.trim()) {
      setAlert({ type: "error", message: "Select a pre-approved visitor and enter the OTP" });
      return;
    }

    try {
      const response = await verifyVisitorOtp(form.preapprovalId, form.otpCode.trim());
      setAlert({ type: "success", message: response.message || "OTP verified" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not verify OTP") });
    }
  }

  async function handleRecognizeFace() {
    if (!form.photoBase64) {
      setAlert({ type: "error", message: "Capture a face photo first" });
      return;
    }

    try {
      const response = await recognizeVisitorFace({
        photoBase64: form.photoBase64,
        visitorName: form.visitorName,
        phone: form.phone,
        flatId: form.flatId ? Number(form.flatId) : undefined,
      });
      setAlert({
        type: response.data?.matchFound ? "success" : "warning",
        message: response.data?.matchFound ? "Face matched with prior visitor profile" : "Face profile captured for review",
      });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not recognize face") });
    }
  }

  async function handleCheckIn(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.photoBase64) {
      setAlert({ type: "error", message: "Please capture visitor face before check-in." });
      return;
    }

    if (!form.visitorName || !form.phone || (!form.flatNumber && !form.flatId)) {
      setAlert({ type: "error", message: "Visitor name, phone, and flat are required" });
      return;
    }

    try {
      setSubmittingCheckIn(true);
      const response = await createVisitorEntry({
        ...form,
        flatId: form.flatId ? Number(form.flatId) : undefined,
        preapprovalId: form.preapprovalId ? Number(form.preapprovalId) : undefined,
        faceDetectionConfidence: Number(form.faceDetectionConfidence || 0),
      });
      setAlert({ type: "success", message: response.message || "Visitor checked in" });
      setForm(initialForm);
      setQrResult(null);
      setOtpResult(null);
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create visitor entry") });
    } finally {
      setSubmittingCheckIn(false);
    }
  }

  async function handleVehicleSubmit(event) {
    event.preventDefault();
    try {
      await createVisitorVehicleEntry({
        ...vehicleForm,
        flatId: vehicleForm.flatId ? Number(vehicleForm.flatId) : undefined,
        visitorId: selectedApproval?.visitor_id,
      });
      setAlert({ type: "success", message: "Vehicle entry logged" });
      setVehicleForm({ vehicleNumber: "", vehicleType: "Car", ownerName: "", flatId: "" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not log vehicle entry") });
    }
  }

  async function handleDeliverySubmit(event) {
    event.preventDefault();
    try {
      await createVisitorDeliveryEntry({
        ...deliveryForm,
        flatId: form.flatId ? Number(form.flatId) : undefined,
        visitorId: selectedApproval?.visitor_id,
      });
      setAlert({ type: "success", message: "Delivery entry logged" });
      setDeliveryForm({ deliveryType: "Courier", packageId: "", recipientName: "", deliveryPartner: "" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not log delivery") });
    }
  }

  async function handleEmergency() {
    try {
      const response = await createVisitorEmergencyAlert({
        alertType: "security",
        severity: "critical",
        message: `Emergency raised for ${form.visitorName || "visitor"}`,
        location: form.flatNumber ? `Wing ${form.wing} Flat ${form.flatNumber}` : "Gate",
      });
      setAlert({ type: "success", message: response.message || "Emergency alert sent" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not raise emergency alert") });
    }
  }

  async function handleManualQrScan() {
    if (!scanToken.trim()) {
      setAlert({ type: "error", message: "Enter a QR token to scan" });
      return;
    }

    try {
      const response = await verifyPreapprovalQr(scanToken.trim());
      const matched = response?.data?.preapproval || response?.data || null;
      setAlert({ type: "success", message: `QR token verified for ${matched?.visitor_name || "pre-approved visitor"}` });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "QR verification failed") });
    }
  }

  if (loading) {
    return <div className="text-sm text-[var(--text-secondary)]">Loading visitor guard flow...</div>;
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <section className="rounded-3xl bg-[var(--hero-bg)] p-6 text-[var(--text-main)] shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Mobile Guard App Flow</p>
        <h1 className="mt-2 text-3xl font-bold">Visitor Operations</h1>
        <p className="mt-2 max-w-3xl text-sm text-emerald-100">
          Quick check-in, QR scan, OTP verify, face capture, vehicle logging, delivery logging, and emergency escalation from one compact screen.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm">
          <p className="text-xs text-[var(--text-secondary)]">Pending approvals</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{preapprovals.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm">
          <p className="text-xs text-[var(--text-secondary)]">History records</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{history.length}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm">
          <p className="text-xs text-[var(--text-secondary)]">QR status</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{qrResult?.passToken ? "Ready" : "None"}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm">
          <p className="text-xs text-[var(--text-secondary)]">OTP status</p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{otpResult?.otpCode ? "Issued" : "None"}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Section title="1. Pre-approval and Gate Access" subtitle="Select a pre-approved visitor, issue QR, send OTP, verify identity, then capture the face.">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none"
              value={form.preapprovalId}
              onChange={(event) => setForm((prev) => ({ ...prev, preapprovalId: event.target.value }))}
            >
              <option value="">Select pre-approved visitor</option>
              {preapprovals.map((item) => (
                <option key={item.id} value={item.id}>{item.visitor_name} • {item.wing || "-"}-{item.flat_number || item.flat_id}</option>
              ))}
            </select>
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="QR token" value={scanToken} onChange={(event) => setScanToken(event.target.value)} />
            <button className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]" onClick={handleManualQrScan} type="button">Scan QR</button>
            <button className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-sm font-semibold text-[var(--text-main)]" onClick={handleCreatePass} type="button">Issue QR Pass</button>
            <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-[var(--text-main)]" onClick={handleSendOtp} type="button">Send OTP</button>
            <button className="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700" onClick={handleVerifyOtp} type="button">Verify OTP</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Enter OTP" value={form.otpCode} onChange={(event) => setForm((prev) => ({ ...prev, otpCode: event.target.value }))} />
            <button className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)]" onClick={() => setShowCamera(true)} type="button">Capture Face</button>
          </div>
          {form.photoBase64 ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <img src={form.photoBase64} alt="Captured visitor face" className="h-24 w-24 rounded-xl border border-emerald-200 object-cover" />
                <div className="space-y-1 text-sm text-emerald-950">
                  <p className="font-semibold">Captured visitor face</p>
                  <p>Ready for check-in.</p>
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill tone={selectedApproval ? "green" : "slate"}>{selectedApproval ? "Approval selected" : "No approval selected"}</Pill>
            <Pill tone={qrResult?.qrCodeUrl ? "blue" : "slate"}>{qrResult?.qrCodeUrl ? "QR generated" : "QR pending"}</Pill>
            <Pill tone={otpResult?.otpCode ? "amber" : "slate"}>{otpResult?.otpCode ? "OTP issued" : "OTP pending"}</Pill>
          </div>
          {qrResult?.qrCodeUrl ? <img className="mt-4 max-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2" src={qrResult.qrCodeUrl} alt="Visitor QR" /> : null}
          {otpResult?.otpCode ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Dev OTP: {otpResult.otpCode}</p> : null}
        </Section>

        <Section title="2. Visitor Check-in" subtitle="Manual entry for residents, workers, guests, deliveries, or emergency workflows.">
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCheckIn}>
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Visitor Name *" value={form.visitorName} onChange={(event) => setForm((prev) => ({ ...prev, visitorName: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Email" value={form.visitorEmail} onChange={(event) => setForm((prev) => ({ ...prev, visitorEmail: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Phone *" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Purpose" value={form.purpose} onChange={(event) => setForm((prev) => ({ ...prev, purpose: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Wing" value={form.wing} onChange={(event) => setForm((prev) => ({ ...prev, wing: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Flat Number" value={form.flatNumber} onChange={(event) => setForm((prev) => ({ ...prev, flatNumber: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Person to meet" value={form.personToMeet} onChange={(event) => setForm((prev) => ({ ...prev, personToMeet: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Vehicle number" value={form.vehicleNumber} onChange={(event) => setForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
            <input className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none md:col-span-2" placeholder="Face confidence (optional)" value={form.faceDetectionConfidence} onChange={(event) => setForm((prev) => ({ ...prev, faceDetectionConfidence: event.target.value }))} />
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <button type="submit" disabled={submittingCheckIn} className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:cursor-not-allowed disabled:bg-[rgb(var(--app-border-rgb))]">{submittingCheckIn ? "Checking In..." : "Check In Visitor"}</button>
              <button type="button" onClick={handleRecognizeFace} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">AI Face Check</button>
              <button type="button" onClick={handleEmergency} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">Raise Emergency</button>
            </div>
          </form>
        </Section>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Section title="3. Vehicles and Deliveries" subtitle="Log vehicle and delivery movements from the same guard device.">
          <div className="grid gap-4 md:grid-cols-2">
            <form className="space-y-3 rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-4" onSubmit={handleVehicleSubmit}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Vehicle Entry</h3>
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Vehicle number" value={vehicleForm.vehicleNumber} onChange={(event) => setVehicleForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Owner name" value={vehicleForm.ownerName} onChange={(event) => setVehicleForm((prev) => ({ ...prev, ownerName: event.target.value }))} />
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Flat ID" value={vehicleForm.flatId} onChange={(event) => setVehicleForm((prev) => ({ ...prev, flatId: event.target.value }))} />
              <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" value={vehicleForm.vehicleType} onChange={(event) => setVehicleForm((prev) => ({ ...prev, vehicleType: event.target.value }))}>
                <option>Car</option>
                <option>Bike</option>
                <option>Truck</option>
              </select>
              <button className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-4 py-2 text-sm font-semibold text-[var(--text-main)]">Log Vehicle</button>
            </form>

            <form className="space-y-3 rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-4" onSubmit={handleDeliverySubmit}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Delivery Entry</h3>
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Package ID" value={deliveryForm.packageId} onChange={(event) => setDeliveryForm((prev) => ({ ...prev, packageId: event.target.value }))} />
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Recipient name" value={deliveryForm.recipientName} onChange={(event) => setDeliveryForm((prev) => ({ ...prev, recipientName: event.target.value }))} />
              <input className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" placeholder="Delivery partner" value={deliveryForm.deliveryPartner} onChange={(event) => setDeliveryForm((prev) => ({ ...prev, deliveryPartner: event.target.value }))} />
              <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[rgb(var(--app-primary-rgb))] focus:outline-none" value={deliveryForm.deliveryType} onChange={(event) => setDeliveryForm((prev) => ({ ...prev, deliveryType: event.target.value }))}>
                <option>Courier</option>
                <option>Food</option>
                <option>Grocery</option>
                <option>Maintenance</option>
              </select>
              <button className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-4 py-2 text-sm font-semibold text-[var(--text-main)]">Log Delivery</button>
            </form>
          </div>
        </Section>

        <Section title="4. Live Visitor History" subtitle="Today’s entries and realtime incidents from the gate.">
          <div className="space-y-3">
            {realtimeFeed.length ? realtimeFeed.map((item, index) => (
              <div key={`${item.type}-${index}`} className="rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{item.type.toUpperCase()}</p>
                <p className="text-[var(--text-secondary)]">{item.at}</p>
              </div>
            )) : null}
            {history.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-sm shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{item.visitor_name}</p>
                    <p className="text-[var(--text-secondary)]">{item.purpose} • {item.wing || "-"}-{item.flat_number || item.flat_id || "-"}</p>
                  </div>
                  <Pill tone={item.status === "in_premises" ? "green" : "slate"}>{item.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {showCamera ? <VisitorCameraModal onCapture={handleCapture} onClose={() => setShowCamera(false)} /> : null}
    </div>
  );
}

export default VisitorEntryPage;
