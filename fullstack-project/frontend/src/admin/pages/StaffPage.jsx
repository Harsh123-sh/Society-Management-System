import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";
import { staffData } from "../data/moduleData";

function StaffPage() {
  const [staff, setStaff] = useState(staffData);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredStaff = staff.filter(
    (member) => filterStatus === "all" || member.status === filterStatus
  );

  const stats = [
    {
      label: "Total Staff",
      value: staff.length,
      icon: "👷",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "On Duty",
      value: staff.filter((s) => s.status === "active").length,
      icon: "✓",
      color: "from-green-500 to-green-600",
    },
    {
      label: "Off Duty",
      value: staff.filter((s) => s.status === "inactive").length,
      icon: "⏸",
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Average Attendance",
      value: "92%",
      icon: "📊",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const columns = [
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "contact", label: "Contact" },
    { key: "joinDate", label: "Join Date" },
    {
      key: "status",
      label: "Status",
      render: (status) => <Badge status={status} />,
    },
    {
      key: "attendance",
      label: "Attendance",
      render: (attendance) => <span className="font-semibold text-green-600">{attendance}%</span>,
    },
  ];

  const actions = [
    {
      key: "edit",
      label: "✏️",
      className: "bg-blue-100 hover:bg-blue-200 text-blue-700",
      onClick: (row) => console.log("Edit:", row),
    },
    {
      key: "attendance",
      label: "📋",
      className: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      onClick: (row) => console.log("Attendance:", row),
    },
    {
      key: "delete",
      label: "🗑️",
      className: "bg-red-100 hover:bg-red-200 text-red-700",
      onClick: (row) => console.log("Delete:", row),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">👷 Staff Management</h1>
          <p className="mt-2 text-slate-600">Manage security, maintenance, and support staff</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-[var(--text-main)] hover:shadow-lg transition-all">
          ➕ Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl bg-gradient-to-br ${stat.color} p-5 shadow-sm text-[var(--text-main)]`}
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option>All Roles</option>
          <option>Security Guard</option>
          <option>Maintenance</option>
          <option>Cleaner</option>
          <option>Manager</option>
        </select>

        <input
          type="search"
          placeholder="Search staff by name or contact..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredStaff} actions={actions} />

      {/* Staff Shifts & Schedule */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Shift */}
        <div className="rounded-2xl bg-blue-50 p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900">📅 Today's Shift</h3>
          
          <div className="mt-4 space-y-3">
            {filteredStaff
              .filter((s) => s.status === "active")
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg bg-white p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-600">{member.role}</p>
                    <p className="text-xs text-slate-500 mt-1">9:00 AM - 5:00 PM</p>
                  </div>
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    ✓ On Duty
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Staff by Role */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">👥 Staff by Role</h3>
          
          <div className="mt-4 space-y-4">
            {[
              { role: "Security Guard", count: 4, icon: "🔒" },
              { role: "Maintenance", count: 2, icon: "🔧" },
              { role: "Cleaner", count: 2, icon: "🧹" },
              { role: "Manager", count: 1, icon: "📋" },
            ].map((roleData) => (
              <div key={roleData.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{roleData.icon}</span>
                  <p className="font-semibold text-slate-900">{roleData.role}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${(roleData.count / 4) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-900 w-8 text-right">
                    {roleData.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="rounded-2xl bg-orange-50 p-6 border border-orange-200">
        <h3 className="text-lg font-bold text-orange-900">
          📋 Pending Leave Requests
        </h3>
        
        <div className="mt-4 space-y-3">
          {[
            {
              name: "Rajesh Kumar",
              from: "2024-02-15",
              to: "2024-02-17",
              reason: "Medical",
            },
            {
              name: "Priya Singh",
              from: "2024-02-20",
              to: "2024-02-25",
              reason: "Vacation",
            },
          ].map((request, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-white p-4"
            >
              <div>
                <p className="font-semibold text-slate-900">{request.name}</p>
                <p className="text-sm text-slate-600">
                  {new Date(request.from).toLocaleDateString()} -{" "}
                  {new Date(request.to).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">{request.reason}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-green-600 transition-colors">
                  ✓ Approve
                </button>
                <button className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-red-600 transition-colors">
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default StaffPage;
