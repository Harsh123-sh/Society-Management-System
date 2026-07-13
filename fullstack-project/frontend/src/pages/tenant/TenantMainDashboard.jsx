import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";

function StatCard({ icon, label, value, status, onClick, loading = false }) {
  return (
    <Motion.button
      onClick={onClick}
      type="button"
      className="group relative flex flex-col gap-3 rounded-2xl border bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-lg dark:bg-slate-800 dark:hover:border-blue-500"
      style={{ borderColor: "var(--border)" }}
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-xl dark:bg-blue-900">
            {icon}
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {label}
            </p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200" :
          status === "overdue" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200" :
          status === "open" ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200" :
          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
        }`}>
          {status}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          {loading ? "..." : value}
        </p>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Click to view details →</span>
      </div>
    </Motion.button>
  );
}

function TenantMainDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    pendingBills: { count: 0, status: "pending", amount: "₹0" },
    visitorsToday: { count: 0, status: "active" },
    openComplaints: { count: 0, status: "open" },
    upcomingEvents: { count: 0, status: "active" },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls
        // For now, using mock data
        setDashboardData({
          pendingBills: { count: "₹15,240", status: "pending", amount: "Due on 25th" },
          visitorsToday: { count: 2, status: "active" },
          openComplaints: { count: 1, status: "open" },
          upcomingEvents: { count: 3, status: "active" },
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome Back!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Here's your apartment status and quick actions
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon="💰"
          label="Pending Bills"
          value={dashboardData.pendingBills.count}
          status={dashboardData.pendingBills.status}
          onClick={() => navigate("../billing")}
          loading={loading}
        />
        <StatCard
          icon="👥"
          label="Visitors Today"
          value={dashboardData.visitorsToday.count}
          status={dashboardData.visitorsToday.status}
          onClick={() => navigate("../visitors")}
          loading={loading}
        />
        <StatCard
          icon="⚠️"
          label="Open Complaints"
          value={dashboardData.openComplaints.count}
          status={dashboardData.openComplaints.status}
          onClick={() => navigate("../complaints")}
          loading={loading}
        />
        <StatCard
          icon="📅"
          label="Upcoming Events"
          value={dashboardData.upcomingEvents.count}
          status={dashboardData.upcomingEvents.status}
          onClick={() => navigate("../community")}
          loading={loading}
        />
      </div>

      <Motion.div
        className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
        style={{ borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <button
            onClick={() => navigate("../billing")}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-2xl">💳</span>
            <span className="text-xs font-medium text-center">Pay Bill</span>
          </button>
          <button
            onClick={() => navigate("../visitors")}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-2xl">🎫</span>
            <span className="text-xs font-medium text-center">Guest Pass</span>
          </button>
          <button
            onClick={() => navigate("../complaints")}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-medium text-center">Complaint</span>
          </button>
          <button
            onClick={() => navigate("../amenities")}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-2xl">🎯</span>
            <span className="text-xs font-medium text-center">Book Amenity</span>
          </button>
          <button
            onClick={() => navigate("../community")}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-2xl">📢</span>
            <span className="text-xs font-medium text-center">Community</span>
          </button>
        </div>
      </Motion.div>

      <Motion.div
        className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
        style={{ borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Maintenance Bill Generated</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today at 10:30 AM</p>
            </div>
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">₹5,000</span>
          </div>
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Guest Approved</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Yesterday at 3:00 PM</p>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Complaint Status Updated</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">2 days ago</p>
            </div>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">In Progress</span>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}

export default TenantMainDashboard;
