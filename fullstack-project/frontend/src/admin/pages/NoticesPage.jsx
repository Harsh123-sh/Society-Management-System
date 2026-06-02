import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";
import { noticesData } from "../data/moduleData";

function NoticesPage() {
  const [notices, setNotices] = useState(noticesData);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredNotices = notices.filter(
    (notice) => filterStatus === "all" || notice.status === filterStatus
  );

  const stats = [
    {
      label: "Total Notices",
      value: notices.length,
      icon: "📢",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Active",
      value: notices.filter((n) => n.status === "active").length,
      icon: "✓",
      color: "from-green-500 to-green-600",
    },
    {
      label: "Archived",
      value: notices.filter((n) => n.status === "archived").length,
      icon: "📦",
      color: "from-slate-500 to-slate-600",
    },
    {
      label: "Total Views",
      value: notices.reduce((sum, n) => sum + n.views, 0),
      icon: "👁️",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const columns = [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    {
      key: "date",
      label: "Date",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: "views",
      label: "Views",
      render: (views) => <span className="font-bold text-slate-600">{views}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (status) => <Badge status={status} />,
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
          <h1 className="text-3xl font-bold text-slate-900">📢 Notices</h1>
          <p className="mt-2 text-slate-600">Create and manage society notices</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all"
        >
          ✨ Create Notice
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

      {/* Create Notice Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 rounded-2xl">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl mx-4">
            <h2 className="text-2xl font-bold text-slate-900">Create New Notice</h2>
            
            <form className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Notice title..."
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Notice content..."
                  rows="5"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Category
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
                    <option>Maintenance</option>
                    <option>Event</option>
                    <option>Payment</option>
                    <option>Security</option>
                    <option>General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Recipient
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
                    <option>All Residents</option>
                    <option>Owners Only</option>
                    <option>Tenants Only</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 font-semibold text-white hover:shadow-lg transition-all"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>

        <input
          type="search"
          placeholder="Search notices..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredNotices} actions={actions} />

      {/* Recent Notices Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">📰 Recent Notices</h3>
        
        {filteredNotices.slice(0, 3).map((notice) => (
          <div
            key={notice.id}
            className="rounded-lg border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-slate-900">{notice.title}</h4>
                <p className="mt-2 text-slate-600">{notice.content}</p>
                <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                  <span>📅 {new Date(notice.date).toLocaleDateString()}</span>
                  <span>✍️ By {notice.author}</span>
                  <span>👁️ {notice.views} views</span>
                </div>
              </div>
              <div className="text-right">
                <Badge status={notice.status} />
                <div className="mt-3 flex gap-2">
                  <button className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors">
                    Edit
                  </button>
                  <button className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NoticesPage;
