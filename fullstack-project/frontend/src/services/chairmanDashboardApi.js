import { fetchAiDashboardWidgets } from "./aiApi";
import { fetchAnalyticsDashboardBundle } from "./analyticsApi";
import { api } from "./authApi";
import { fetchBillingDashboard, fetchAllBills } from "./billingApi";
import { fetchAllComplaints, updateComplaintStatus } from "./complaintApi";
import { fetchAllDocuments, reviewDocument } from "./documentApi";
import { approveFlat, fetchFlats } from "./flatApi";
import { fetchNotices } from "./noticeApi";
import { getParkingSlots, getParkingStats } from "./parkingApi";
import { fetchStaffSecurity, fetchAttendanceSummary } from "./staffSecurityApi";
import { updateUserStatus, fetchUsers, fetchUsersByCategory } from "./userApi";
import {
  fetchSecurityPreapprovals,
  fetchVisitorAnalytics,
  fetchVisitorDashboard,
  fetchVisitorEmergencyAlerts,
  fetchVisitorLogs,
  securityUpdatePreapprovalStatus,
} from "./visitorApi";

function unwrap(payload) {
  if (!payload) return payload;
  if (Array.isArray(payload)) return payload;
  return payload.data || payload.rows || payload.users || payload.bills || payload.complaints || payload.documents || payload.notices || payload.flats || payload.visitors || payload.items || payload;
}

function asArray(payload) {
  const value = unwrap(payload);
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.bills)) return value.bills;
  if (Array.isArray(value?.complaints)) return value.complaints;
  if (Array.isArray(value?.documents)) return value.documents;
  if (Array.isArray(value?.notices)) return value.notices;
  return [];
}

function settled(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function rejectLeadershipUsers(row) {
  const role = String(row?.role || row?.user_role || row?.role_name || "").toLowerCase();
  const email = String(row?.email || "").toLowerCase();
  const storedEmail = String(localStorage.getItem("email") || "").toLowerCase();
  return !["chairman", "admin", "super_admin", "secretary"].includes(role) && (!storedEmail || email !== storedEmail);
}

function onlyResidents(rows) {
  return rows.filter((row) => {
    const role = String(row?.role || row?.resident_type || row?.user_type || row?.category || "").toLowerCase();
    const recordText = JSON.stringify(row || {}).toLowerCase();
    return rejectLeadershipUsers(row) && (["owner", "tenant", "resident"].includes(role) || /owner|tenant|resident|flat_number|flat no|kyc/.test(recordText));
  });
}

function onlyPendingApprovals(rows) {
  return rows.filter((row) => {
    const status = String(row?.status || row?.approval_status || "").toLowerCase();
    return ["pending", "pending_approval", "verification_pending", "submitted"].includes(status);
  });
}

async function fetchPendingSocietyApprovals(params = {}) {
  const { data } = await api.get("/approvals/pending", { params });
  const approvals = data?.approvals || data?.data || [];
  return approvals.map((row) => ({
    ...row,
    role: row.role === "resident" ? row.resident_type || row.role : row.role,
    requested_date: row.created_at,
  }));
}

function hasAny(row, keys) {
  return keys.some((key) => row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== "");
}

function onlyModuleRows(rows, keys) {
  return rows.filter((row) => rejectLeadershipUsers(row) && hasAny(row, keys));
}

function analyticsRows(payload) {
  const value = unwrap(payload);
  const overview = value?.overview || value?.analytics || value || {};
  const cards = overview?.cards || overview?.kpis || overview?.summary || {};
  if (Array.isArray(value)) return value;
  if (Array.isArray(overview?.reports)) return overview.reports;
  if (Array.isArray(overview?.rows)) return overview.rows;
  return Object.entries(cards)
    .filter(([, metric]) => typeof metric !== "object" || metric !== null)
    .map(([name, metric]) => ({ name, category: "KPI", metric: name, value: typeof metric === "object" ? JSON.stringify(metric) : metric, status: "active" }));
}

export function normalizeRows(payload) {
  return asArray(payload);
}

export async function fetchChairmanHome() {
  const [
    analytics,
    users,
    flats,
    bills,
    billingDashboard,
    complaints,
    visitorDashboard,
    visitorAnalytics,
    staffAttendance,
    alerts,
    notices,
    ai,
    approvals,
  ] = await Promise.allSettled([
    fetchAnalyticsDashboardBundle({ days: 180 }),
    fetchUsers(),
    fetchFlats(),
    fetchAllBills(),
    fetchBillingDashboard(),
    fetchAllComplaints(),
    fetchVisitorDashboard(),
    fetchVisitorAnalytics({ days: 30 }),
    fetchAttendanceSummary(),
    fetchVisitorEmergencyAlerts(),
    fetchNotices(),
    fetchAiDashboardWidgets(),
    fetchPendingSocietyApprovals(),
  ]);

  return {
    analytics: settled(analytics, null),
    users: normalizeRows(settled(users, [])),
    flats: normalizeRows(settled(flats, [])),
    bills: normalizeRows(settled(bills, [])),
    billingDashboard: unwrap(settled(billingDashboard, {})) || {},
    complaints: normalizeRows(settled(complaints, [])),
    visitorDashboard: unwrap(settled(visitorDashboard, {})) || {},
    visitorAnalytics: unwrap(settled(visitorAnalytics, {})) || {},
    staffAttendance: unwrap(settled(staffAttendance, {})) || {},
    alerts: normalizeRows(settled(alerts, [])),
    notices: normalizeRows(settled(notices, [])),
    ai: unwrap(settled(ai, {})) || {},
    approvals: normalizeRows(settled(approvals, [])),
  };
}

export async function fetchChairmanSection(sectionKey) {
  switch (sectionKey) {
    case "society-profile":
    case "society-settings":
    case "chairman-profile":
    case "branding":
    case "theme":
    case "language":
    case "notifications":
    case "settings":
      return [];
    case "towers-wings-floors":
    case "flats-properties":
    case "occupancy-analytics":
    case "flats":
      return onlyModuleRows(normalizeRows(await fetchFlats()), ["flat_number", "flat_no", "wing", "floor", "occupancy_status"]);
    case "parking-management":
      return normalizeRows(await getParkingSlots());
    case "owners":
      return normalizeRows(await fetchUsersByCategory("owner"));
    case "tenants":
      return normalizeRows(await fetchUsersByCategory("tenant"));
    case "resident-directory":
      return onlyResidents(normalizeRows(await fetchUsers()));
    case "pending-registrations":
    case "resident-approval":
    case "resident-approvals":
    case "move-in-out":
      return onlyPendingApprovals(normalizeRows(await fetchPendingSocietyApprovals()));
    case "pending-chairman-tasks":
      return normalizeRows(await fetchPendingSocietyApprovals());
    case "secretary-approvals":
      return normalizeRows(await fetchPendingSocietyApprovals({ approvalType: "secretary_registration" }));
    case "vehicle-approval":
    case "gate-passes":
      return normalizeRows(await fetchSecurityPreapprovals());
    case "staff-approval":
    case "staff-approvals":
      return normalizeRows(await fetchPendingSocietyApprovals({ approvalType: "staff_registration" }));
    case "security-approval":
    case "security-approvals":
      return normalizeRows(await fetchPendingSocietyApprovals({ approvalType: "security_registration" }));
    case "staff-management":
    case "staff-register":
    case "security-register":
    case "attendance":
    case "duty-assignment":
    case "performance":
      return onlyModuleRows(normalizeRows(await fetchStaffSecurity()), ["staff_id", "staff_role", "designation", "department", "attendance_status", "shift"]);
    case "document-approval":
    case "society-documents":
    case "documents":
    case "meeting-minutes":
    case "policies":
    case "contracts":
      return onlyModuleRows(normalizeRows(await fetchAllDocuments()), ["document_type", "category", "file_url", "expiry_date", "title"]);
    case "maintenance-bills":
    case "generate-bills":
    case "collections":
    case "pending-dues":
    case "receipts":
    case "reports":
    case "financial-reports":
    case "revenue-dashboard":
    case "collection-analytics":
      return onlyModuleRows(normalizeRows(await fetchAllBills()), ["bill_number", "invoice_no", "amount", "total_amount", "payment_status", "due_date"]);
    case "active-complaints":
    case "escalations":
    case "complaint-analytics":
    case "complaint-trends":
      return onlyModuleRows(normalizeRows(await fetchAllComplaints()), ["complaint_id", "ticket_no", "category", "priority", "assigned_to", "description"]);
    case "visitor-logs":
    case "visitor-analytics":
    case "security-reports":
      return onlyModuleRows(normalizeRows(await fetchVisitorLogs()), ["visitor_name", "purpose", "entry_time", "exit_time", "approval_status", "flat_number"]);
    case "emergency-alerts":
      return normalizeRows(await fetchVisitorEmergencyAlerts());
    case "notices":
    case "notice-board":
    case "polls":
    case "broadcast-messages":
    case "events":
      return onlyModuleRows(normalizeRows(await fetchNotices()), ["title", "notice_title", "audience", "scheduled_at", "published_at", "category"]);
    case "analytics":
      return analyticsRows(await fetchAnalyticsDashboardBundle({ days: 180 }));
    case "vendor-list":
    case "amc-contracts":
    case "service-requests":
      return [];
    default:
      return [];
  }
}

export async function fetchChairmanStats(sectionKey) {
  if (sectionKey === "parking-management") return unwrap(await getParkingStats()) || {};
  if (sectionKey === "attendance") return unwrap(await fetchAttendanceSummary()) || {};
  if (sectionKey === "visitor-analytics") return unwrap(await fetchVisitorAnalytics({ days: 30 })) || {};
  return {};
}

export async function runChairmanRowAction(action, row) {
  if (action === "approve-user" && row?.approval_type) {
    return api.post(`/approvals/${row.id || row.approval_id}/approve`, {});
  }
  if (action === "reject-user" && row?.approval_type) {
    return api.post(`/approvals/${row.id || row.approval_id}/reject`, { reason: "Rejected by society admin." });
  }
  if (action === "approve-user") return updateUserStatus(row.user_id || row.id, "active");
  if (action === "reject-user") return updateUserStatus(row.user_id || row.id, "rejected");
  if (action === "approve-flat") return approveFlat(row.id);
  if (action === "approve-vehicle") return securityUpdatePreapprovalStatus(row.id, "approved");
  if (action === "reject-vehicle") return securityUpdatePreapprovalStatus(row.id, "rejected");
  if (action === "approve-document") return reviewDocument(row.id, { status: "approved" });
  if (action === "reject-document") return reviewDocument(row.id, { status: "rejected" });
  if (action === "resolve-complaint") return updateComplaintStatus(row.id, "resolved");
  return null;
}
