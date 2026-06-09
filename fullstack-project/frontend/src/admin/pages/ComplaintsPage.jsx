import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";

function ComplaintsPage() {
  const [complaints] = useState([
    {
      id: 1,
      resident: "Rajesh Kumar",
      flat: "A-101",
      issue: "Water leakage in bathroom",
      status: "pending",
      priority: "high",
      date: "2024-01-15",
      description: "Water is leaking from the ceiling",
    },
    {
      id: 2,
      resident: "Priya Singh",
      flat: "B-205",
      issue: "Electricity issue",
      status: "in_progress",
      priority: "critical",
      date: "2024-01-14",
      description: "Frequent power cuts affecting flat",
    },
    {
      id: 3,
      resident: "Amit Patel",
      flat: "C-310",
      issue: "Noise complaint",
      status: "resolved",
      priority: "medium",
      date: "2024-01-13",
      description: "Excessive noise from adjoining flat",
    },
    {
      id: 4,
      resident: "Neha Desai",
      flat: "D-412",
      issue: "Maintenance issue",
      status: "pending",
      priority: "low",
      date: "2024-01-12",
      description: "Common area needs maintenance",
    },
    {
      id: 5,
      resident: "Vikram Sharma",
      flat: "E-505",
      issue: "Water supply",
      status: "in_progress",
      priority: "high",
      date: "2024-01-11",
      description: "Low water pressure in morning",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const filteredComplaints = complaints.filter(
    (complaint) =>
      (filterStatus === "all" || complaint.status === filterStatus) &&
      (filterPriority === "all" || complaint.priority === filterPriority)
  );

  const stats = [
    {
      label: "Total",
      value: complaints.length,
      color: "from-slate-500 to-slate-600",
    },
    {
      label: "Pending",
      value: complaints.filter((c) => c.status === "pending").length,
      color: "from-yellow-500 to-yellow-600",
    },
    {
      label: "In Progress",
      value: complaints.filter((c) => c.status === "in_progress").length,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Resolved",
      value: complaints.filter((c) => c.status === "resolved").length,
      color: "from-green-500 to-green-600",
    },
  ];

  const columns = [
    { key: "resident", label: "Resident" },
    { key: "flat", label: "Flat" },
    { key: "issue", label: "Issue" },
    {
      key: "priority",
      label: "Priority",
      render: (priority) => {
        const colors = {
          critical: "bg-red-100 text-red-800",
          high: "bg-orange-100 text-orange-800",
          medium: "bg-blue-100 text-blue-800",
          low: "bg-slate-100 text-slate-800",
        };
        return (
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[priority]}`}>
            {priority}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (status) => <Badge status={status} />,
    },
    { key: "date", label: "Date" },
  ];

  const actions = [
    {
      key: "assign",
      label: "👤",
      className: "bg-blue-100 hover:bg-blue-200 text-blue-700",
      onClick: (row) => console.log("Assign:", row),
    },
    {
      key: "update",
      label: "✏️",
      className: "bg-amber-100 hover:bg-amber-200 text-amber-700",
      onClick: (row) => console.log("Update:", row),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚠️ Complaints</h1>
          <p className="mt-2 text-slate-600">Track and resolve resident complaints</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-[var(--text-main)] hover:shadow-lg transition-all">
          ➕ New Complaint
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-5 shadow-sm text-[var(--text-main)]`}
          >
            <p className="text-sm opacity-90">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
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
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <input
          type="search"
          placeholder="Search complaints..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredComplaints} actions={actions} />

      {/* Priority Alert */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Critical & High Priority */}
        <div className="rounded-2xl bg-red-50 p-6 border border-red-200">
          <h3 className="text-lg font-bold text-red-900">🔴 Critical & High Priority</h3>
          <div className="mt-4 space-y-3">
            {filteredComplaints
              .filter((c) => c.priority === "critical" || c.priority === "high")
              .map((complaint) => (
                <div
                  key={complaint.id}
                  className="rounded-lg bg-white p-4 border-l-4 border-red-500"
                >
                  <p className="font-semibold text-slate-900">
                    {complaint.resident} ({complaint.flat})
                  </p>
                  <p className="text-sm text-slate-600 mt-1">{complaint.issue}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-blue-50 p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900">📋 Recent Activity</h3>
          <div className="mt-4 space-y-3">
            {filteredComplaints.slice(0, 5).map((complaint) => (
              <div key={complaint.id} className="flex items-start gap-3 border-b border-blue-200 pb-3 last:border-0">
                <span className="text-2xl">
                  {complaint.status === "pending"
                    ? "⏳"
                    : complaint.status === "in_progress"
                      ? "⚙️"
                      : "✅"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {complaint.issue}
                  </p>
                  <p className="text-xs text-slate-600">{complaint.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintsPage;
