import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import CameraCapture from "../components/CameraCapture";
import ModulePageHeader from "../components/ModulePageHeader";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  createVisitorEntry,
  fetchVisitorLogs,
  markVisitorExit,
} from "../services/visitorApi";

function VisitorsPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const role = currentUser?.role || "resident";
  const canCreateVisitorEntries = role === "security";
  const canViewVisitorLogs = role === "admin" || role === "secretary" || role === "security";

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedWingFilter, setSelectedWingFilter] = useState("ALL");

  const [form, setForm] = useState({
    visitorName: "",
    visitorEmail: "",
    phone: "",
    flatNumber: "",
    wing: "A",
    photoBase64: "",
    faceDetectionConfidence: 0,
    isFaceValid: false,
  });

  async function loadLogs(wingValue = selectedWingFilter) {
    try {
      setLoading(true);
      const response = await fetchVisitorLogs({
        wing: wingValue === "ALL" ? undefined : wingValue,
      });
      setLogs(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load visitor logs"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function handleCameraCapture(capturePayload) {
    setForm((prev) => ({
      ...prev,
      photoBase64: capturePayload.imageSrc,
      faceDetectionConfidence: capturePayload.confidence,
      isFaceValid: capturePayload.isFaceValid,
    }));
    setPhotoPreview(capturePayload.imageSrc);
    setShowCamera(false);
    setAlert({ type: "success", message: "Face captured successfully" });
  }

  function handleRemovePhoto() {
    setForm((prev) => ({
      ...prev,
      photoBase64: "",
      faceDetectionConfidence: 0,
      isFaceValid: false,
    }));
    setPhotoPreview(null);
  }

  async function handleCreateEntry(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.visitorName || !form.phone || !form.flatNumber || !form.wing) {
      setAlert({
        type: "error",
        message: "Name, mobile, wing, and flat number are required",
      });
      return;
    }

    if (!form.photoBase64 || !form.isFaceValid || Number(form.faceDetectionConfidence) < 0.8) {
      setAlert({
        type: "error",
        message: "Capture a clear centered face before saving",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createVisitorEntry(form);
      setForm({
        visitorName: "",
        visitorEmail: "",
        phone: "",
        flatNumber: "",
        wing: "A",
        photoBase64: "",
        faceDetectionConfidence: 0,
        isFaceValid: false,
      });
      setPhotoPreview(null);
      setAlert({ type: "success", message: "Visitor entry added successfully" });
      await loadLogs();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not add visitor entry"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkExit(visitorId) {
    setAlert({ type: "", message: "" });

    try {
      await markVisitorExit(visitorId);
      setAlert({ type: "success", message: "Visitor exit updated" });
      await loadLogs();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not update visitor exit"),
      });
    }
  }

  return (
    <div className="chairman-page space-y-6">
      <ModulePageHeader
        title="Visitors"
        subtitle="Track visitor movement and approvals."
        actions={(
          <>
            <select
              value={selectedWingFilter}
              onChange={(event) => {
                setSelectedWingFilter(event.target.value);
                loadLogs(event.target.value);
              }}
            >
              <option value="ALL">All Wings</option>
              <option value="A">Wing A</option>
              <option value="B">Wing B</option>
              <option value="C">Wing C</option>
            </select>
            <button
              type="button"
              onClick={() => loadLogs()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Refresh Logs
            </button>
          </>
        )}
      />

      <AlertMessage type={alert.type} message={alert.message} />

      {canCreateVisitorEntries ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Add Visitor Entry</h3>
          <form className="mt-4 space-y-4" onSubmit={handleCreateEntry}>
            <div className="chairman-page grid gap-3 md:grid-cols-2">
              <input
                type="text"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                placeholder="Visitor name"
                value={form.visitorName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visitorName: event.target.value }))
                }
              />
              <input
                type="email"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                placeholder="Email"
                value={form.visitorEmail}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, visitorEmail: event.target.value }))
                }
              />
              <input
                type="text"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                placeholder="Mobile"
                value={form.phone}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
              <input
                type="text"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                placeholder="Flat number"
                value={form.flatNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, flatNumber: event.target.value }))
                }
              />
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                value={form.wing}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, wing: event.target.value }))
                }
              >
                <option value="A">Wing A</option>
                <option value="B">Wing B</option>
                <option value="C">Wing C</option>
              </select>
            </div>

            {/* Photo Preview Section */}
            {photoPreview ? (
              <div className="chairman-page space-y-2">
                <div className="chairman-page relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Visitor preview"
                    className="h-32 w-32 rounded-lg border-2 border-blue-500 object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-[var(--text-main)] hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-600">Photo captured ✓</p>
                <p className="text-xs text-emerald-700">
                  Face confidence: {Number(form.faceDetectionConfidence || 0).toFixed(2)}
                </p>
              </div>
            ) : null}

            {/* Buttons */}
            <div className="chairman-page flex gap-2">
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="flex-1 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Capture Photo
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg theme-surface px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:theme-surface disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Camera Capture Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {canViewVisitorLogs ? (
      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Visitor Logs</h3>

        {loading ? (
          <div className="chairman-page rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading visitor logs...
          </div>
        ) : logs.length ? (
          <div className="chairman-page space-y-3">
            {logs.map((log) => (
              <article
                key={log.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="chairman-page flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Photo Column */}
                  {log.photo_url ? (
                    <div className="chairman-page flex-shrink-0">
                      <img
                        src={log.photo_url}
                        alt={log.visitor_name}
                        className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Info Column */}
                  <div className="chairman-page flex-1">
                    <h4 className="text-base font-semibold text-slate-900">
                      {log.visitor_name}
                    </h4>
                    <p className="text-sm text-slate-600">
                      Wing: {log.wing || "-"} | Flat: {log.flat_number || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Phone: {log.phone || "-"}
                      {log.visitor_email ? ` | Email: ${log.visitor_email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Entry: {log.entry_time ? new Date(log.entry_time).toLocaleString() : "-"}
                      {log.exit_time
                        ? ` | Exit: ${new Date(log.exit_time).toLocaleString()}`
                        : " | Exit: -"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Added by: {log.security_name}
                    </p>
                  </div>

                  {/* Action Column */}
                  <div className="chairman-page flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        log.status === "exited"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {log.status === "exited" ? "Exited" : "In Premises"}
                    </span>

                    {canCreateVisitorEntries && log.status === "in_premises" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkExit(log.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-[var(--text-main)] hover:bg-emerald-500"
                      >
                        Mark Exit
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="chairman-page rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No visitor entries found.
          </div>
        )}
      </section>
      ) : null}
    </div>
  );
}

export default VisitorsPage;
