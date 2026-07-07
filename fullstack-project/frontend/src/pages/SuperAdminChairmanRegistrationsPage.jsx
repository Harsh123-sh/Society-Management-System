import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import {
  approveSuperAdminPendingUser,
  createSuperAdminSociety,
  fetchSuperAdminPendingApprovals,
  getApiMessage,
  rejectSuperAdminPendingUser,
} from "../services/authApi";

const initialSocietyForm = {
  name: "",
  code: "",
  address: "",
  chairmanEmail: "",
  chairmanMobile: "",
};

function normalizeSocietyCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function roleLabel(item) {
  return item?.role_label || (["chairman", "admin"].includes(item?.role) ? "Chairman" : item?.role || "User");
}

function formatSubmittedDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
}

export default function SuperAdminChairmanRegistrationsPage() {
  const [societyForm, setSocietyForm] = useState(initialSocietyForm);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState("");
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function loadApprovals() {
    try {
      setLoading(true);
      const response = await fetchSuperAdminPendingApprovals({ role: "chairman" });
      setApprovals(response.data || []);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to fetch pending Chairman registrations.") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
  }, []);

  function updateSocietyField(field, value) {
    setSocietyForm((current) => ({
      ...current,
      [field]: field === "code" ? normalizeSocietyCode(value) : value,
    }));
  }

  async function createPendingSociety(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });
    const societyCode = normalizeSocietyCode(societyForm.code);
    if (!societyForm.name || !societyCode || !societyForm.address || !societyForm.chairmanEmail || !societyForm.chairmanMobile) {
      setAlert({ type: "error", message: "Society name, code, address, Chairman email and Chairman mobile are required." });
      return;
    }
    if (societyCode.length < 2 || societyCode.length > 30 || !/^[A-Z0-9-]+$/.test(societyCode)) {
      setAlert({ type: "error", message: "Society code must be 2 to 30 characters and use only uppercase letters, numbers, and hyphens." });
      return;
    }

    try {
      setCreating(true);
      const response = await createSuperAdminSociety({
        name: societyForm.name.trim(),
        society_name: societyForm.name.trim(),
        code: societyCode,
        address: societyForm.address.trim(),
        chairmanEmail: societyForm.chairmanEmail.trim(),
        chairmanMobile: societyForm.chairmanMobile.trim(),
      });
      setSocietyForm(initialSocietyForm);
      setAlert({ type: "success", message: response.message || "Society created with Pending Chairman Registration status." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to create society.") });
    } finally {
      setCreating(false);
    }
  }

  async function approve(item) {
    try {
      setActionId(`approve-${item.id}`);
      const response = await approveSuperAdminPendingUser(item.id, { comments: "Chairman approved by Super Admin" });
      setAlert({ type: "success", message: response.message || "Chairman approved successfully." });
      await loadApprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to approve Chairman.") });
    } finally {
      setActionId("");
    }
  }

  async function reject(item) {
    const reason = window.prompt("Reason for rejection");
    if (!reason) return;

    try {
      setActionId(`reject-${item.id}`);
      const response = await rejectSuperAdminPendingUser(item.id, { reason });
      setAlert({ type: "success", message: response.message || "Chairman rejected." });
      await loadApprovals();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to reject Chairman.") });
    } finally {
      setActionId("");
    }
  }

  return (
    <main className="superadmin-shell">
      <section className="sa-container">
        <div className="sa-page-head">
          <div>
            <span>Super Admin</span>
            <h1>Chairman Registration Control</h1>
            <p>Create a society invitation, then approve verified Chairman registrations.</p>
          </div>
          <button type="button" onClick={loadApprovals} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
        </div>

        <AlertMessage type={alert.type} message={alert.message} />

        <section className="sa-panel">
          <div className="sa-panel__body">
            <h2>Create Society</h2>
            <form className="auth-v2-step-section is-active" onSubmit={createPendingSociety}>
              <div className="auth-v2-two">
                <label className="auth-v2-field"><span>Society Name</span><input value={societyForm.name} onChange={(event) => updateSocietyField("name", event.target.value)} /></label>
                <label className="auth-v2-field"><span>Society Code</span><input value={societyForm.code} onChange={(event) => updateSocietyField("code", event.target.value)} /></label>
              </div>
              <label className="auth-v2-field"><span>Address</span><input value={societyForm.address} onChange={(event) => updateSocietyField("address", event.target.value)} /></label>
              <div className="auth-v2-two">
                <label className="auth-v2-field"><span>Chairman Email</span><input type="email" value={societyForm.chairmanEmail} onChange={(event) => updateSocietyField("chairmanEmail", event.target.value.trim())} /></label>
                <label className="auth-v2-field"><span>Chairman Mobile</span><input value={societyForm.chairmanMobile} onChange={(event) => updateSocietyField("chairmanMobile", event.target.value.replace(/[^\d+ -]/g, ""))} /></label>
              </div>
              <button className="auth-v2-submit" disabled={creating}>{creating ? "Creating..." : "Create Pending Society"}</button>
            </form>
          </div>
        </section>

        <section className="sa-panel">
          <div className="sa-panel__body">
            <h2>Pending Chairman Registrations</h2>
            <div className="sa-table-wrap">
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>Chairman</th>
                    <th>Mobile</th>
                    <th>Society</th>
                    <th>Submitted</th>
                    <th>OTP Verified</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.name}</strong><span>{item.email}</span></td>
                      <td>{item.mobile || "Not provided"}</td>
                      <td><strong>{item.society_name}</strong><span>{item.society_code}</span></td>
                      <td>{formatSubmittedDate(item.created_at)}</td>
                      <td>{item.is_verified ? "Verified" : "Pending"}</td>
                      <td>{item.status}</td>
                      <td>
                        <button type="button" onClick={() => setSelectedApproval(item)}>View Details</button>
                        <button type="button" onClick={() => approve(item)} disabled={Boolean(actionId)}>{actionId === `approve-${item.id}` ? "Approving..." : "Approve"}</button>
                        <button type="button" onClick={() => reject(item)} disabled={Boolean(actionId)}>{actionId === `reject-${item.id}` ? "Rejecting..." : "Reject"}</button>
                      </td>
                    </tr>
                  ))}
                  {!approvals.length ? <tr><td colSpan="7">{loading ? "Loading..." : "No pending Chairman registrations."}</td></tr> : null}
                </tbody>
              </table>
            </div>
            {selectedApproval ? (
              <div className="auth-v2-review">
                <div><span>Chairman</span><strong>{selectedApproval.name}</strong></div>
                <div><span>Email</span><strong>{selectedApproval.email}</strong></div>
                <div><span>Mobile</span><strong>{selectedApproval.mobile || "Not provided"}</strong></div>
                <div><span>Society</span><strong>{selectedApproval.society_name}</strong></div>
                <div><span>Society Code</span><strong>{selectedApproval.society_code}</strong></div>
                <div><span>Role</span><strong>{roleLabel(selectedApproval)}</strong></div>
                <div><span>Submitted</span><strong>{formatSubmittedDate(selectedApproval.created_at)}</strong></div>
                <div><span>OTP</span><strong>{selectedApproval.is_verified ? "Verified" : "Pending"}</strong></div>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
