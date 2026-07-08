import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/authApi";
import "./society-admin-dashboard.css";

const MotionArticle = motion.article;

const kpis = [
  { label: "Total Residents", value: "1,248", trend: "+3.2%", note: "verified profiles", icon: "users", tone: "violet", to: "users" },
  { label: "Occupied Flats", value: "392", trend: "+1.8%", note: "active homes", icon: "building", tone: "blue", to: "flats" },
  { label: "Vacant Flats", value: "28", trend: "-6.1%", note: "available units", icon: "home", tone: "cyan", to: "flats" },
  { label: "Pending Approvals", value: "0", trend: "Live", note: "need action", icon: "check", tone: "amber", to: "approvals" },
  { label: "Monthly Collection", value: "INR 84.6L", trend: "+18%", note: "month to date", icon: "rupee", tone: "green", to: "billing" },
  { label: "Pending Dues", value: "INR 12.8L", trend: "-8%", note: "48 flats", icon: "receipt", tone: "rose", to: "billing" },
  { label: "Open Complaints", value: "42", trend: "-11%", note: "8 urgent", icon: "message", tone: "violet", to: "complaints" },
  { label: "Active Staff", value: "64", trend: "+4", note: "on duty today", icon: "staff", tone: "blue", to: "staff" },
];

const activities = [
  ["10:48 AM", "New Resident Registered", "A-1204 profile was verified by society office."],
  ["10:22 AM", "Maintenance Bill Generated", "June maintenance cycle is ready for collection."],
  ["09:52 AM", "Complaint Resolved", "Lift inspection complaint closed for Tower B."],
  ["09:30 AM", "Notice Published", "Water shutdown notice sent to Towers B and C."],
  ["09:12 AM", "Staff Attendance", "Morning shift attendance synced successfully."],
  ["08:54 AM", "Visitor Approved", "Guest request approved for flat B-0802."],
];

const quickActions = [
  { label: "Add Resident", icon: "users", to: "users" },
  { label: "Add Flat", icon: "home", to: "flats" },
  { label: "Generate Bill", icon: "rupee", to: "billing" },
  { label: "Create Notice", icon: "message", to: "notices" },
  { label: "Approve Requests", icon: "check", to: "approvals" },
  { label: "View Reports", icon: "receipt", to: "analytics" },
];

function Icon({ name, className = "sad-icon" }) {
  const paths = {
    users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a8 8 0 0 1 16 0M19 8v4m2-2h-4",
    building: "M4 20V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v15M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M9 20v-5h6v5",
    home: "M3 11 12 4l9 7v9H3v-9Zm6 9v-6h6v6",
    check: "M9 12l2 2 4-5M4 5h16v14H4V5Zm4 0V3m8 2V3",
    rupee: "M12 3h7M12 8h7M5 3h6.5a4.5 4.5 0 0 1 0 9H8l7 9M5 8h14",
    receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
    message: "M5 5h14v10H8l-3 3V5Zm7 3v3m0 3h.01",
    staff: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0M18 7h3m-1.5-1.5v3",
    eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    close: "M18 6 6 18M6 6l12 12",
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] || paths.ai} />
    </svg>
  );
}

function SocietyAdminDashboard({ role = "chairman" }) {
  const navigate = useNavigate();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const activeRole = role === "secretary" ? "secretary" : "chairman";
  const basePath = activeRole === "secretary" ? "/secretary" : "/admin";
  const liveKpis = useMemo(() => kpis.map((item) => (
    item.label === "Pending Approvals"
      ? { ...item, value: pendingApprovals.length.toLocaleString("en-IN"), trend: pendingApprovals.length ? "Review" : "Clear" }
      : item
  )), [pendingApprovals.length]);
  const approvalRows = useMemo(() => pendingApprovals.slice(0, 5).map((item) => ({
    type: String(item.request_type || item.approval_type || item.role || "Approval").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    count: "1 pending",
    owner: item.name || item.email || "Pending user",
    age: item.requested_date || item.created_at ? new Date(item.requested_date || item.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "New",
  })), [pendingApprovals]);

  useEffect(() => {
    let mounted = true;
    api.get("/approvals/pending")
      .then(({ data }) => {
        if (mounted) setPendingApprovals(data?.approvals || data?.data || []);
      })
      .catch(() => {
        if (mounted) setPendingApprovals([]);
      });
    return () => { mounted = false; };
  }, []);

  function openModule(to) {
    if (!to) return;
    if (to.startsWith("dashboard#")) {
      navigate(`${basePath}/${to}`);
      return;
    }
    navigate(`${basePath}/${to}`);
  }

  return (
    <div className={`society-admin-dashboard sad-${activeRole}`}>
      <section className="sad-kpi-grid" aria-label="Executive KPI summary">
        {liveKpis.map((item, index) => (
          <MotionArticle
            key={item.label}
            className={`sad-card sad-kpi sad-kpi--${item.tone}`}
            role="button"
            tabIndex={0}
            onClick={() => openModule(item.to)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") openModule(item.to);
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.025 }}
          >
            <div className="sad-kpi-icon"><Icon name={item.icon} /></div>
            <div className="sad-kpi-body">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small><b>{item.trend}</b> {item.note}</small>
            </div>
          </MotionArticle>
        ))}
      </section>

      <section className="sad-command-grid">
        <section className="sad-card sad-panel sad-panel--approvals" id="approvals">
          <div className="sad-panel-head">
            <div>
              <span>Action required</span>
              <h2>Pending Approvals</h2>
            </div>
            <button type="button" onClick={() => openModule("users")}>Review All</button>
          </div>

          <div className="sad-approval-list">
            {approvalRows.length ? approvalRows.map((item) => (
              <article key={item.type}>
                <div>
                  <strong>{item.type}</strong>
                  <span>{item.count} / {item.owner} / {item.age}</span>
                </div>
                <div className="sad-row-actions">
                  <button type="button" className="sad-ghost-button" onClick={() => openModule("approvals")}><Icon name="eye" />View</button>
                  <button type="button" onClick={() => openModule("approvals")}>Approve</button>
                  <button type="button" className="sad-danger-button" onClick={() => openModule("approvals")}><Icon name="close" />Reject</button>
                </div>
              </article>
            )) : <article><div><strong>No pending approvals.</strong><span>All same-society approval requests are clear.</span></div></article>}
          </div>
        </section>

        <section className="sad-card sad-panel sad-panel--activity">
          <div className="sad-panel-head">
            <div>
              <span>Latest updates</span>
              <h2>Recent Activities</h2>
            </div>
          </div>
          <div className="sad-activity-list">
            {activities.map(([time, title, text]) => (
              <article key={`${time}-${title}`}>
                <span>{time}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="sad-card sad-panel sad-panel--quick">
          <div className="sad-panel-head">
            <div>
              <span>Shortcuts</span>
              <h2>Quick Actions</h2>
            </div>
          </div>
          <div className="sad-quick-grid">
            {quickActions.map((item) => (
              <button key={item.label} type="button" onClick={() => openModule(item.to)}>
                <Icon name={item.icon} />
                {item.label}
              </button>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

export default SocietyAdminDashboard;
