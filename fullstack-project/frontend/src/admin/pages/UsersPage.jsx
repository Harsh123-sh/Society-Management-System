import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";
import { usersData } from "../data/moduleData";

function UsersPage() {
  const [users, setUsers] = useState(usersData);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.flat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (role) => (
        <Badge
          status={role === "Owner" ? "active" : "pending"}
          variant={role === "Owner" ? "active" : "pending"}
        />
      ),
    },
    { key: "flat", label: "Flat" },
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
          <h1 className="text-3xl font-bold text-slate-900">👥 User Management</h1>
          <p className="mt-2 text-slate-600">Manage residents and tenants</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          ➕ Add User
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <input
          type="text"
          placeholder="Search by name, email, or flat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
        <select className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option>All Roles</option>
          <option>Owner</option>
          <option>Tenant</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredUsers} actions={actions} />
    </div>
  );
}

export default UsersPage;
