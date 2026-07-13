import { useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantVisitors() {
  const [visitors, setVisitors] = useState([
    { id: 1, name: "Rahul Sharma", relation: "Friend", date: "2024-01-15", status: "Approved", qrCode: "QR-001" },
    { id: 2, name: "Priya Patel", relation: "Sister", date: "2024-01-16", status: "Pending", qrCode: null },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Visitors
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your visitor passes and entries
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Visitor
        </button>
      </div>

      {showAddForm && (
        <Motion.div
          className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Visitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Visitor Name"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="text"
              placeholder="Relation"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="date"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="time"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Generate Pass
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visitors.map((visitor) => (
          <Motion.div
            key={visitor.id}
            className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
            style={{ borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{visitor.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{visitor.relation}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                visitor.status === "Approved"
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
              }`}>
                {visitor.status}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Date: {visitor.date}</p>
            <div className="flex gap-3">
              {visitor.status === "Pending" && (
                <>
                  <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm">
                    Approve
                  </button>
                  <button className="flex-1 px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition text-sm">
                    Reject
                  </button>
                </>
              )}
              {visitor.qrCode && (
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                  View QR Code
                </button>
              )}
              <button className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm">
                History
              </button>
            </div>
          </Motion.div>
        ))}
      </div>
    </div>
  );
}

export default TenantVisitors;
