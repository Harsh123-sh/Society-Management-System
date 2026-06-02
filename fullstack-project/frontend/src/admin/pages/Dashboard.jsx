import DashboardCards from "../components/DashboardCards";
import FinancialOverview from "../components/FinancialOverview";
import ComplaintAnalytics from "../components/ComplaintAnalytics";
import VisitorAnalytics from "../components/VisitorAnalytics";
import {
  NoticeActivitySection,
  StaffOverviewSection,
  AIInsightsSection,
} from "../components/NoticeAndStaff";

function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Welcome back! Here's your society overview.
          </p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          📥 Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div>
        <DashboardCards />
      </div>

      {/* Financial & Complaints Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FinancialOverview />
        </div>
        <div>
          <AIInsightsSection />
        </div>
      </div>

      {/* Complaints & Visitors Grid */}
      <div>
        <ComplaintAnalytics />
      </div>

      {/* Visitor Analytics */}
      <div>
        <VisitorAnalytics />
      </div>

      {/* Notices & Staff Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <NoticeActivitySection />
        <StaffOverviewSection />
      </div>
    </div>
  );
}

export default Dashboard;
