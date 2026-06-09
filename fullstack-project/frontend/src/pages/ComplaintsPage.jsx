import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  addComplaintComment,
  fetchAllComplaints,
  fetchMyComplaints,
  raiseComplaint,
  updateComplaintStatus,
} from "../services/complaintApi";

function ComplaintsPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const role = currentUser?.role || "resident";
  const canViewAll = role === "admin" || role === "secretary" || role === "staff";
  const canRaise = role === "resident";
  const canUpdateStatus = role === "admin" || role === "secretary" || role === "staff";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  async function loadComplaints({
    searchValue = search,
    statusValue = statusFilter,
  } = {}) {
    try {
      setLoading(true);
      const queryParams = {
        search: searchValue || undefined,
        status: statusValue || undefined,
      };

      const response = canViewAll
        ? await fetchAllComplaints(queryParams)
        : await fetchMyComplaints(queryParams);
      setComplaints(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load complaints"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  function handleFilterSubmit(event) {
    event.preventDefault();
    loadComplaints();
  }

  function handleResetFilters() {
    setSearch("");
    setStatusFilter("");
    loadComplaints({ searchValue: "", statusValue: "" });
  }

  async function handleRaiseComplaint(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.title || !form.description) {
      setAlert({
        type: "error",
        message: "Title and description are required",
      });
      return;
    }

    try {
      setSubmitting(true);
      await raiseComplaint(form);
      setForm({ title: "", description: "" });
      setAlert({ type: "success", message: "Complaint submitted" });
      await loadComplaints();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not submit complaint"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(complaintId, status) {
    setAlert({ type: "", message: "" });

    try {
      await updateComplaintStatus(complaintId, status);
      setAlert({ type: "success", message: "Complaint status updated" });
      await loadComplaints();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not update status"),
      });
    }
  }

  async function handleAddComment(complaintId) {
    setAlert({ type: "", message: "" });
    const commentText = (commentDrafts[complaintId] || "").trim();

    if (!commentText) {
      setAlert({ type: "error", message: "Comment cannot be empty" });
      return;
    }

    try {
      await addComplaintComment(complaintId, commentText);
      setCommentDrafts((prev) => ({ ...prev, [complaintId]: "" }));
      setAlert({ type: "success", message: "Comment added" });
      await loadComplaints();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not add comment"),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Complaint Management</h2>
        <p className="text-sm text-slate-600">
          Raise complaints, track progress, and communicate through comments.
        </p>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      <form
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        onSubmit={handleFilterSubmit}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto_auto]">
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            placeholder="Search complaints"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            type="submit"
            className="rounded-lg theme-surface px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:theme-surface"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </form>

      {canRaise ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Raise Complaint</h3>
          <form className="mt-4 space-y-3" onSubmit={handleRaiseComplaint}>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Complaint title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <textarea
              className="h-28 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Describe the issue in detail"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg theme-surface px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:theme-surface disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Complaint List</h3>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading complaints...
          </div>
        ) : complaints.length ? (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <article
                key={complaint.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{complaint.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{complaint.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      By: {complaint.resident_name} ({complaint.resident_email})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        complaint.status === "resolved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {complaint.status.toUpperCase()}
                    </span>

                    {canUpdateStatus ? (
                      <select
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none ring-blue-500 focus:ring"
                        value={complaint.status}
                        onChange={(event) =>
                          handleStatusChange(complaint.id, event.target.value)
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Comments
                  </p>

                  {complaint.comments?.length ? (
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      {complaint.comments.map((comment) => (
                        <li key={comment.id} className="rounded-md bg-white p-2">
                          <p>{comment.comment_text}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {comment.user_name} ({comment.user_role})
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
                  )}

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
                      placeholder="Add a comment"
                      value={commentDrafts[complaint.id] || ""}
                      onChange={(event) =>
                        setCommentDrafts((prev) => ({
                          ...prev,
                          [complaint.id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(complaint.id)}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-[var(--text-main)] hover:bg-amber-600"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No complaints found.
          </div>
        )}
      </section>
    </div>
  );
}

export default ComplaintsPage;
