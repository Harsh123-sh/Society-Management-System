import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import AlertMessage from "../components/AlertMessage";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { getApiMessage } from "../services/authApi";
import { fetchOwnerDashboard } from "../services/analyticsApi";
import { cancelOwnerPreapproval, createOwnerPreapproval } from "../services/visitorApi";

const NAV_LINKS = [
  { label: "My Properties", to: "/resident/flats" },
  { label: "Tenants", to: "/resident/tenant" },
  { label: "Billing", to: "/resident/billing" },
  { label: "Visitors", to: "/resident/visitors" },
  { label: "Documents", to: "/resident/documents" },
  { label: "Analytics", to: "/resident/analytics" },
  { label: "AI Assistant", to: "/resident/ai-assistant" },
];

const BILL_COLORS = ["#14f195", "#ffb347", "#ff6b8b"];
const DOCUMENT_COLORS = ["#00c2ff", "#14f195", "#f59e0b"];
const VISITOR_COLORS = ["#14f195", "#7c8db5", "#f97316", "#ef4444"];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function toMonthKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatMonth(key) {
  if (!key) return "-";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function getLastSixMonthKeys() {
  const cursor = new Date();
  cursor.setDate(1);
  const keys = [];

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1);
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    keys.push(`${date.getFullYear()}-${month}`);
  }

  return keys;
}

function buildMonthlySeries(items, getDate, getValue = () => 1) {
  const baseKeys = getLastSixMonthKeys();
  const seed = new Map(
    baseKeys.map((key) => [key, { key, label: formatMonth(key), value: 0 }])
  );

  for (const item of items) {
    const key = toMonthKey(getDate(item));
    if (!key || !seed.has(key)) continue;
    seed.get(key).value += Number(getValue(item) || 0);
  }

  return baseKeys.map((key) => seed.get(key));
}

function buildTenantWorkflow(properties, ownerDetails) {
  const hasProperty = properties.length > 0;
  const activeTenant = properties.some((item) => item.tenants?.some((tenant) => tenant.isActive));
  const verifiedTenant = properties.some((item) => item.tenants?.some((tenant) => tenant.isVerified));
  const approvedTenant = properties.some((item) => item.tenants?.some((tenant) => tenant.status === "active" || tenant.status === "approved"));
  const activated = activeTenant && verifiedTenant;

  return [
    {
      title: "Owner adds invite",
      detail: hasProperty ? "Invite can be sent from the property panel." : "Assign a property before inviting tenants.",
      status: hasProperty ? "completed" : "pending",
    },
    {
      title: "Tenant signs up",
      detail: approvedTenant ? "Tenant account linked to your property." : "Tenant registration pending.",
      status: approvedTenant ? "completed" : "pending",
    },
    {
      title: "Owner approval",
      detail: ownerDetails?.isVerified ? "Your ownership identity is verified." : "Please complete owner KYC for a smoother approval.",
      status: ownerDetails?.isVerified ? "completed" : "pending",
    },
    {
      title: "Society verification",
      detail: verifiedTenant ? "Society admin can verify the tenant profile." : "Waiting for tenant KYC verification.",
      status: verifiedTenant ? "completed" : "pending",
    },
    {
      title: "Dashboard activation",
      detail: activated ? "Tenant dashboard is active." : "Tenant dashboard activates after approval.",
      status: activated ? "completed" : "pending",
    },
  ];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-[32px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-6">
        <div className="h-4 w-32 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]" />
        <div className="mt-4 h-10 w-2/3 rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))]" />
        <div className="mt-3 h-4 w-1/2 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]" />
        ))}
      </div>
    </div>
  );
}

function SectionCard({ eyebrow, title, description, action, children, className = "" }) {
  return (
    <section className={`surface-card app-surface rounded-[30px] border border-[rgb(var(--app-border-rgb))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">{eyebrow}</p>
          ) : null}
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[rgb(var(--app-text-rgb))]">{title}</h3>
          {description ? <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--app-text-muted-rgb))]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, hint, accent = "primary" }) {
  const accentStyles = {
    primary: "from-[rgb(var(--app-primary-rgb))/0.22] to-transparent text-[rgb(var(--app-primary-rgb))]",
    emerald: "from-emerald-500/20 to-transparent text-emerald-600",
    amber: "from-amber-500/20 to-transparent text-amber-600",
    rose: "from-rose-500/20 to-transparent text-rose-600",
    slate: "from-slate-500/15 to-transparent text-slate-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5 shadow-[0_14px_48px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.1)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accentStyles[accent]} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--app-text-muted-rgb))]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[rgb(var(--app-text-rgb))]">{value}</p>
          {hint ? <p className="mt-2 text-xs text-[rgb(var(--app-text-muted-rgb))]">{hint}</p> : null}
        </div>
        <div className="h-11 w-11 rounded-2xl border border-white/60 bg-white/40 shadow-inner shadow-white/40 backdrop-blur" />
      </div>
    </div>
  );
}

function WorkflowStep({ step, index }) {
  const completed = step.status === "completed";

  return (
    <div className="flex gap-4 rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-[rgb(var(--app-surface-muted-rgb))] text-[rgb(var(--app-text-muted-rgb))]"}`}>
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{step.title}</p>
          <Badge variant={completed ? "success" : "warning"} size="sm">
            {completed ? "Completed" : "Pending"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{step.detail}</p>
      </div>
    </div>
  );
}

function OwnerDashboardProPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [dashboard, setDashboard] = useState(null);
  const [preapprovalForm, setPreapprovalForm] = useState({
    flatId: "",
    visitorName: "",
    phone: "",
    purpose: "",
    visitDate: "",
    expectedArrivalTime: "",
    vehicleNumber: "",
    notes: "",
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      const response = await fetchOwnerDashboard();
      setDashboard(response.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load owner dashboard") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const properties = safeArray(dashboard?.properties);
    if (properties.length) {
      setPreapprovalForm((prev) => ({
        ...prev,
        flatId: prev.flatId || String(properties[0].flatId),
      }));
    }
  }, [dashboard]);

  const properties = safeArray(dashboard?.properties);
  const ownerDetails = dashboard?.ownerDetails || null;
  const parkingSlots = safeArray(dashboard?.parkingSlots);
  const bills = safeArray(dashboard?.billing);
  const complaints = safeArray(dashboard?.complaints);
    const preapprovals = safeArray(dashboard?.preapprovals);
    const visitorHistory = safeArray(dashboard?.visitors);
  const timeline = safeArray(dashboard?.timeline);
    const documents = safeArray(dashboard?.documents);
    const stats = dashboard?.statistics || {
      tenants: 0,
      pending_bills: 0,
      paid_bills: 0,
      total_bill_amount: 0,
      pending_complaints: 0,
      documents: 0,
  };

  const primaryProperty = properties[0] || null;
  const familyMembers = safeArray(dashboard?.familyMembers || dashboard?.family || []);
    const tenantWorkflow = useMemo(() => buildTenantWorkflow([dashboard?.flat].filter(Boolean), dashboard?.owner), [dashboard?.flat, dashboard?.owner]);
    const billTrend = useMemo(() => buildMonthlySeries(safeArray(dashboard?.recent_bills), (item) => item.due_date || item.created_at, (item) => Number(item.amount || 0)), [dashboard?.recent_bills]);
    const complaintTrend = useMemo(() => buildMonthlySeries(safeArray(dashboard?.pending_complaints), (item) => item.created_at), [dashboard?.pending_complaints]);
    const visitorTrend = useMemo(() => buildMonthlySeries(visitorHistory, (item) => item.entry_time), [visitorHistory]);

  const billStatusData = useMemo(
    () => [
      { name: "Paid", value: bills.filter((bill) => bill.status === "paid").length, amount: Number(stats.billTotals?.paid || 0) },
      { name: "Unpaid", value: bills.filter((bill) => bill.status === "unpaid").length, amount: Number(stats.billTotals?.unpaid || 0) },
      { name: "Overdue", value: bills.filter((bill) => bill.due_status === "overdue").length, amount: Number(stats.billTotals?.overdue || 0) },
    ],
    [bills, stats.billTotals]
  );

  const documentStatusData = useMemo(
    () => [
      { name: "Pending", value: documents.filter((document) => document.status === "pending").length },
      { name: "Approved", value: documents.filter((document) => document.status === "approved").length },
      { name: "Rejected", value: documents.filter((document) => document.status === "rejected").length },
    ],
    [documents]
  );

  const occupancyData = useMemo(
    () => [
      { name: "Occupied", value: properties.filter((item) => item.occupancyStatus === "occupied").length },
      { name: "Vacant", value: properties.filter((item) => item.occupancyStatus === "vacant").length },
      { name: "Pending approval", value: properties.filter((item) => item.approvalStatus === "pending").length },
    ],
    [properties]
  );

  const financialHealth = bills.length
    ? Math.round((bills.filter((bill) => bill.status === "paid").length / bills.length) * 100)
    : 0;
  const occupancyRate = properties.length
    ? Math.round((properties.filter((item) => item.occupancyStatus === "occupied").length / properties.length) * 100)
    : 0;
  const documentCoverage = documents.length
    ? Math.round((documents.filter((document) => document.status === "approved").length / documents.length) * 100)
    : ownerDetails?.isVerified
      ? 100
      : 0;
  const flaggedVisitors = preapprovals.filter((item) => item.status !== "approved").length;
  const activityScore = Math.max(100 - stats.overdueBills * 14 - stats.openComplaints * 8 - flaggedVisitors * 6, 42);

  const aiInsights = [
    {
      label: "Financial health",
      value: `${financialHealth}%`,
      detail: bills.length ? `${stats.overdueBills} overdue bills need attention.` : "No bills have been loaded yet.",
      tone: financialHealth >= 80 ? "success" : financialHealth >= 50 ? "warning" : "danger",
    },
    {
      label: "Occupancy score",
      value: `${occupancyRate}%`,
      detail: properties.length ? `${stats.activeTenants} active tenant(s) across ${properties.length} property record(s).` : "No property assignments found.",
      tone: occupancyRate >= 80 ? "success" : occupancyRate >= 50 ? "warning" : "danger",
    },
    {
      label: "KYC coverage",
      value: `${documentCoverage}%`,
      detail: ownerDetails?.isVerified ? "Owner identity is verified." : "Owner verification is still pending.",
      tone: documentCoverage >= 80 ? "success" : "warning",
    },
    {
      label: "Smart risk score",
      value: `${activityScore}%`,
      detail: flaggedVisitors ? `${flaggedVisitors} visitor pre-approval item(s) need review.` : "No major risk signals detected.",
      tone: activityScore >= 80 ? "success" : activityScore >= 60 ? "warning" : "danger",
    },
  ];

  const quickActions = [
    { label: "Create visitor pass", to: "/resident/visitors", tone: "emerald" },
    { label: "Review bills", to: "/resident/billing", tone: "primary" },
    { label: "Open documents", to: "/resident/documents", tone: "slate" },
    { label: "Open AI assistant", to: "/resident/ai-assistant", tone: "amber" },
  ];

  async function handleCreatePreapproval(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!preapprovalForm.flatId || !preapprovalForm.visitorName || !preapprovalForm.purpose || !preapprovalForm.visitDate) {
      setAlert({ type: "error", message: "Flat, visitor name, purpose, and visit date are required" });
      return;
    }

    try {
      setSubmitting(true);
      await createOwnerPreapproval({
        flatId: Number(preapprovalForm.flatId),
        visitorName: preapprovalForm.visitorName,
        phone: preapprovalForm.phone || undefined,
        purpose: preapprovalForm.purpose,
        visitDate: preapprovalForm.visitDate,
        expectedArrivalTime: preapprovalForm.expectedArrivalTime || undefined,
        vehicleNumber: preapprovalForm.vehicleNumber || undefined,
        notes: preapprovalForm.notes || undefined,
      });

      setAlert({ type: "success", message: "Visitor pre-approval created" });
      setPreapprovalForm((prev) => ({
        ...prev,
        visitorName: "",
        phone: "",
        purpose: "",
        visitDate: "",
        expectedArrivalTime: "",
        vehicleNumber: "",
        notes: "",
      }));
      await loadDashboard();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create pre-approval") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelPreapproval(preapprovalId) {
    try {
      await cancelOwnerPreapproval(preapprovalId);
      setAlert({ type: "success", message: "Pre-approval cancelled" });
      await loadDashboard();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not cancel pre-approval") });
    }
  }

  function getTenantSummary(property) {
    if (!property?.tenants?.length) {
      return "No tenant is linked to this property yet.";
    }

    return property.tenants
      .map((tenant) => `${tenant.name}${tenant.isVerified ? " (verified)" : ""}`)
      .join(" • ");
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative space-y-6 overflow-hidden">
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-[rgb(var(--app-primary-rgb))/0.12] blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-32 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <section className="relative overflow-hidden rounded-[34px] border border-[rgb(var(--app-border-rgb))] bg-[linear-gradient(135deg,rgba(8,15,28,0.98),rgba(16,24,40,0.94)_40%,rgba(11,31,47,0.92))] p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,241,149,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(0,194,255,0.12),transparent_34%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.6fr_0.95fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Owner dashboard</p>
              <div className="mt-3">
                <p className="text-sm font-semibold text-emerald-300">{dashboard?.society?.name || "Loading..."}</p>
                <p className="text-xs text-white/50 mt-1">{dashboard?.society?.code ? `Code: ${dashboard.society.code}` : ""}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                  Smart property control, tenant approvals, and AI operations in one place.
                </h1>
              </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
              Manage your ownership profile, keep track of active properties, accelerate tenant workflows, and surface billing, visitor, and complaint intelligence from a single enterprise workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    action.tone === "emerald"
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-50"
                      : action.tone === "amber"
                        ? "border-amber-300/30 bg-amber-300/15 text-amber-50"
                        : action.tone === "slate"
                          ? "border-white/15 bg-white/8 text-white"
                          : "border-cyan-300/30 bg-cyan-400/15 text-cyan-50"
                  }`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-[30px] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Owner profile</p>
                  <h2 className="mt-2 text-xl font-semibold">{dashboard?.owner?.name || "Owner profile unavailable"}</h2>
                  <p className="mt-1 text-sm text-white/70">
                    {dashboard?.society?.name || "Society"} • {dashboard?.flat?.number ? `Flat ${dashboard.flat.number}` : "Flat not assigned"}
                  </p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                {ownerDetails?.profilePhotoUrl ? (
                  <img src={ownerDetails.profilePhotoUrl} alt={ownerDetails?.name || "Owner"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                    {ownerDetails?.name
                      ? ownerDetails.name
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join("")
                      : "OW"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">KYC</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={ownerDetails?.isVerified ? "approved" : "pending"} />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Mode</p>
                <p className="mt-2 font-semibold text-white">Live sync ready</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Occupancy</p>
                <p className="mt-2 font-semibold text-white">{occupancyRate}%</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Health score</p>
                <p className="mt-2 font-semibold text-white">{activityScore}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={stats.properties} hint="Owned property records" accent="primary" />
        <StatCard label="Active tenants" value={stats.activeTenants} hint="Linked and active residents" accent="emerald" />
        <StatCard label="Bill exposure" value={formatCurrency(stats.billTotals?.unpaid || 0)} hint={`${stats.overdueBills} overdue bill(s)`} accent="amber" />
        <StatCard label="Open complaints" value={stats.openComplaints} hint="Needs your attention" accent="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <SectionCard
          eyebrow="Owner profile"
          title="Identity, society, and ownership"
          description="A consolidated view of your ownership footprint, contact details, family members, and documents."
          action={<StatusBadge status={ownerDetails?.isVerified ? "approved" : "pending"} />}
        >
          {ownerDetails ? (
            <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
              <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]">
                    {ownerDetails.profilePhotoUrl ? (
                      <img src={ownerDetails.profilePhotoUrl} alt={ownerDetails.name || "Owner"} className="h-full w-full object-cover" />
                    ) : (
                      <div className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">
                        {ownerDetails.name
                          ? ownerDetails.name
                              .split(" ")
                              .slice(0, 2)
                              .map((part) => part.charAt(0).toUpperCase())
                              .join("")
                          : "OW"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xl font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.name || "Owner"}</h4>
                    <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{ownerDetails.email || "-"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={ownerDetails.accountStatus === "active" ? "success" : "warning"}>{ownerDetails.accountStatus || "pending"}</Badge>
                      <Badge variant={ownerDetails.ownershipStatus === "approved" ? "success" : "warning"}>{ownerDetails.ownershipStatus || "pending"}</Badge>
                      <Badge variant="primary">{ownerDetails.societyCode || ownerDetails.societyName || "Society"}</Badge>
                    </div>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Flat</dt>
                    <dd className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.flatNumber || "-"} {ownerDetails.wing ? `Wing ${ownerDetails.wing}` : ""}</dd>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Society</dt>
                    <dd className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.societyName || "-"}</dd>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Phone</dt>
                    <dd className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.phone || "-"}</dd>
                  </div>
                  <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
                    <dt className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Ownership start</dt>
                    <dd className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{formatDate(ownerDetails.livingStartDate)}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-[rgb(var(--app-text-rgb))]">Family members</h4>
                    <Badge variant="default">{familyMembers.length || 0} listed</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {familyMembers.length ? (
                      familyMembers.map((member, index) => (
                        <div key={`${member?.name || member}-${index}`} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                          <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{member?.name || member?.fullName || member || "Family member"}</p>
                          <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">{member?.relationship || member?.relation || "Household member"}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[rgb(var(--app-border-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))] sm:col-span-2">
                        No family members are synced yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-[rgb(var(--app-text-rgb))]">Digital ownership card</h4>
                    <StatusBadge status={ownerDetails.isVerified ? "approved" : "pending"} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-[rgb(var(--app-text-muted-rgb))] sm:grid-cols-2">
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em]">Profile</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.residentType || "owner"}</p>
                    </div>
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em]">Account status</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{ownerDetails.accountStatus || "active"}</p>
                    </div>
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em]">Documents</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{documents.length} linked</p>
                    </div>
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em]">Parking</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{parkingSlots.length} slot(s)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-[rgb(var(--app-border-rgb))] p-6 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              No owner profile data found.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="AI assistant"
          title="Smart insights and automation"
          description="AI signals for financial risk, ownership verification, occupancy, and operational health."
          action={<Badge variant="primary">AI ready</Badge>}
        >
          <div className="grid gap-3">
            {aiInsights.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{item.label}</p>
                  <Badge variant={item.tone === "success" ? "success" : item.tone === "danger" ? "danger" : item.tone === "warning" ? "warning" : "default"}>{item.value}</Badge>
                </div>
                <p className="mt-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-[rgb(var(--app-text-rgb))]">Recommended automations</h4>
              <Badge variant="default">Live intelligence</Badge>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              <li className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-3">Auto-remind residents about due bills 3 days before payment deadline.</li>
              <li className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-3">Flag visitor requests with unusual timing or repeated vehicle entries.</li>
              <li className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-3">Summarize complaint comments and surface unresolved work orders daily.</li>
            </ul>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Bill total</p>
          <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(stats.billTotals?.total || 0)}</p>
        </div>
        <div className="rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Document coverage</p>
          <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{documentCoverage}%</p>
        </div>
        <div className="rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Parking slots</p>
          <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.parkingSlots}</p>
        </div>
        <div className="rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Pending pre-approvals</p>
          <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{flaggedVisitors}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Analytics"
          title="Revenue, occupancy, and complaint trends"
          description="Interactive charts that show the operational pulse of your property portfolio."
          action={<Badge variant="primary">Realtime analytics</Badge>}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Billing trend</h4>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={billTrend}>
                    <defs>
                      <linearGradient id="billTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14f195" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14f195" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#14f195" fill="url(#billTrendFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Bill status mix</h4>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={billStatusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={4}>
                      {billStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={BILL_COLORS[index % BILL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Complaint trend</h4>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complaintTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#ff6b8b" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Occupancy snapshot</h4>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {occupancyData.map((entry, index) => (
                        <Cell key={entry.name} fill={VISITOR_COLORS[index % VISITOR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Tenant workflow"
          title="Approval pipeline and ownership control"
          description="Track the lifecycle from invite to active tenant access and keep the society verification flow visible."
          action={<Badge variant="default">{tenantWorkflow.filter((step) => step.status === "completed").length}/5 complete</Badge>}
        >
          <div className="space-y-4">
            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Approval progress</p>
                <p className="text-sm font-semibold text-[rgb(var(--app-primary-rgb))]">
                  {Math.round((tenantWorkflow.filter((step) => step.status === "completed").length / tenantWorkflow.length) * 100)}%
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-[rgb(var(--app-primary-rgb))] transition-all"
                  style={{
                    width: `${Math.round((tenantWorkflow.filter((step) => step.status === "completed").length / tenantWorkflow.length) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {tenantWorkflow.map((step, index) => (
              <WorkflowStep key={step.title} step={step} index={index} />
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Properties"
          title="Property management and assignment"
          description="Review occupancy, ownership state, and tenant assignments for each flat under your profile."
          action={<Badge variant="primary">{properties.length} property record(s)</Badge>}
        >
          {properties.length ? (
            <div className="space-y-4">
              {properties.map((property) => (
                <div key={property.flatId} className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4 transition hover:border-[rgb(var(--app-primary-rgb))]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[rgb(var(--app-text-rgb))]">
                        {property.buildingName} • Wing {property.wing} • Flat {property.flatNumber}
                      </p>
                      <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                        Floor {property.floor || "-"} • {property.type || "Flat"} • Society: {property.societyName || ownerDetails?.societyName || "-"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={property.occupancyStatus === "occupied" ? "approved" : "pending"} />
                      <Badge variant={property.approvalStatus === "approved" ? "success" : "warning"}>{property.approvalStatus || "pending"}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Owner</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{property.owner?.name || ownerDetails?.name || "-"}</p>
                      <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">{property.owner?.phone || ownerDetails?.phone || property.owner?.email || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Tenants</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{property.tenants.length}</p>
                      <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">{getTenantSummary(property)}</p>
                    </div>
                    <div className="rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Property status</p>
                      <p className="mt-1 font-semibold text-[rgb(var(--app-text-rgb))]">{property.occupancyStatus || "vacant"}</p>
                      <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">Linked since {formatDate(property.livingStartDate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-[rgb(var(--app-border-rgb))] p-6 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              No property assignments found.
            </div>
          )}
        </SectionCard>

        <SectionCard
          eyebrow="Visitor management"
          title="Pre-approval, QR passes, and suspicious activity review"
          description="Create visitor pre-approvals quickly and monitor the entry history linked to your property."
          action={<Badge variant="primary">{preapprovals.length} pre-approvals</Badge>}
        >
          <form className="grid gap-3 rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4" onSubmit={handleCreatePreapproval}>
            {properties.length > 1 ? (
              <select
                value={preapprovalForm.flatId}
                onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, flatId: event.target.value }))}
                className="ui-input px-3 py-2 text-sm"
              >
                {properties.map((item) => (
                  <option key={item.flatId} value={item.flatId}>
                    {item.buildingName} - {item.wing} - {item.flatNumber}
                  </option>
                ))}
              </select>
            ) : properties.length === 1 ? (
              <div className="rounded-xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-3 py-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                Selected property: {properties[0].buildingName} - {properties[0].wing} - {properties[0].flatNumber}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                No owned property found. Pre-approval is unavailable until a property is assigned.
              </div>
            )}
            <input className="ui-input px-3 py-2 text-sm" type="text" placeholder="Visitor name" value={preapprovalForm.visitorName} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, visitorName: event.target.value }))} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="ui-input px-3 py-2 text-sm" type="text" placeholder="Phone" value={preapprovalForm.phone} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <input className="ui-input px-3 py-2 text-sm" type="text" placeholder="Purpose" value={preapprovalForm.purpose} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, purpose: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="ui-input px-3 py-2 text-sm" type="date" value={preapprovalForm.visitDate} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, visitDate: event.target.value }))} />
              <input className="ui-input px-3 py-2 text-sm" type="time" value={preapprovalForm.expectedArrivalTime} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, expectedArrivalTime: event.target.value }))} />
            </div>
            <input className="ui-input px-3 py-2 text-sm" type="text" placeholder="Vehicle number" value={preapprovalForm.vehicleNumber} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, vehicleNumber: event.target.value }))} />
            <textarea className="ui-input h-24 px-3 py-2 text-sm" placeholder="Notes" value={preapprovalForm.notes} onChange={(event) => setPreapprovalForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <button type="submit" disabled={submitting || !properties.length} className="rounded-2xl bg-[rgb(var(--app-primary-rgb))] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Saving..." : "Create pre-approval"}
            </button>
          </form>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-[rgb(var(--app-text-rgb))]">Pending and approved requests</h4>
              <Badge variant="default">{stats.upcomingPreapprovals} approved</Badge>
            </div>
            {preapprovals.length ? (
              <div className="space-y-3">
                {preapprovals.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{item.visitor_name}</p>
                        <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                          {item.building_name} {item.wing}-{item.flat_number} • {formatDate(item.visit_date)} {item.expected_arrival_time || ""}
                        </p>
                        <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{item.purpose}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === "approved" ? "success" : item.status === "cancelled" ? "danger" : "warning"}>{item.status}</Badge>
                        {item.status === "approved" ? (
                          <button type="button" onClick={() => handleCancelPreapproval(item.id)} className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgb(var(--app-border-rgb))] p-5 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                No visitor pre-approvals yet.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Billing"
          title="Maintenance, payment tracking, and invoice readiness"
          description="Review the financial state of the owner account and prepare future billing workflows."
          action={<Badge variant="primary">{stats.overdueBills} overdue</Badge>}
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Total billed</p>
              <p className="mt-2 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(stats.billTotals?.total || 0)}</p>
            </div>
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Collected</p>
              <p className="mt-2 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(stats.billTotals?.paid || 0)}</p>
            </div>
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Outstanding</p>
              <p className="mt-2 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(stats.billTotals?.unpaid || 0)}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]">
            {bills.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[rgb(var(--app-surface-muted-rgb))] text-[rgb(var(--app-text-muted-rgb))]">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Due</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.slice(0, 8).map((bill) => (
                      <tr key={bill.id} className="border-t border-[rgb(var(--app-border-rgb))]">
                        <td className="px-4 py-3 font-medium text-[rgb(var(--app-text-rgb))]">{bill.title}</td>
                        <td className="px-4 py-3 text-[rgb(var(--app-text-muted-rgb))]">{formatDate(bill.due_date)}</td>
                        <td className="px-4 py-3 text-[rgb(var(--app-text-muted-rgb))]">{formatCurrency(bill.total_amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={bill.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-sm text-[rgb(var(--app-text-muted-rgb))]">No bills found.</div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Documents and parking"
          title="Ownership documents, KYC, and vehicle assignments"
          description="Track document approvals and the parking footprint connected to your property."
          action={<Badge variant="default">{documents.length} documents</Badge>}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Document status</h4>
                <Badge variant="primary">{stats.documentsPending} pending</Badge>
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={documentStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={4}>
                      {documentStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={DOCUMENT_COLORS[index % DOCUMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Vehicle assignments</h4>
              <div className="mt-4 space-y-3">
                {parkingSlots.length ? (
                  parkingSlots.slice(0, 4).map((slot) => (
                    <div key={slot.id} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[rgb(var(--app-text-rgb))]">Slot {slot.slotNumber || slot.slot_number || "-"}</p>
                        <StatusBadge status={slot.status} />
                      </div>
                      <p className="mt-2 text-[rgb(var(--app-text-muted-rgb))]">{slot.buildingName || slot.flatNumber || "Property link"}</p>
                      <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">{slot.ownerName || ownerDetails?.name || "Owner"}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[rgb(var(--app-border-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                    No parking assignments found.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {documents.length ? (
              documents.slice(0, 5).map((document) => (
                <div key={document.id} className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{document.document_type}</p>
                      <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">Created {formatDateTime(document.created_at)}</p>
                    </div>
                    <StatusBadge status={document.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgb(var(--app-border-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                No ownership documents available.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          eyebrow="Complaint analytics"
          title="Complaint, visitor, and operational pulse"
          description="A concise view of resolution pressure and movement in the estate."
          action={<Badge variant="default">{timeline.length} events</Badge>}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Visitors</h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={visitorTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#00c2ff" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[26px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <h4 className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">Operational load</h4>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Bills", value: bills.length }, { name: "Complaints", value: complaints.length }, { name: "Pre-approvals", value: preapprovals.length }]}> 
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#14f195" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Activity timeline"
          title="Recent owner events"
          description="Track the latest bill, complaint, visitor, property, and system actions."
          action={<Badge variant="primary">Real-time ready</Badge>}
        >
          <div className="space-y-3">
            {timeline.length ? (
              timeline.slice(0, 8).map((item, index) => (
                <div key={`${item.activity_type}-${index}`} className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{item.title}</p>
                      <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{item.detail || "-"}</p>
                    </div>
                    <Badge variant="default">{item.activity_type}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--app-text-muted-rgb))]">{formatDateTime(item.happened_at)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgb(var(--app-border-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                No activities available yet.
              </div>
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard
          eyebrow="Visitor intelligence"
          title="Pre-approved history"
          description="The latest approved or reviewed visitor entries tied to your property."
        >
          <div className="space-y-3">
            {visitorHistory.length ? (
              visitorHistory.slice(0, 6).map((entry) => (
                <div key={entry.id} className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{entry.visitor_name}</p>
                    <Badge variant={entry.status === "exited" ? "success" : "warning"}>{entry.status}</Badge>
                  </div>
                  <p className="mt-2 text-[rgb(var(--app-text-muted-rgb))]">{entry.building_name} {entry.wing}-{entry.flat_number}</p>
                  <p className="mt-1 text-[rgb(var(--app-text-muted-rgb))]">Entry: {formatDateTime(entry.entry_time)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgb(var(--app-border-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                No visitor history available.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Notifications"
          title="Smart alerts and shortcuts"
          description="Stay ahead of due dates, approvals, and operational issues from the dashboard itself."
        >
          <div className="space-y-3">
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              <p className="font-semibold text-[rgb(var(--app-text-rgb))]">Bill reminder automation</p>
              <p className="mt-1">Trigger reminders automatically before due dates and escalate overdue accounts.</p>
            </div>
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              <p className="font-semibold text-[rgb(var(--app-text-rgb))]">Suspicious visitor detection</p>
              <p className="mt-1">Flag repetitive or unusual visitor patterns for security review.</p>
            </div>
            <div className="rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              <p className="font-semibold text-[rgb(var(--app-text-rgb))]">Complaint summarizer</p>
              <p className="mt-1">Condense complaint threads into actions the next time you open the dashboard.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Next actions"
          title="Operational shortcuts"
          description="A quick path into the most used resident workflows."
        >
          <div className="grid gap-3">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex items-center justify-between rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition hover:border-[rgb(var(--app-primary-rgb))] hover:bg-[rgb(var(--app-surface-rgb))]"
              >
                <span>{item.label}</span>
                <span className="text-[11px] uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Open</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-2xl bg-[rgb(var(--app-primary-rgb))] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" to="/resident/billing">
          Review billing
        </Link>
        <Link className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition hover:border-[rgb(var(--app-primary-rgb))]" to="/resident/visitors">
          Manage visitors
        </Link>
        <Link className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition hover:border-[rgb(var(--app-primary-rgb))]" to="/resident/documents">
          View documents
        </Link>
        <Link className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition hover:border-[rgb(var(--app-primary-rgb))]" to="/resident/ai-assistant">
          Open AI assistant
        </Link>
      </div>
    </div>
  );
}

export default OwnerDashboardProPage;
