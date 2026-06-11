import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import { getBackendBaseUrl } from "../services/runtimeUrls";
import {
  fetchAllDocuments,
  fetchMyDocuments,
  reviewDocument,
  uploadTenantDocument,
} from "../services/documentApi";

function DocumentsPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const role = currentUser?.role || "resident";
  const residentType = currentUser?.resident_type || "owner";

  const isAdminPanel = role === "admin" || role === "secretary";
  const canUpload = role === "resident" && residentType === "tenant";

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [form, setForm] = useState({
    documentType: "",
    file: null,
  });

  async function loadData() {
    try {
      setLoading(true);
      const response = isAdminPanel ? await fetchAllDocuments() : await fetchMyDocuments();
      setDocuments(response.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load documents"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();

    if (!form.documentType || !form.file) {
      setAlert({ type: "error", message: "Document type and file are required" });
      return;
    }

    try {
      setUploading(true);
      await uploadTenantDocument(form);
      setAlert({ type: "success", message: "Document uploaded successfully" });
      setForm({ documentType: "", file: null });
      await loadData();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not upload document"),
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleReview(documentId, status) {
    try {
      await reviewDocument(documentId, { status });
      setAlert({ type: "success", message: "Document reviewed" });
      await loadData();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not review document"),
      });
    }
  }

  return (
    <div className="chairman-page space-y-5">
      <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
      <AlertMessage type={alert.type} message={alert.message} />

      {canUpload ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Upload Tenant Document</h3>
          <form className="grid gap-3 md:grid-cols-3" onSubmit={handleUpload}>
            <input
              type="text"
              value={form.documentType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, documentType: event.target.value }))
              }
              placeholder="Document type (e.g. Lease Agreement)"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
              }
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={uploading}
              className="rounded-lg theme-surface px-3 py-2 text-sm font-semibold text-[var(--text-main)] hover:theme-surface disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          {isAdminPanel ? "All Uploaded Documents" : "My Uploaded Documents"}
        </h3>

        {loading ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : documents.length ? (
          <div className="chairman-page overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">File</th>
                  {isAdminPanel ? <th className="px-3 py-2">Review</th> : null}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{doc.document_type}</td>
                    <td className="px-3 py-2">{doc.user_name || "-"}</td>
                    <td className="px-3 py-2">{doc.status}</td>
                    <td className="px-3 py-2">
                      <a
                        href={`${getBackendBaseUrl()}${doc.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 hover:text-blue-900"
                      >
                        Open
                      </a>
                    </td>
                    {isAdminPanel ? (
                      <td className="px-3 py-2">
                        <div className="chairman-page flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(doc.id, "approved")}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-[var(--text-main)]"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(doc.id, "rejected")}
                            className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-[var(--text-main)]"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-600">No documents found.</p>
        )}
      </section>
    </div>
  );
}

export default DocumentsPage;
