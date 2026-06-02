import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import {
  addComplaintComment,
  fetchAllComplaints,
  updateComplaintStatus,
} from "../services/complaintApi";

function StaffComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});

  async function loadComplaints() {
    try {
      setLoading(true);
      const response = await fetchAllComplaints({ status: "pending" });
      setComplaints(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load assigned complaints"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleStatus(complaintId, status) {
    try {
      await updateComplaintStatus(complaintId, status);
      setAlert({ type: "success", message: "Complaint status updated" });
      await loadComplaints();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update complaint") });
    }
  }

  async function handleAddNote(complaintId) {
    const noteText = (notes[complaintId] || "").trim();
    if (!noteText) {
      setAlert({ type: "error", message: "Note cannot be empty" });
      return;
    }

    try {
      await addComplaintComment(complaintId, noteText);
      setNotes((prev) => ({ ...prev, [complaintId]: "" }));
      setAlert({ type: "success", message: "Note added" });
      await loadComplaints();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not add note") });
    }
  }

  function handlePhotoPreview(complaintId, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotos((prev) => ({ ...prev, [complaintId]: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Complaint Handling</h2>
        <p className="mt-1 text-sm text-slate-200">
          View assigned complaints, update status, and attach work notes/photos.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Loading complaints...
        </div>
      ) : complaints.length ? (
        <section className="space-y-4">
          {complaints.map((complaint) => (
            <article key={complaint.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{complaint.title}</p>
                  <p className="text-sm text-slate-600">{complaint.description}</p>
                  <p className="text-xs text-slate-500">
                    Resident: {complaint.resident_name || "-"} | Flat: {complaint.flat_number || "-"}
                  </p>
                </div>
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  value={complaint.status}
                  onChange={(event) => handleStatus(complaint.id, event.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Completed</option>
                </select>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_200px]">
                <div className="space-y-2">
                  <textarea
                    className="h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Add service note"
                    value={notes[complaint.id] || ""}
                    onChange={(event) =>
                      setNotes((prev) => ({ ...prev, [complaint.id]: event.target.value }))
                    }
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                    onClick={() => handleAddNote(complaint.id)}
                  >
                    Save Note
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs"
                    onChange={(event) => handlePhotoPreview(complaint.id, event.target.files?.[0])}
                  />
                  {photos[complaint.id] ? (
                    <img
                      src={photos[complaint.id]}
                      alt="Issue preview"
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <p className="text-xs text-slate-500">No photo attached</p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          No pending complaints found.
        </div>
      )}
    </div>
  );
}

export default StaffComplaintsPage;
