import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";
import { visitorLogsData } from "../data/moduleData";

function VisitorsPage() {
  const [visitors, setVisitors] = useState(visitorLogsData);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredVisitors = visitors.filter(
    (visitor) =>
      filterStatus === "all" || visitor.status === filterStatus
  );

  const stats = [
    { label: "Today", value: "24", icon: "🚗", color: "from-blue-500 to-blue-600" },
    { label: "This Week", value: "156", icon: "📊", color: "from-green-500 to-green-600" },
    { label: "This Month", value: "487", icon: "📈", color: "from-purple-500 to-purple-600" },
    { label: "Pending Approval", value: "3", icon: "⏳", color: "from-orange-500 to-orange-600" },
  ];

  const columns = [
    { key: "visitorName", label: "Visitor Name" },
    { key: "residentFlat", label: "Flat" },
    { key: "purpose", label: "Purpose" },
    {
      key: "entryTime",
      label: "Entry Time",
      render: (time) => new Date(time).toLocaleTimeString(),
    },
    {
      key: "exitTime",
      label: "Exit Time",
      render: (time) => (time ? new Date(time).toLocaleTimeString() : "-"),
    },
    {
      key: "status",
      label: "Status",
      render: (status) => <Badge status={status} />,
    },
  ];

  const actions = [
    {
      key: "approve",
      label: "✓",
      className: "bg-green-100 hover:bg-green-200 text-green-700",
      onClick: (row) => console.log("Approve:", row),
    },
    {
      key: "reject",
      label: "✕",
      className: "bg-red-100 hover:bg-red-200 text-red-700",
      onClick: (row) => console.log("Reject:", row),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🚗 Visitor Management</h1>
          <p className="mt-2 text-slate-600">Track visitor entries and approvals</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          ➕ Add Visitor
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-5 shadow-sm text-white`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <span className="text-4xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="exited">Exited</option>
          <option value="pending">Pending</option>
        </select>

        <input
          type="search"
          placeholder="Search by visitor name, flat, or purpose..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredVisitors} actions={actions} />

      {/* Pending Approvals Alert */}
      <div className="rounded-2xl bg-orange-50 p-6 border border-orange-200">
        <h3 className="text-lg font-bold text-orange-900">
          ⏳ Pending Visitor Approvals
        </h3>
        <p className="mt-1 text-sm text-orange-700">
          {visitors.filter((v) => v.status === "pending").length} visitors awaiting approval
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visitors
            .filter((v) => v.status === "pending")
            .map((visitor) => (
              <div key={visitor.id} className="rounded-lg bg-white p-4 border-l-4 border-orange-500">
                <p className="font-semibold text-slate-900">{visitor.visitorName}</p>
                <p className="text-sm text-slate-600 mt-1">
                  📍 Flat {visitor.residentFlat}
                </p>
                <p className="text-sm text-slate-600">
                  🎯 {visitor.purpose}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(visitor.entryTime).toLocaleString()}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="flex-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors">
                    ✓ Approve
                  </button>
                  <button className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">📊 Peak Visitor Hours</h3>
        
        <div className="mt-6 flex items-end justify-between gap-2 h-40">
          {[
            { time: "6 AM", count: 4 },
            { time: "9 AM", count: 18 },
            { time: "12 PM", count: 12 },
            { time: "3 PM", count: 15 },
            { time: "6 PM", count: 22 },
            { time: "9 PM", count: 8 },
          ].map((hour) => (
            <div key={hour.time} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-green-500 to-green-400"
                style={{ height: `${(hour.count / 22) * 140}px` }}
              ></div>
              <span className="text-xs font-semibold text-slate-600">{hour.time}</span>
              <span className="text-xs text-slate-500">{hour.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VisitorsPage;
