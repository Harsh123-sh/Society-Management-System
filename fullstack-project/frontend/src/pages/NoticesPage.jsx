import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import { createNotice, fetchNotices } from "../services/noticeApi";

function NoticesPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const canPostNotice = ["admin", "secretary"].includes(currentUser?.role);

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const [form, setForm] = useState({
    title: "",
    message: "",
  });

  async function loadNotices() {
    try {
      setLoading(true);
      const response = await fetchNotices();
      setNotices(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load notices"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  async function handleCreateNotice(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.title || !form.message) {
      setAlert({
        type: "error",
        message: "Title and message are required",
      });
      return;
    }

    try {
      setSubmitting(true);
      await createNotice(form);
      setForm({ title: "", message: "" });
      setAlert({ type: "success", message: "Notice posted successfully" });
      await loadNotices();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not post notice"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notice Board</h2>
        <p className="text-sm text-slate-600">
          Admin and secretary can post notices and residents can view the latest announcements.
        </p>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      {canPostNotice ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Post New Notice</h3>
          <form className="mt-4 space-y-3" onSubmit={handleCreateNotice}>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Notice title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
            <textarea
              className="h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="Write the notice content"
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, message: event.target.value }))
              }
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? "Posting..." : "Post Notice"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Latest Notices</h3>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading notices...
          </div>
        ) : notices.length ? (
          <div className="space-y-3">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{notice.title}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {notice.message}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {notice.created_at ? new Date(notice.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Posted by: {notice.created_by_name} ({notice.created_by_email})
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No notices available.
          </div>
        )}
      </section>
    </div>
  );
}

export default NoticesPage;
