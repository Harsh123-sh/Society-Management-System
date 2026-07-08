import React, { useState, useEffect } from "react";
import Overview from "./Overview";
import Societies from "./Societies";
import CreateSociety from "./CreateSociety";
import ChairmanApprovals from "./ChairmanApprovals";
import SecretaryApprovals from "./SecretaryApprovals";
import Users from "./Users";
import Plans from "./Plans";
import Billing from "./Billing";
import Support from "./Support";
import Health from "./Health";
import AuditLogs from "./AuditLogs";
import Settings from "./Settings";
import Sidebar from "../../components/superadmin/Sidebar";
import Topbar from "../../components/superadmin/Topbar";

const TABS = [
  { key: "overview", label: "Dashboard Overview" },
  { key: "societies", label: "Society Management" },
  { key: "create", label: "Create Society" },
  { key: "chairman", label: "Chairman Approvals" },
  { key: "secretary", label: "Secretary Approvals" },
  { key: "users", label: "User Management" },
  { key: "plans", label: "Subscription Plans" },
  { key: "billing", label: "Billing & Revenue" },
  { key: "support", label: "Support Tickets" },
  { key: "health", label: "System Health" },
  { key: "audit", label: "Audit Logs" },
  { key: "settings", label: "Settings" },
];

export default function SuperAdminLayout() {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeTab = TABS.find((tab) => tab.key === active) || TABS[0];

  useEffect(() => {
    function fromHash() {
      const h = window.location.hash.replace(/^#/, "");
      if (h && TABS.find(t => t.key === h)) setActive(h);
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  function renderActive() {
    switch (active) {
      case "overview":
        return <Overview />;
      case "societies":
        return <Societies />;
      case "create":
        return <CreateSociety onCreated={() => setActive("societies")} />;
      case "chairman":
        return <ChairmanApprovals />;
      case "secretary":
        return <SecretaryApprovals />;
      case "users":
        return <Users />;
      case "plans":
        return <Plans />;
      case "billing":
        return <Billing />;
      case "support":
        return <Support />;
      case "health":
        return <Health />;
      case "audit":
        return <AuditLogs />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  }

  const [collapsed, setCollapsed] = React.useState(false);
  function changeTab(key) {
    setActive(key);
    setMobileOpen(false);
    window.location.hash = key;
  }

  return (
    <div className="sa-shell">
      <Sidebar
        activeKey={active}
        onChange={changeTab}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        search={query}
        onSearch={setQuery}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="sa-content">
        <Topbar title={activeTab.label} query={query} onQuery={setQuery} onOpenMenu={() => setMobileOpen(true)} />
        <main className="sa-main">
          <SuperAdminErrorBoundary resetKey={active}>
            {renderActive()}
          </SuperAdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}

class SuperAdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="sa-panel sa-error-panel">
          <h2>Unable to load this Super Admin page</h2>
          <p>Please refresh the data or switch to another module.</p>
        </section>
      );
    }
    return this.props.children;
  }
}
