import { useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantFamilyMembers() {
  const [members, setMembers] = useState([
    { id: 1, name: "John Doe", relation: "Self", email: "john@example.com", phone: "9876543210", status: "Active" },
    { id: 2, name: "Jane Doe", relation: "Spouse", email: "jane@example.com", phone: "9876543211", status: "Active" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.relation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this family member?")) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Family Members
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your family members and their access
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Member
        </button>
      </div>

      {showAddForm && (
        <Motion.div
          className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Family Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="text"
              placeholder="Relation (Spouse, Child, etc.)"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="email"
              placeholder="Email Address"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="tel"
              placeholder="Phone Number"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Save
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </Motion.div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-slate-800" style={{ borderColor: "var(--border)" }}>
        <div className="p-6 border-b dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
          <input
            type="text"
            placeholder="Search family members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Relation</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition" style={{ borderColor: "var(--border)" }}>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.relation}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{member.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => setEditingId(member.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TenantFamilyMembers;
