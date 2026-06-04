import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  approveSuperAdminPendingUser,
  archiveSuperAdminSociety,
  changeSuperAdminSocietyCode,
  createSuperAdminSociety,
  getApiMessage,
  fetchSuperAdminActivityLogs,
  fetchSuperAdminAnalytics,
  fetchSuperAdminPendingApprovals,
  fetchSuperAdminPlatformStats,
  fetchSuperAdminSocietyAnalytics,
  fetchSuperAdminSocieties,
  fetchSuperAdminSubscriptions,
  rejectSuperAdminPendingUser,
  suspendSuperAdminSociety,
  updateSuperAdminSociety,
} from "../services/authApi";
import ThemeToggle from "../components/ThemeToggle";

const DEFAULT_PLAN_OPTIONS = ["starter", "premium", "enterprise"];
const DEFAULT_TAB = "chairman";
const ROLE_TAB_CONFIG = [
  { key: "chairman", label: "Chairman Requests", role: "admin" },
  { key: "secretary", label: "Secretary Requests", role: "secretary" },
  { key: "admin", label: "Admin Requests", role: "staff" },
  { key: "resident", label: "Resident Requests", role: "resident" },
];

const CHART_COLORS = ["#22d3ee", "#a78bfa", "#34d399", "#f59e0b", "#fb7185"];

const initialSocietyForm = {
  code: "",
  societyName: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  contactEmail: "",
  contactPhone: "",
  subscriptionPlan: "starter",
  status: "active",
  defaultLanguage: "en",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getRoleLabel(role) {
  if (role === "admin") return "Chairman";
  if (role === "secretary") return "Secretary";
  if (role === "resident") return "Resident";
  if (role === "staff") return "Admin";
  if (role === "security") return "Security";
  return role || "Unknown";
}

function getStatusTone(status) {
  if (status === "active" || status === "approved" || status === "paid") return "emerald";
  if (status === "pending" || status === "trial") return "amber";
  if (status === "suspended" || status === "past_due" || status === "blocked") return "rose";
  return "slate";
}

function StatusPill({ value }) {
  const tone = getStatusTone(value);
  const toneClasses = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    slate: "border-white/10 bg-white/5 text-slate-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize", toneClasses[tone])}>
      {String(value || "unknown").replace(/_/g, " ")}
    </span>
  );
}

function MetricCard({ label, value, helper, tone = "cyan" }) {
  const toneMap = {
    cyan: "from-cyan-400/20 to-cyan-400/5 text-cyan-100",
    violet: "from-violet-400/20 to-violet-400/5 text-violet-100",
    emerald: "from-emerald-400/20 to-emerald-400/5 text-emerald-100",
    amber: "from-amber-400/20 to-amber-400/5 text-amber-100",
    rose: "from-rose-400/20 to-rose-400/5 text-rose-100",
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.66))] p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", toneMap[tone])} />
      <p className="text-sm text-slate-400">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
      </div>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </motion.article>
  );
}

function SectionShell({ title, eyebrow, description, children, actions }) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.8))] shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">{eyebrow}</p> : null}
            <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
            {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ChartCard({ title, subtitle, data, color = "#22d3ee", labelKey = "period", dataKey = "total", kind = "area" }) {
  const chartData = Array.isArray(data) ? data : [];
  const gradientId = `gradient-${title.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-xl shadow-slate-950/20">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey={labelKey} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }} />
              <Bar dataKey={dataKey} radius={[10, 10, 0, 0]} fill={color} />
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey={labelKey} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(2,6,23,0.92)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, color: "#fff" }} />
              <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#${gradientId})`} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function emptyState(title, description, actionLabel, onAction) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{description}</p>
      {actionLabel ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState(null);
  const [societies, setSocieties] = useState([]);
  const [societyPagination, setSocietyPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1, hasNext: false, hasPrevious: false });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalMeta, setApprovalMeta] = useState({ total: 0, counts: {} });
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPagination, setActivityPagination] = useState({ page: 1, limit: 5, total: 0, totalPages: 1 });
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [subscriptions, setSubscriptions] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [selectedSociety, setSelectedSociety] = useState(null);
  const [selectedSocietyAnalytics, setSelectedSocietyAnalytics] = useState(null);
  const [selectedSocietyLoading, setSelectedSocietyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [societiesLoading, setSocietiesLoading] = useState(true);
  const [sectionError, setSectionError] = useState("");
  const [societySearch, setSocietySearch] = useState("");
  const [societyStatusFilter, setSocietyStatusFilter] = useState("all");
  const [societyPlanFilter, setSocietyPlanFilter] = useState("all");
  const [societySortBy, setSocietySortBy] = useState("created_at");
  const [societySortOrder, setSocietySortOrder] = useState("desc");
  const [approvalTab, setApprovalTab] = useState(DEFAULT_TAB);
  const [approvalActionLoading, setApprovalActionLoading] = useState("");
  const [societyActionLoading, setSocietyActionLoading] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingSocietyId, setEditingSocietyId] = useState(null);
  const [societyForm, setSocietyForm] = useState(initialSocietyForm);
  const [savingSociety, setSavingSociety] = useState(false);
  const [toast, setToast] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  const toastTimerRef = useRef(null);
  const analyticsAnchorRef = useRef(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message, type = "success") => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadActivityLogs = async (page = activityPage) => {
    setActivityLoading(true);
    setActivityError("");

    try {
      const response = await fetchSuperAdminActivityLogs({ page, pageSize: activityPagination.limit });
      const activities = response.activities || response.data || [];
      const nextPage = response.page || page;
      const nextLimit = response.limit || activityPagination.limit;

      setActivityLogs(activities);
      setActivityPage(nextPage);
      setActivityPagination({
        page: nextPage,
        limit: nextLimit,
        total: response.total || 0,
        totalPages: response.totalPages || 1,
      });
    } catch (error) {
      setActivityError(getApiMessage(error, "Failed to load activity feed."));
    } finally {
      setActivityLoading(false);
    }
  };

  const loadCoreSections = async () => {
    const results = await Promise.allSettled([
      fetchSuperAdminPlatformStats(),
      fetchSuperAdminPendingApprovals(),
      fetchSuperAdminSubscriptions(),
      fetchSuperAdminAnalytics(),
    ]);

    const [statsResult, approvalsResult, subscriptionsResult, analyticsResult] = results;

    if (statsResult.status === "fulfilled") setPlatformStats(statsResult.value.data);
    if (approvalsResult.status === "fulfilled") {
      setPendingApprovals(approvalsResult.value.data || []);
      setApprovalMeta(approvalsResult.value.meta || { total: 0, counts: {} });
    }
    if (subscriptionsResult.status === "fulfilled") setSubscriptions(subscriptionsResult.value.data || null);
    if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value.data || null);

    const failure = [statsResult, approvalsResult, subscriptionsResult, analyticsResult].find((item) => item.status === "rejected");
    if (failure) {
      setSectionError("Some platform sections could not be loaded. Refresh to retry.");
    } else {
      setSectionError("");
    }
    setLoading(false);
  };

  const loadSocieties = async (page = societyPagination.page) => {
    setSocietiesLoading(true);
    try {
      const response = await fetchSuperAdminSocieties({
        page,
        pageSize: societyPagination.pageSize,
        search: societySearch || undefined,
        status: societyStatusFilter === "all" ? undefined : societyStatusFilter,
        plan: societyPlanFilter === "all" ? undefined : societyPlanFilter,
        sortBy: societySortBy,
        sortOrder: societySortOrder,
      });

      setSocieties(response.data || []);
      setSocietyPagination(response.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 1, hasNext: false, hasPrevious: false });
    } catch (error) {
      setSectionError(getApiMessage(error, "Failed to load societies."));
    } finally {
      setSocietiesLoading(false);
    }
  };

  useEffect(() => {
    loadCoreSections();
    loadSocieties(1);
    loadActivityLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSocieties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [societySearch, societyStatusFilter, societyPlanFilter, societySortBy, societySortOrder]);

  useEffect(() => {
    const interval = window.setInterval(() => setLiveTick((value) => value + 1), 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    loadActivityLogs(activityPage);
  }, [liveTick]);

  useEffect(() => {
    if (!selectedSociety?.id) {
      setSelectedSocietyAnalytics(null);
      return;
    }

    let cancelled = false;
    setSelectedSocietyLoading(true);
    fetchSuperAdminSocietyAnalytics(selectedSociety.id)
      .then((response) => {
        if (!cancelled) {
          setSelectedSocietyAnalytics(response.data || null);
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedSocietyAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setSelectedSocietyLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSociety]);

  const summaryCards = useMemo(() => {
    const cards = platformStats?.cards || {};
    return [
      { label: "Total Societies", value: cards.totalSocieties ?? 0, helper: "Registered societies across the platform", tone: "cyan" },
      { label: "Active Societies", value: cards.activeSocieties ?? 0, helper: "Live production societies", tone: "emerald" },
      { label: "Pending Society Requests", value: cards.pendingSocietyRequests ?? 0, helper: "Trial/onboarding societies", tone: "amber" },
      { label: "Total Platform Users", value: cards.totalPlatformUsers ?? 0, helper: "All users, roles, and staff", tone: "violet" },
      { label: "Active Residents", value: cards.activeResidents ?? 0, helper: "Approved residents currently active", tone: "emerald" },
      { label: "Chairman Requests", value: cards.chairmanRequests ?? 0, helper: "Pending chairman approvals", tone: "rose" },
      { label: "Secretary Requests", value: cards.secretaryRequests ?? 0, helper: "Pending secretary approvals", tone: "amber" },
      { label: "Revenue / Subscriptions", value: `${formatCurrency(cards.revenue ?? 0)} / ${cards.activeSubscriptions ?? 0}`, helper: "Collected revenue and active subscription count", tone: "cyan" },
      { label: "Total Complaints", value: cards.totalComplaints ?? 0, helper: "Platform complaint volume", tone: "rose" },
      { label: "Active Security Staff", value: cards.activeSecurityStaff ?? 0, helper: "Security operators online", tone: "emerald" },
    ];
  }, [platformStats]);

  const filteredApprovals = useMemo(() => {
    const role = ROLE_TAB_CONFIG.find((item) => item.key === approvalTab)?.role;
    return pendingApprovals.filter((item) => item.role === role);
  }, [approvalTab, pendingApprovals]);

  const activityFeed = useMemo(() => {
    const actionLabels = {
      society_created: "New society created",
      society_updated: "Society updated",
      society_suspended: "Society suspended",
      society_archived: "Society archived",
      society_deleted: "Society deleted",
      user_approved: "Resident approved",
      approval_approved: "Resident approved",
      complaint_created: "Complaint created",
      payment_created: "Payment created",
      security_login: "Security login",
      login_success: "Platform login",
      super_admin_login: "Super admin login",
    };

    return (activityLogs || []).map((item) => ({
      ...item,
      label: actionLabels[item.action] || item.action.replace(/_/g, " "),
      time: formatDateTime(item.created_at),
    }));
  }, [activityLogs]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([loadCoreSections(), loadSocieties(1), loadActivityLogs(1)]);
  };

  const openCreateModal = () => {
    setEditingSocietyId(null);
    setSocietyForm(initialSocietyForm);
    setModalMode("create");
    setModalOpen(true);
  };

  const openEditModal = (society, mode = "edit") => {
    setEditingSocietyId(society.id);
    setSocietyForm({
      code: society.code || "",
      societyName: society.society_name || society.name || "",
      address: society.address || "",
      city: society.city || "",
      state: society.state || "",
      pincode: society.pincode || "",
      contactEmail: society.contact_email || "",
      contactPhone: society.contact_phone || "",
      subscriptionPlan: society.subscription_plan || "starter",
      status: society.status || "active",
      defaultLanguage: "en",
    });
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleDeleteSociety = async (society) => {
    const confirmed = window.confirm(`Delete ${society.name}? This will mark the society as deleted.`);
    if (!confirmed) return;

    try {
      await archiveSuperAdminSociety(society.id);
      window.dispatchEvent(new Event("societies:changed"));
      setSocietyStatusFilter("deleted");
      showToast("Society deleted successfully", "success");
      await handleRefresh();
    } catch (error) {
      console.error("[SuperAdminDashboard] Delete society API error:", error?.response?.data?.message || error?.message || error);
      showToast(getApiMessage(error, "Failed to delete society"), "error");
    }
  };

  const handleCreateSociety = async (event) => {
    event.preventDefault();
    setSavingSociety(true);

    const apiUrl = "/super-admin/societies";
    const createPayload = {
      name: societyForm.societyName.trim(),
      society_name: societyForm.societyName.trim(),
      address: societyForm.address.trim(),
      city: societyForm.city.trim(),
      state: societyForm.state.trim(),
      pincode: societyForm.pincode.trim(),
      contact_email: societyForm.contactEmail.trim(),
      contact_phone: societyForm.contactPhone.trim(),
      status: societyForm.status,
      subscriptionPlan: societyForm.subscriptionPlan,
      defaultLanguage: societyForm.defaultLanguage,
    };

    console.log("[SuperAdminDashboard] Create society form data:", createPayload);
    console.log("[SuperAdminDashboard] Create society API URL:", apiUrl);

    try {
      if (editingSocietyId) {
        if (modalMode === "code") {
          await changeSuperAdminSocietyCode(editingSocietyId, { code: societyForm.code });
        } else {
          await updateSuperAdminSociety(editingSocietyId, {
            name: societyForm.societyName,
            societyName: societyForm.societyName,
            address: societyForm.address,
            city: societyForm.city,
            state: societyForm.state,
            pincode: societyForm.pincode,
            contactEmail: societyForm.contactEmail,
            contactPhone: societyForm.contactPhone,
            subscriptionPlan: societyForm.subscriptionPlan,
            status: societyForm.status,
            defaultLanguage: societyForm.defaultLanguage,
          });
        }
        window.dispatchEvent(new Event("societies:changed"));
        showToast("Society updated successfully", "success");
      } else {
        const response = await createSuperAdminSociety(createPayload);
        console.log("[SuperAdminDashboard] Create society API response:", response);
        window.dispatchEvent(new Event("societies:changed"));
        showToast("Society created successfully", "success");
      }

      setModalOpen(false);
      await handleRefresh();
    } catch (error) {
      console.error("[SuperAdminDashboard] Create society API error:", error?.response?.data?.message || error?.message || error);
      showToast(getApiMessage(error, "Failed to create society"), "error");
    } finally {
      setSavingSociety(false);
    }
  };

  const handleSocietyAction = async (action, society) => {
    setSocietyActionLoading(`${action}-${society.id}`);
    try {
      if (action === "suspend") {
        await suspendSuperAdminSociety(society.id);
      } else if (action === "archive") {
        await handleDeleteSociety(society);
        return;
      } else if (action === "code") {
        openEditModal(society, "code");
        return;
      } else if (action === "edit") {
        openEditModal(society, "edit");
        return;
      } else if (action === "open") {
        navigate(`/super-admin/societies/${society.id}`);
        return;
      } else if (action === "analytics") {
        setSelectedSociety(society);
        return;
      }

      await handleRefresh();
    } finally {
      setSocietyActionLoading("");
    }
  };

  const handleApprovalAction = async (approval, verdict) => {
    setApprovalActionLoading(`${verdict}-${approval.id}`);
    try {
      if (verdict === "approve") {
        await approveSuperAdminPendingUser(approval.id, {});
      } else {
        const reason = window.prompt(`Reject ${approval.name}? Provide a reason:`);
        if (!reason) return;
        await rejectSuperAdminPendingUser(approval.id, { reason });
      }

      await loadCoreSections();
    } finally {
      setApprovalActionLoading("");
    }
  };

  const exportSocietiesCsv = () => {
    const rows = [
      ["Society Name", "Society Code", "Chairman", "Secretary", "Total Flats", "Total Residents", "Plan", "Status", "Created Date"],
      ...societies.map((item) => [
        item.name,
        item.code,
        item.chairman_name || "",
        item.secretary_name || "",
        item.total_flats ?? 0,
        item.total_residents ?? 0,
        item.subscription_plan || item.plan_name || "starter",
        item.status,
        item.created_at,
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "super-admin-societies.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  const approvalsByTab = approvalMeta?.counts || {};

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#07111f_48%,#020617_100%)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      {toast ? (
        <div
          className={cn(
            "fixed right-4 top-4 z-[70] max-w-sm rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl",
            toast.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-50"
              : "border-rose-400/30 bg-rose-500/15 text-rose-50"
          )}
        >
          <p className="text-sm font-semibold">{toast.message}</p>
        </div>
      ) : null}
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
        <header className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(2,6,23,0.95),rgba(15,23,42,0.82))] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl sm:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.12),transparent_22%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.16),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.14),transparent_22%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300/80">Hidden Super Admin Control Center</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Smart Society SaaS operator panel</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Manage every society, subscription, approval, complaint, and platform event from a single production-grade console.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">Direct access only: /super-admin/login</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Live MySQL data</span>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1">Enterprise SaaS management</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={exportSocietiesCsv}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-400/20"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                + Create New Society
              </button>
            </div>
          </div>
        </header>

        {sectionError ? <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{sectionError}</div> : null}

        {loading && !platformStats ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-8 text-slate-300">Loading super admin control center...</div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {summaryCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </section>

            <SectionShell
              eyebrow="Society management"
              title="Society management table"
              description="Search, sort, filter, open, edit, suspend, archive, and inspect any society on the platform."
              actions={
                <>
                  <input
                    value={societySearch}
                    onChange={(event) => setSocietySearch(event.target.value)}
                    placeholder="Search societies"
                    className="min-w-[220px] rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                  />
                  <select
                    value={societyStatusFilter}
                    onChange={(event) => setSocietyStatusFilter(event.target.value)}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="trial">Trial</option>
                    <option value="suspended">Suspended</option>
                    <option value="deleted">Deleted</option>
                    <option value="archived">Archived</option>
                  </select>
                  <select
                    value={societyPlanFilter}
                    onChange={(event) => setSocietyPlanFilter(event.target.value)}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/40"
                  >
                    <option value="all">All Plans</option>
                    {DEFAULT_PLAN_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>
                    ))}
                  </select>
                </>
              }
            >
              <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70">
                {societiesLoading ? (
                  <div className="px-6 py-10 text-sm text-slate-300">Loading societies...</div>
                ) : societies.length === 0 ? (
                  emptyState(
                    "No societies created yet.",
                    "Build the first tenant record for the Smart Society Management platform and seed its chairman/secretary requests.",
                    "Create First Society",
                    openCreateModal
                  )
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-slate-300">
                        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <tr>
                            {[
                              ["name", "Society Name"],
                              ["code", "Society Code"],
                              ["chairman", "Chairman"],
                              ["secretary", "Secretary"],
                              ["flats", "Total Flats"],
                              ["residents", "Total Residents"],
                              ["plan", "Plan"],
                              ["status", "Status"],
                              ["created_at", "Created Date"],
                            ].map(([key, label]) => (
                              <th key={key} className="px-4 py-3 font-semibold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (["chairman", "secretary", "flats", "residents", "plan"].includes(key)) return;
                                    setSocietySortBy(key);
                                    setSocietySortOrder((current) => (societySortBy === key && current === "asc" ? "desc" : "asc"));
                                  }}
                                  className="flex items-center gap-1 text-slate-300 transition hover:text-white"
                                >
                                  <span>{label}</span>
                                  {societySortBy === key ? <span className="text-cyan-300">{societySortOrder === "asc" ? "↑" : "↓"}</span> : null}
                                </button>
                              </th>
                            ))}
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {societies.map((society) => (
                            <tr key={society.id} className="border-b border-white/5 last:border-none hover:bg-white/5">
                              <td className="px-4 py-4">
                                <div>
                                  <p className="font-semibold text-white">{society.name}</p>
                                  <p className="mt-1 text-xs text-slate-500">{society.address || [society.city, society.state].filter(Boolean).join(", ") || "No address saved"}</p>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-cyan-200">{society.code}</td>
                              <td className="px-4 py-4">{society.chairman_name || "-"}</td>
                              <td className="px-4 py-4">{society.secretary_name || "-"}</td>
                              <td className="px-4 py-4">{society.total_flats ?? 0}</td>
                              <td className="px-4 py-4">{society.total_residents ?? 0}</td>
                              <td className="px-4 py-4 capitalize">{society.subscription_plan || society.plan_name || "starter"}</td>
                              <td className="px-4 py-4"><StatusPill value={society.status} /></td>
                              <td className="px-4 py-4 text-slate-400">{formatDate(society.created_at)}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    ["open", "Open Society"],
                                    ["edit", "Edit Society"],
                                    ["suspend", "Suspend Society"],
                                    ["archive", "Delete Society"],
                                    ["code", "Change Society Code"],
                                    ["analytics", "View Analytics"],
                                  ].map(([action, label]) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={() => handleSocietyAction(action, society)}
                                      disabled={societyActionLoading === `${action}-${society.id}`}
                                      className={cn(
                                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                        action === "archive"
                                          ? "border-rose-500/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                                          : action === "suspend"
                                            ? "border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
                                            : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                                      )}
                                    >
                                      {societyActionLoading === `${action}-${society.id}` ? "Working..." : label}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                      <p>Showing {societies.length} of {societyPagination.total || 0} societies</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!societyPagination.hasPrevious}
                          onClick={() => loadSocieties(societyPagination.page - 1)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                          Page {societyPagination.page} of {societyPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={!societyPagination.hasNext}
                          onClick={() => loadSocieties(societyPagination.page + 1)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SectionShell>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <SectionShell
                eyebrow="Approvals"
                title="Pending approval queue"
                description="Chairman, secretary, admin, and resident requests are processed directly from MySQL and can be approved or rejected in place."
              >
                <div className="mb-5 flex flex-wrap gap-2">
                  {ROLE_TAB_CONFIG.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setApprovalTab(tab.key)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                        approvalTab === tab.key
                          ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-100"
                          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      )}
                    >
                      {tab.label}
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-200">
                        {tab.key === "chairman" ? approvalsByTab.chairman || 0 : approvalsByTab[tab.role] || 0}
                      </span>
                    </button>
                  ))}
                </div>

                {filteredApprovals.length === 0 ? (
                  emptyState("No pending requests", "There are no pending approvals in this queue right now.")
                ) : (
                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-slate-300">
                        <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                          <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Society</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Request Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApprovals.map((approval) => (
                            <tr key={approval.id} className="border-b border-white/5 last:border-none hover:bg-white/5">
                              <td className="px-4 py-4 font-semibold text-white">{approval.name}</td>
                              <td className="px-4 py-4">{approval.email}</td>
                              <td className="px-4 py-4">{approval.society_name} ({approval.society_code})</td>
                              <td className="px-4 py-4">{getRoleLabel(approval.role)}</td>
                              <td className="px-4 py-4 text-slate-400">{formatDateTime(approval.created_at)}</td>
                              <td className="px-4 py-4"><StatusPill value={approval.status} /></td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleApprovalAction(approval, "approve")}
                                    disabled={approvalActionLoading === `approve-${approval.id}`}
                                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                                  >
                                    {approvalActionLoading === `approve-${approval.id}` ? "Working..." : "Approve"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApprovalAction(approval, "reject")}
                                    disabled={approvalActionLoading === `reject-${approval.id}`}
                                    className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                  >
                                    {approvalActionLoading === `reject-${approval.id}` ? "Working..." : "Reject"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </SectionShell>

              <SectionShell
                eyebrow="Platform activity"
                title="Live activity feed"
                description="Real audit activity from the MySQL platform trail with automatic refresh."
              >
                {activityError ? (
                  <div className="rounded-[20px] border border-rose-500/20 bg-rose-500/10 px-5 py-6 text-rose-100">
                    {activityError}
                  </div>
                ) : activityLoading ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-5 py-6 text-slate-300">Loading activity feed...</div>
                ) : activityFeed.length === 0 ? (
                  emptyState("No activity recorded yet.", "Platform actions will appear here as societies, users, and payments move through the system.")
                ) : (
                  <>
                    <div className="space-y-3">
                      {activityFeed.map((item) => (
                        <div key={item.id} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{item.label}</p>
                              <p className="mt-1 text-sm text-slate-400">
                                {item.user_name || "System"}{item.user_email ? ` • ${item.user_email}` : ""}
                              </p>
                            </div>
                            <span className="text-xs text-slate-500">{item.time}</span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                            {item.resource_type || "platform"} {item.resource_id ? `#${item.resource_id}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-400">Showing {activityFeed.length} of {activityPagination.total} recent activities</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={activityPage <= 1 || activityLoading}
                          onClick={() => loadActivityLogs(activityPage - 1)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
                          Page {activityPagination.page} of {activityPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          disabled={activityPage >= activityPagination.totalPages || activityLoading}
                          onClick={() => loadActivityLogs(activityPage + 1)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </SectionShell>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <SectionShell
                eyebrow="Subscriptions"
                title="Subscription and SaaS management"
                description="Track plan mix, active subscriptions, billing status, renewal windows, and platform-side revenue signals."
              >
                {subscriptions ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Starter Plan", subscriptions.summary?.trial ?? 0, "Trial/Starter records"],
                        ["Active Subscriptions", subscriptions.summary?.active ?? 0, "Live billing customers"],
                        ["Past Due", subscriptions.summary?.past_due ?? 0, "Needs billing follow-up"],
                        ["Revenue", formatCurrency(subscriptions.summary?.revenue ?? 0), "Approx. monthly revenue signal"],
                      ].map(([label, value, helper]) => (
                        <div key={label} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                          <p className="mt-1 text-sm text-slate-400">{helper}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 space-y-3">
                      {subscriptions.plans?.map((plan) => (
                        <div key={plan.key} className="flex items-center justify-between rounded-[20px] border border-white/10 bg-slate-950/70 px-4 py-3">
                          <div>
                            <p className="font-semibold text-white">{plan.name}</p>
                            <p className="text-sm text-slate-400">Plan key: {plan.key}</p>
                          </div>
                          <p className="text-sm font-semibold text-cyan-200">{formatCurrency(plan.price)}/month</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70">
                      <div className="max-h-[320px] overflow-auto">
                        <table className="min-w-full text-left text-sm text-slate-300">
                          <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                            <tr>
                              <th className="px-4 py-3">Society</th>
                              <th className="px-4 py-3">Plan</th>
                              <th className="px-4 py-3">Billing Status</th>
                              <th className="px-4 py-3">Renewal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subscriptions.subscriptions?.map((item) => (
                              <tr key={item.id} className="border-b border-white/5 last:border-none">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-white">{item.society_name}</p>
                                  <p className="text-xs text-slate-500">{item.society_code}</p>
                                </td>
                                <td className="px-4 py-3 capitalize">{item.plan_name}</td>
                                <td className="px-4 py-3"><StatusPill value={item.status} /></td>
                                <td className="px-4 py-3 text-slate-400">{formatDate(item.renewal_at)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  emptyState("No subscription data yet.", "Once societies are provisioned, their live subscription rows will appear here.")
                )}
              </SectionShell>

              <SectionShell
                eyebrow="Platform analytics"
                title="Growth and performance analytics"
                description="Monthly society growth, user growth, complaint pressure, revenue signals, and login activity."
              >
                <div ref={analyticsAnchorRef}>
                  {analytics ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                      <ChartCard title="Society growth" subtitle="Monthly societies created" data={analytics.societyGrowth} color="#22d3ee" kind="area" />
                      <ChartCard title="User growth" subtitle="Monthly platform users created" data={analytics.userGrowth} color="#a78bfa" kind="area" />
                      <ChartCard title="Complaint trends" subtitle="Monthly complaint volume" data={analytics.complaintTrend} color="#f59e0b" kind="bar" />
                      <ChartCard title="Revenue trends" subtitle="Monthly collected bill payments" data={analytics.revenueTrend} color="#34d399" kind="area" />
                      <ChartCard title="Active login analytics" subtitle="Monthly login activity" data={analytics.loginTrend} color="#fb7185" kind="bar" />
                    </div>
                  ) : (
                    emptyState("No analytics available yet.", "Charts will populate automatically once platform data exists.")
                  )}
                </div>
              </SectionShell>
            </div>

            {selectedSociety ? (
              <SectionShell
                eyebrow="Society drill-down"
                title={`Analytics for ${selectedSociety.name}`}
                description="Open any society from the platform table to inspect its activity, staffing, and billing context."
                actions={
                  <button
                    type="button"
                    onClick={() => setSelectedSociety(null)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                }
              >
                {selectedSocietyLoading ? (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-5 py-6 text-slate-300">Loading society analytics...</div>
                ) : selectedSocietyAnalytics ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Users", selectedSocietyAnalytics.userStats?.total_users ?? 0],
                      ["Active Residents", selectedSocietyAnalytics.userStats?.active_residents ?? 0],
                      ["Flats", selectedSocietyAnalytics.flatStats?.total_flats ?? 0],
                      ["Occupied Flats", selectedSocietyAnalytics.flatStats?.occupied_flats ?? 0],
                      ["Vacant Flats", selectedSocietyAnalytics.flatStats?.vacant_flats ?? 0],
                      ["Active Visitors", selectedSocietyAnalytics.visitorStats?.active_visitors ?? 0],
                      ["Pending Complaints", selectedSocietyAnalytics.complaintStats?.pending_complaints ?? 0],
                      ["Paid Bills", selectedSocietyAnalytics.billStats?.paid_bills ?? 0],
                      ["Unpaid Bills", selectedSocietyAnalytics.billStats?.unpaid_bills ?? 0],
                      ["Monthly Collection", formatCurrency(selectedSocietyAnalytics.billStats?.monthly_collection ?? 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
                        <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-white/10 bg-white/5 px-5 py-6 text-slate-300">No analytics payload available for this society.</div>
                )}
              </SectionShell>
            ) : null}
          </>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl shadow-slate-950/60">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">{modalMode === "create" ? "Create society" : modalMode === "code" ? "Change society code" : "Edit society"}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{modalMode === "create" ? "Create a new society" : "Update society details"}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateSociety} className="grid gap-5 p-6 md:grid-cols-2">
              {modalMode === "create"
                ? [
                    ["societyName", "Society Name"],
                    ["address", "Address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                    ["contactEmail", "Contact Email"],
                    ["contactPhone", "Contact Phone"],
                  ].map(([field, label]) => (
                    <label key={field} className={cn("flex flex-col gap-2", field === "address" ? "md:col-span-2" : "") }>
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                      <input
                        type={String(field).includes("Email") ? "email" : "text"}
                        value={societyForm[field]}
                        onChange={(event) => setSocietyForm((current) => ({ ...current, [field]: event.target.value }))}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      />
                    </label>
                  ))
                : [
                    ["code", "Society Code"],
                    ["societyName", "Society Name"],
                    ["address", "Address"],
                    ["city", "City"],
                    ["state", "State"],
                    ["pincode", "Pincode"],
                    ["contactEmail", "Contact Email"],
                    ["contactPhone", "Contact Phone"],
                  ].map(([field, label]) => (
                    <label key={field} className={cn("flex flex-col gap-2", field === "address" ? "md:col-span-2" : "") }>
                      <span className="text-sm font-medium text-slate-300">{label}</span>
                      <input
                        type={String(field).includes("Email") ? "email" : "text"}
                        value={societyForm[field]}
                        onChange={(event) => setSocietyForm((current) => ({ ...current, [field]: event.target.value }))}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
                      />
                    </label>
                  ))}

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-300">Subscription Plan</span>
                <select
                  value={societyForm.subscriptionPlan}
                  onChange={(event) => setSocietyForm((current) => ({ ...current, subscriptionPlan: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  {DEFAULT_PLAN_OPTIONS.map((plan) => (
                    <option key={plan} value={plan}>{plan[0].toUpperCase() + plan.slice(1)}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-300">Status</span>
                <select
                  value={societyForm.status}
                  onChange={(event) => setSocietyForm((current) => ({ ...current, status: event.target.value }))}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
                >
                  {[
                    ["active", "Active"],
                    ["inactive", "Inactive"],
                    ["trial", "Trial"],
                    ["suspended", "Suspended"],
                    ["archived", "Archived"],
                    ["deleted", "Deleted"],
                  ].map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                <p className="text-sm text-slate-400">This form writes directly to the MySQL tenant tables and provisions the new society record.</p>
                <button
                  type="submit"
                  disabled={savingSociety}
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSociety ? "Saving..." : modalMode === "create" ? "Create Society" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SuperAdminDashboardPage;
