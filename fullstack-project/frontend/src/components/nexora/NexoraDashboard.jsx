import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./nexora-dashboard.css";

const Motion = motion;

const chartData = [
  { name: "Jan", revenue: 12.4, collection: 82, occupancy: 84, complaints: 22, visitors: 58, growth: 4 },
  { name: "Feb", revenue: 13.8, collection: 84, occupancy: 86, complaints: 18, visitors: 64, growth: 6 },
  { name: "Mar", revenue: 15.2, collection: 87, occupancy: 88, complaints: 16, visitors: 72, growth: 9 },
  { name: "Apr", revenue: 16.1, collection: 89, occupancy: 91, complaints: 14, visitors: 69, growth: 11 },
  { name: "May", revenue: 17.8, collection: 91, occupancy: 92, complaints: 11, visitors: 78, growth: 14 },
  { name: "Jun", revenue: 19.4, collection: 94, occupancy: 94, complaints: 8, visitors: 86, growth: 18 },
];

const roleCopy = {
  chairman: {
    tone: "Chairman executive command",
    title: "Nexora Chairman Dashboard",
    subtitle: "Executive Society Overview",
    society: "Skyline Heights CHS",
    heroMetric: "94",
    heroLabel: "Community health",
    sections: ["Executive", "Residents", "Properties", "Finance", "Approvals", "AI"],
    quick: ["Approve Resident", "Generate Bill", "Schedule Meeting", "Ask Nexora AI"],
    kpis: [
      { label: "Total Residents", value: "1,248", delta: "+36", helper: "Verified resident profiles", icon: "TR", tone: "blue" },
      { label: "Total Flats", value: "420", delta: "6 wings", helper: "Mapped properties", icon: "TF", tone: "violet" },
      { label: "Active Families", value: "386", delta: "+14", helper: "Owner and tenant families", icon: "AF", tone: "emerald" },
      { label: "Occupancy Rate", value: "92%", delta: "+4%", helper: "34 vacant flats tracked", icon: "OR", tone: "cyan" },
      { label: "Pending Approvals", value: "27", delta: "High", helper: "Resident, tenant, vendor, budget", icon: "PA", tone: "amber" },
      { label: "Total Collection", value: "₹84.6L", delta: "+18%", helper: "Quarter-to-date collection", icon: "TC", tone: "emerald" },
      { label: "Emergency Alerts", value: "3", delta: "Live", helper: "Lift, water, security alerts", icon: "EA", tone: "rose" },
      { label: "Open Complaints", value: "42", delta: "-11%", helper: "14 escalated to vendors", icon: "OC", tone: "amber" },
    ],
    timelineTitle: "Recent Activities",
    queueTitle: "Pending Approvals",
    tasks: [
      "Tower C tenant onboarding needs document approval",
      "Budget approval queued for lift modernization",
      "Emergency water pump alert assigned to vendor",
      "Annual meeting agenda draft ready for chairman review",
      "AI detected repeated leakage complaints in Wing B",
    ],
    ai: [
      ["Pending Dues Prediction", "₹12.8L is likely to remain unpaid after the 25th without targeted reminders."],
      ["Vacancy Prediction", "Wing D vacancy may rise by 6% next month due to three planned move-outs."],
      ["Complaint Trends", "Water leakage and lift downtime form 61% of urgent complaints this week."],
      ["Collection Forecast", "Quarter-end collection can cross ₹1.1Cr if 18 high-value accounts are followed up."],
      ["Community Health Score", "Resident sentiment is strong, but vendor SLA delays are reducing trust."],
      ["Natural Language Query", "Ask: Which flats have unpaid dues and active complaints in the same family profile?"],
    ],
  },
  secretary: {
    tone: "Operations cockpit",
    title: "Secretary Operations Dashboard",
    subtitle: "Daily Operations Overview",
    society: "Green Valley Society",
    heroMetric: "96",
    heroLabel: "Operations score",
    sections: ["Residents", "Visitors", "Maintenance", "Notices", "Staff", "AI"],
    quick: ["Add Resident", "Create Notice", "Assign Complaint", "Generate Report"],
    kpis: [
      { label: "Total Residents", value: "486", delta: "+12", helper: "Verified active profiles", icon: "TR", tone: "blue" },
      { label: "Occupied Flats", value: "92%", delta: "+3%", helper: "212 homes tracked", icon: "OF", tone: "emerald" },
      { label: "Monthly Collection", value: "18.4L", delta: "+12%", helper: "Auto reminders live", icon: "MC", tone: "violet" },
      { label: "Pending Dues", value: "3.2L", delta: "-9%", helper: "Escalation list ready", icon: "PD", tone: "amber" },
      { label: "Active Complaints", value: "18", delta: "-16%", helper: "6 assigned today", icon: "AC", tone: "rose" },
      { label: "Visitors Today", value: "74", delta: "Live", helper: "Gate entries synced", icon: "VT", tone: "cyan" },
      { label: "Staff Attendance", value: "96%", delta: "+4%", helper: "Shift compliance", icon: "SA", tone: "emerald" },
      { label: "AI Insights", value: "9", delta: "New", helper: "Operational suggestions", icon: "AI", tone: "blue" },
    ],
    timelineTitle: "Daily Activity Timeline",
    queueTitle: "Maintenance Requests",
    tasks: [
      "12 tenant KYC packets pending verification",
      "Maintenance reminders scheduled for Tower B",
      "Garden vendor contract expires this week",
      "Parking requests need slot allocation",
      "Visitor log anomaly flagged at Gate 2",
    ],
    ai: [
      ["Society Health Score", "Operational score is high, with visitor flow and staff attendance above target."],
      ["Financial Predictions", "Reminder automation should recover 38% of pending dues this week."],
      ["Complaint Analysis", "Most open tickets are maintenance-linked and can be grouped by vendor."],
      ["Maintenance Forecast", "Water pump checks should be scheduled before weekend demand peaks."],
      ["AI Recommendations", "Prioritize KYC verification and visitor queue cleanup before evening rush."],
    ],
  },
  accountant: {
    tone: "Finance command",
    title: "Accountant Finance Dashboard",
    subtitle: "Finance Operations Overview",
    society: "Nexora Finance Center",
    heroMetric: "88",
    heroLabel: "Budget health",
    sections: ["Collections", "Expenses", "Budgets", "Invoices", "Reports", "AI"],
    quick: ["Create Invoice", "Record Expense", "Export Ledger", "Send Reminder"],
    kpis: [
      { label: "Collections", value: "22.6L", delta: "+14%", helper: "This billing cycle", icon: "CO", tone: "blue" },
      { label: "Outstanding", value: "3.2L", delta: "-9%", helper: "42 unpaid invoices", icon: "OU", tone: "amber" },
      { label: "Expenses", value: "8.9L", delta: "+2%", helper: "Within monthly budget", icon: "EX", tone: "rose" },
      { label: "Budget Health", value: "88%", delta: "Stable", helper: "AI forecast confidence", icon: "BH", tone: "emerald" },
    ],
    tasks: ["42 defaulter reminders queued", "Generator invoice needs matching", "Q3 budget draft ready", "Bank reconciliation at 96%"],
    ai: [["Financial Predictions", "Expected month-end collections are trending above target."]],
  },
  security: {
    tone: "Gate command",
    title: "Security Command Dashboard",
    subtitle: "Gate Operations Overview",
    society: "Gate Command Center",
    heroMetric: "24",
    heroLabel: "Risk score",
    sections: ["Visitors", "QR Entry", "Deliveries", "Vehicles", "Emergency", "AI"],
    quick: ["Scan QR", "Check In", "Register Vehicle", "Emergency Alert"],
    kpis: [
      { label: "Active Visitors", value: "38", delta: "Live", helper: "Inside premises", icon: "AV", tone: "blue" },
      { label: "QR Entries", value: "126", delta: "+21%", helper: "Validated passes", icon: "QR", tone: "emerald" },
      { label: "Deliveries", value: "31", delta: "+8", helper: "Awaiting handover", icon: "DL", tone: "amber" },
      { label: "Risk Score", value: "24", delta: "Low", helper: "AI visitor analysis", icon: "RS", tone: "violet" },
    ],
    tasks: ["Verify high-risk walk-in", "Medical delivery priority", "Gate 2 patrol due in 6 min", "Vehicle DL01KD9921 inside"],
    ai: [["Visitor Pattern Analysis", "Evening visitor volume is expected to rise near Gate 1."]],
  },
  owner: {
    tone: "Resident workspace",
    title: "Owner Portfolio Dashboard",
    subtitle: "Owner Portfolio Overview",
    society: "Owner Workspace",
    heroMetric: "2",
    heroLabel: "Properties",
    sections: ["Properties", "Payments", "Visitors", "Complaints", "Documents", "AI"],
    quick: ["Pay Dues", "Issue Gate Pass", "Raise Complaint", "View Documents"],
    kpis: [
      { label: "Properties", value: "2", delta: "Active", helper: "A-1204 and B-802", icon: "PR", tone: "blue" },
      { label: "Tenant Status", value: "OK", delta: "Clear", helper: "KYC complete", icon: "TS", tone: "emerald" },
      { label: "Dues", value: "18K", delta: "Due", helper: "Next bill in 7 days", icon: "DU", tone: "amber" },
      { label: "Documents", value: "24", delta: "+3", helper: "Receipts and leases", icon: "DO", tone: "violet" },
    ],
    tasks: ["Lease renewal due next month", "Parking slot request awaiting approval", "Guest pass active until 8 PM", "Water bill receipt available"],
    ai: [["Smart Recommendations", "Renew lease documents before the next billing cycle."]],
  },
  tenant: {
    tone: "Living dashboard",
    title: "Tenant Living Dashboard",
    subtitle: "Resident Living Overview",
    society: "Tenant Home",
    heroMetric: "Paid",
    heroLabel: "Bill status",
    sections: ["Bills", "Visitors", "Complaints", "Amenities", "Community", "AI"],
    quick: ["Pay Bill", "Book Amenity", "Create Visitor Pass", "Raise Ticket"],
    kpis: [
      { label: "Bill Status", value: "Paid", delta: "Current", helper: "No overdue amount", icon: "BS", tone: "emerald" },
      { label: "Visitor Passes", value: "4", delta: "+1", helper: "This week", icon: "VP", tone: "blue" },
      { label: "Complaints", value: "1", delta: "Open", helper: "Plumbing follow-up", icon: "CO", tone: "amber" },
      { label: "Community", value: "12", delta: "New", helper: "Events and threads", icon: "CM", tone: "violet" },
    ],
    tasks: ["Gym slot available at 6:30 PM", "Courier at Gate 1", "Plumbing ticket update pending", "Community hall vote closes today"],
    ai: [["Smart Recommendations", "Book the available gym slot before peak hours."]],
  },
  staff: {
    tone: "Work cockpit",
    title: "Staff Work Dashboard",
    subtitle: "Staff Work Overview",
    society: "Field Service Workspace",
    heroMetric: "95",
    heroLabel: "Quality score",
    sections: ["Attendance", "Tasks", "Maintenance", "Inventory", "Proof", "AI"],
    quick: ["Check In", "Start Task", "Upload Proof", "Ask AI"],
    kpis: [
      { label: "Tasks Today", value: "14", delta: "+3", helper: "6 completed", icon: "TT", tone: "blue" },
      { label: "Shift Hours", value: "6.5", delta: "Live", helper: "Checked in", icon: "SH", tone: "emerald" },
      { label: "Quality Score", value: "95%", delta: "+4%", helper: "Verified work", icon: "QS", tone: "violet" },
      { label: "Salary Cycle", value: "Ready", delta: "June", helper: "Payroll locked", icon: "SC", tone: "amber" },
    ],
    tasks: ["Lift L2 inspection due", "Pump P3 noise detected", "Tower B water shutdown", "Upload before/after proof"],
    ai: [["Maintenance Forecast", "Complete lift inspection before the evening rush."]],
  },
  superAdmin: {
    tone: "Platform command",
    title: "Super Admin SaaS Dashboard",
    subtitle: "Platform Overview",
    society: "Nexora Platform",
    heroMetric: "99.98",
    heroLabel: "Uptime",
    sections: ["Societies", "Revenue", "Users", "Approvals", "Audit", "AI"],
    quick: ["Create Society", "Review Approval", "Open Audit Logs", "Refresh Platform"],
    kpis: [
      { label: "Societies", value: "128", delta: "+12%", helper: "Tenant workspaces", icon: "SO", tone: "blue" },
      { label: "MRR", value: "8.02L", delta: "+18%", helper: "Subscription revenue", icon: "MR", tone: "emerald" },
      { label: "Users", value: "18.6K", delta: "+9%", helper: "Across platform", icon: "US", tone: "violet" },
      { label: "Uptime", value: "99.98%", delta: "Live", helper: "API and database", icon: "UP", tone: "cyan" },
    ],
    tasks: ["3 enterprise trials need follow-up", "Mumbai cluster scaling at 18:00", "6 platform approvals pending", "Webhook retries below threshold"],
    ai: [["AI Risk", "Platform risk remains low with stable infrastructure signals."]],
  },
};

const donutData = [
  { name: "Collected", value: 74 },
  { name: "Pending", value: 18 },
  { name: "Overdue", value: 8 },
];

const heatMap = [
  [42, 58, 72, 64, 86, 76, 92],
  [28, 48, 54, 61, 73, 82, 68],
  [36, 62, 79, 88, 57, 66, 74],
  [52, 44, 69, 83, 91, 63, 71],
];

const palette = ["#2563EB", "#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

const chairmanModules = [
  {
    title: "Residents Management",
    meta: "Directory, family members, owners, tenants",
    features: ["Add Resident", "Move In", "Move Out", "Approval Workflow", "Import Excel", "AI Resident Insights"],
    accent: "blue",
  },
  {
    title: "Flats & Properties",
    meta: "Wings, floors, ownership, occupancy",
    features: ["Wing Management", "Vacant Flats", "Owner Mapping", "Property History", "Transfer Requests", "AI Occupancy Prediction"],
    accent: "violet",
  },
  {
    title: "Visitor Management",
    meta: "Gate entries, QR passes, deliveries",
    features: ["Visitor Entry", "QR Visitor Pass", "Pre Approved Visitors", "Delivery Tracking", "Security Verification", "AI Visitor Monitoring"],
    accent: "cyan",
  },
  {
    title: "Finance Management",
    meta: "Income, expense, budgets, reports",
    features: ["Cash Flow", "Outstanding Dues", "Payment Tracking", "Revenue Analytics", "Collection Reports", "AI Financial Insights"],
    accent: "emerald",
  },
  {
    title: "Bills & Invoices",
    meta: "Maintenance, water, parking, receipts",
    features: ["Generate Bills", "Bulk Billing", "Payment Reminders", "Late Fees", "Payment History", "AI Due Prediction"],
    accent: "amber",
  },
  {
    title: "Complaints",
    meta: "Assignment, escalation, resolution",
    features: ["Raise Complaint", "Track Status", "Complaint Timeline", "Escalation System", "Resolution Tracking", "AI Resolution Suggestions"],
    accent: "rose",
  },
  {
    title: "Meetings & Notices",
    meta: "Agenda, attendance, minutes, broadcast",
    features: ["Schedule Meeting", "Meeting Agenda", "Attendance Tracking", "Create Notice", "WhatsApp Notification", "AI Meeting Summary"],
    accent: "blue",
  },
  {
    title: "Documents & Settings",
    meta: "Secure storage, roles, audit logs",
    features: ["Secure Storage", "Version History", "Expiry Alerts", "Role Permissions", "Audit Logs", "Backup Settings"],
    accent: "violet",
  },
];

const chairmanApprovals = [
  { label: "Resident Approval", count: 8, sla: "4 urgent" },
  { label: "Tenant Approval", count: 6, sla: "KYC pending" },
  { label: "Vendor Approval", count: 3, sla: "Insurance review" },
  { label: "Document Approval", count: 5, sla: "Legal queue" },
  { label: "Renovation Approval", count: 2, sla: "Committee vote" },
  { label: "Budget Approval", count: 3, sla: "₹18.4L value" },
];

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getConfig(role) {
  return roleCopy[role] || roleCopy.superAdmin;
}

function MiniTrend({ index = 0 }) {
  return (
    <div className="nx-mini-trend" aria-hidden="true">
      {[38, 54, 46, 72, 62, 88].map((height, itemIndex) => (
        <span key={`${index}-${itemIndex}`} style={{ height: `${height + itemIndex * 2}%` }} />
      ))}
    </div>
  );
}

function Panel({ title, eyebrow, children, className = "", action = "Export" }) {
  return (
    <Motion.section
      className={cx("nx-panel", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
    >
      <div className="nx-panel-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <button type="button">{action}</button>
      </div>
      {children}
    </Motion.section>
  );
}

function KpiCard({ item, index }) {
  return (
    <Motion.article
      className={cx("nx-kpi", `nx-kpi--${item.tone || "blue"}`)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay: index * 0.035 }}
      whileHover={{ y: -5 }}
    >
      <div className="nx-kpi-top">
        <span className="nx-kpi-icon">{item.icon}</span>
        <b>{item.delta}</b>
      </div>
      <strong>{item.value}</strong>
      <p>{item.label}</p>
      <small>{item.helper}</small>
      <MiniTrend index={index} />
    </Motion.article>
  );
}

function ActivityTimeline({ items }) {
  return (
    <div className="nx-timeline">
      {items.map((item, index) => (
        <article key={item}>
          <span>{`${index + 9}:15`}</span>
          <p>{item}</p>
          <em>{["Review", "Live", "Pending", "Approved", "AI"][index % 5]}</em>
        </article>
      ))}
    </div>
  );
}

function EnterpriseTable({ role }) {
  const rows = getConfig(role).tasks.map((task, index) => ({
    name: task,
    owner: ["AI", "Secretary", "Finance", "Security", "Committee"][index % 5],
    status: ["Review", "Live", "Pending", "Approved", "Forecast"][index % 5],
    priority: ["High", "Normal", "Medium", "Low", "Smart"][index % 5],
  }));

  return (
    <div className="nx-table-wrap">
      <div className="nx-table-tools">
        <input placeholder="Search records..." />
        <select defaultValue="all">
          <option value="all">All status</option>
          <option>Pending</option>
          <option>Approved</option>
        </select>
        <button type="button">Smart Filter</button>
      </div>
      <table className="nx-table">
        <thead>
          <tr><th>Record</th><th>Owner</th><th>Status</th><th>Priority</th><th>Action</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.owner}</td>
              <td><span className="nx-status">{row.status}</span></td>
              <td>{row.priority}</td>
              <td><button type="button">Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="nx-pagination"><span>Page 1 of 4</span><button>Previous</button><button>Next</button></div>
    </div>
  );
}

function SuperAdminChairmanApprovals() {
  return (
    <section className="nx-operations-grid" id="pending-chairman-approvals">
      <Panel eyebrow="Chairman onboarding" title="Pending Chairman Approvals" action="Review">
        <div className="nx-recommendations">
          <article>
            <b>Chairman registration control</b>
            <p>Review OTP-verified Chairman registrations, approve active access, or reject requests with a reason.</p>
            <button type="button" onClick={() => { window.location.href = "/super-admin/chairman-registrations"; }}>
              Open Chairman Approvals
            </button>
          </article>
        </div>
      </Panel>
      <Panel eyebrow="Secure flow" title="Society activation gate" action="Manage">
        <div className="nx-recommendations">
          <article>
            <b>Society stays pending until approval</b>
            <p>Approval activates the Chairman account, links it to the society, and marks the society active.</p>
          </article>
        </div>
      </Panel>
    </section>
  );
}

function AiPanel({ config }) {
  const aiItems = config.ai?.length ? config.ai : roleCopy.superAdmin.ai;
  return (
    <section className="nx-ai-command" id="ai">
      <div className="nx-ai-orb" aria-hidden="true"><span /></div>
      <div>
        <span className="nx-eyebrow">Nexora AI Panel</span>
        <h2>Intelligence that reads the society before you do</h2>
        <p>Predictive governance, finance, complaints, maintenance, visitor movement, and recommendations in one premium command panel.</p>
      </div>
      <div className="nx-ai-list">
        {aiItems.map(([title, text], index) => (
          <Motion.article key={title} whileHover={{ y: -4 }} transition={{ duration: 0.18 }}>
            <span>{`AI-${index + 1}`}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <button type="button">Review insight</button>
          </Motion.article>
        ))}
      </div>
    </section>
  );
}

function ChairmanWorkflowSuite() {
  return (
    <section className="nx-workflow-suite" id="residents">
      <div className="nx-suite-head">
        <div>
          <span className="nx-eyebrow">Full workflow management</span>
          <h2>Enterprise workflows</h2>
        </div>
        <div className="nx-suite-langs">
          <span>English</span>
          <span>Hindi</span>
          <span>Gujarati</span>
        </div>
      </div>
      <div className="nx-module-grid">
        {chairmanModules.map((module) => (
          <Motion.article key={module.title} className={`nx-module-card nx-kpi--${module.accent}`} whileHover={{ y: -5 }}>
            <div>
              <span className="nx-module-dot" />
              <h3>{module.title}</h3>
              <p>{module.meta}</p>
            </div>
            <div className="nx-feature-cloud">
              {module.features.map((feature) => <span key={feature}>{feature}</span>)}
            </div>
          </Motion.article>
        ))}
      </div>
    </section>
  );
}

function ChairmanDecisionGrid() {
  return (
    <section className="nx-chairman-decisions" id="approvals">
      <Panel eyebrow="Approval intelligence" title="Governance queue by risk and SLA" action="Bulk approve">
        <div className="nx-approval-grid">
          {chairmanApprovals.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
              <p>{item.sla}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel eyebrow="Nexora AI recommendations" title="Suggested chairman actions" action="Ask AI">
        <div className="nx-recommendations">
          {[
            ["Recover dues faster", "Send personalized reminders to 18 high-value overdue flats before Friday."],
            ["Reduce complaints", "Group Wing B leakage tickets into one vendor work order with SLA penalty."],
            ["Improve occupancy", "Pre-approve owner transfer documentation for 4 flats to avoid vacancy drift."],
            ["Governance hygiene", "Schedule budget approval with audit attachments before the monthly meeting."],
          ].map(([title, text]) => (
            <article key={title}>
              <b>{title}</b>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function MobilePreview({ config, role }) {
  return (
    <section className="nx-mobile-experience" aria-label={`${config.title} mobile dashboard`}>
      <div>
        <span className="nx-eyebrow">{role === "secretary" ? "Mobile Secretary Dashboard" : "Mobile Operations Dashboard"}</span>
        <h2>Native app experience</h2>
        <p>Swipeable KPI cards, mobile charts, bottom navigation, floating action button, and a compact AI assistant are optimized for daily field use.</p>
      </div>
      <div className="nx-phone">
        <div className="nx-phone-top"><span /> <b>Nexora</b> <i /></div>
        <div className="nx-phone-score">
          <strong>{config.heroMetric}</strong>
          <span>{config.heroLabel}</span>
        </div>
        <div className="nx-phone-kpis">
          {config.kpis.slice(0, 3).map((item) => <article key={item.label}><b>{item.value}</b><span>{item.label}</span></article>)}
        </div>
        <div className="nx-phone-chart">{chartData.map((item) => <span key={item.name} style={{ height: `${item.collection}%` }} />)}</div>
        <div className="nx-phone-ai">AI Assistant: {config.tasks[0]}</div>
      </div>
    </section>
  );
}

function NexoraDashboard({ role = "superAdmin" }) {
  const config = getConfig(role);
  const health = Number(config.heroMetric) || 94;
  const isSecretary = role === "secretary";
  const isChairman = role === "chairman";
  const isSuperAdmin = role === "superAdmin";

  return (
    <div className={cx("nx-dashboard", isSecretary ? "nx-dashboard--secretary" : "nx-dashboard--standard")}>
      <section className="nx-hero" id="executive">
        <div className="nx-hero-copy">
          <span className="nx-eyebrow">{config.tone}</span>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
        <div className="nx-hero-card">
          <div className="nx-hero-score">
            <span>{config.heroLabel}</span>
            <strong>{config.heroMetric}</strong>
          </div>
          <div className="nx-quick-strip">
            {config.quick.map((item) => <button key={item} type="button">{item}</button>)}
          </div>
        </div>
      </section>

      <nav className="nx-section-nav" aria-label={`${config.title} navigation`}>
        {config.sections.map((item, index) => (
          <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className={index === 0 ? "is-active" : ""}>{item}</a>
        ))}
      </nav>

      <section className="nx-kpi-row" aria-label="KPI cards">
        {config.kpis.map((item, index) => <KpiCard key={item.label} item={item} index={index} />)}
      </section>

      <section className="nx-main-grid" id="analytics-center">
        <Panel eyebrow={isChairman ? "Collection trend" : "Revenue trend"} title={isChairman ? "Collection trend and forecast" : "Financial pulse"} className="nx-wide">
          <ResponsiveContainer width="100%" height={286}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`nxRevenue-${role}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--nx-grid)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--nx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--nx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--nx-card-solid)", border: "1px solid var(--nx-border)", borderRadius: 14, color: "var(--nx-text)" }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fill={`url(#nxRevenue-${role})`} />
              <Area type="monotone" dataKey="growth" stroke="#7C3AED" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel eyebrow={isChairman ? "Occupancy overview" : "Progress ring"} title={isChairman ? "Occupancy overview" : "Society health"}>
          <ResponsiveContainer width="100%" height={242}>
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: "health", value: health, fill: "#7C3AED" }]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={18} background={{ fill: "var(--nx-track)" }} />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="nx-health-score"><strong>{config.heroMetric}</strong><span>{config.heroLabel}</span></div>
        </Panel>

        <Panel eyebrow={isChairman ? "Owner vs tenant ratio" : "Collection status"} title={isChairman ? "Owner vs tenant ratio" : "Collection mix"}>
          <ResponsiveContainer width="100%" height={242}>
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {donutData.map((item, index) => <Cell key={item.name} fill={palette[index]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel eyebrow="Complaint analytics" title={isChairman ? "Complaint analytics" : "Resolution velocity"}>
          <ResponsiveContainer width="100%" height={242}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--nx-grid)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--nx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--nx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="complaints" fill="#7C3AED" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel eyebrow={isChairman ? "Emergency and visitor signals" : "Visitor analytics"} title={isChairman ? "Emergency alert heat map" : "Movement heat map"}>
          <div className="nx-heatmap">
            {heatMap.flatMap((row, rowIndex) => row.map((value, colIndex) => (
              <span key={`${rowIndex}-${colIndex}`} style={{ opacity: 0.22 + value / 135 }} title={`${value}% activity`} />
            )))}
          </div>
        </Panel>
      </section>

      {isChairman ? <ChairmanWorkflowSuite /> : null}
      {isSuperAdmin ? <SuperAdminChairmanApprovals /> : null}

      <section className="nx-operations-grid" id={isSecretary ? "maintenance" : "approval-center"}>
        <Panel eyebrow="Activity section" title={config.timelineTitle} action="Filter">
          <ActivityTimeline items={config.tasks} />
        </Panel>
        <Panel eyebrow={isSecretary ? "Operations queue" : "Governance queue"} title={config.queueTitle} action="View all">
          <EnterpriseTable role={role} />
        </Panel>
      </section>

      {isChairman ? <ChairmanDecisionGrid /> : null}

      <AiPanel config={config} />

      <section className="nx-action-center">
        <div>
          <span className="nx-eyebrow">Quick action center</span>
          <h2>{isSecretary ? "Daily operations without friction" : "Executive decisions without delay"}</h2>
        </div>
        <div>{config.quick.map((item) => <button key={item} type="button">{item}</button>)}</div>
      </section>

      <MobilePreview config={config} role={role} />

      <nav className="nx-mobile-nav" aria-label="Mobile bottom navigation">
        {["Dashboard", "Residents", "Finance", "Approvals", "More"].map((item) => <button key={item} type="button">{item}</button>)}
      </nav>
      <button className="nx-fab" type="button" aria-label="Create quick action">+</button>
    </div>
  );
}

export default NexoraDashboard;

