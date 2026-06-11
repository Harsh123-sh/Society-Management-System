import { securityGuardProfile } from "../data/navigation";
import { blacklist, shiftLogs } from "../data/securityData";

function BlacklistPage() {
  return (
    <div className="security-page security-settings-page space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🚫 Blacklist</h1>
          <p className="mt-2 text-slate-600">Restricted entry individuals</p>
        </div>
        <button className="px-6 py-3 bg-red-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-red-600 transition-colors">
          ➕ Add to Blacklist
        </button>
      </div>

      {/* Blacklist Table */}
      <div className="rounded-2xl bg-white shadow-sm border-2 border-red-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-red-50 border-b-2 border-red-300">
                <th className="px-6 py-4 text-left text-sm font-bold text-red-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-red-900">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-red-900">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-red-900">
                  Date Added
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-red-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-200">
              {blacklist.map((entry) => (
                <tr key={entry.id} className="hover:bg-red-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-red-900 text-lg">{entry.name}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{entry.phone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      {entry.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{entry.dateAdded}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 rounded">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-xs font-bold text-red-700 hover:bg-red-100 rounded">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Messages */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg bg-red-100 border-2 border-red-500 p-4">
          <p className="font-bold text-red-900">🚨 Important</p>
          <p className="text-sm text-red-700 mt-2">
            Alert all entry gates about blacklisted individuals.
          </p>
        </div>
        <div className="rounded-lg bg-yellow-100 border-2 border-yellow-500 p-4">
          <p className="font-bold text-yellow-900">⚠️ Warning</p>
          <p className="text-sm text-yellow-700 mt-2">
            If suspicious person detected, immediately report to management.
          </p>
        </div>
      </div>
    </div>
  );
}

function ShiftLogsPage() {
  return (
    <div className="security-page security-settings-page space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🕒 Shift Logs</h1>
        <p className="mt-2 text-slate-600">Guard shift records and notes</p>
      </div>

      {/* Shift Logs Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                  Guard Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                  Shift Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                  Visitors
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                  Deliveries
                </th>
                <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shiftLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{log.guardName}</td>
                  <td className="px-6 py-4">
                    <p className="text-slate-700 font-semibold">
                      {log.shiftStart} - {log.shiftEnd}
                    </p>
                    <p className="text-xs text-slate-500">{log.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                      {log.visitors}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                      {log.deliveries}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export & Download */}
      <div className="rounded-lg bg-slate-100 p-6 border border-slate-300">
        <h3 className="font-bold text-slate-900 mb-4">📥 Download Records</h3>
        <div className="flex gap-4 flex-wrap">
          <button className="px-6 py-3 bg-blue-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-blue-600 transition-colors">
            📄 PDF Report
          </button>
          <button className="px-6 py-3 bg-green-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-green-600 transition-colors">
            📊 Excel Export
          </button>
          <button className="px-6 py-3 theme-surface text-[var(--text-main)] font-bold rounded-lg hover:theme-surface transition-colors">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <div className="security-page security-settings-page space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">👤 Guard Profile</h1>
        <p className="mt-2 text-slate-600">Personal and professional information</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 p-8 shadow-sm">
        <div className="flex items-center gap-6">
          <span className="text-8xl">{securityGuardProfile.avatar}</span>
          <div>
            <h2 className="text-4xl font-bold text-slate-900">
              {securityGuardProfile.name}
            </h2>
            <p className="text-lg text-slate-700 mt-2">
              {securityGuardProfile.role}
            </p>
            <p className="text-sm text-slate-600 mt-1">ID: {securityGuardProfile.empId}</p>
          </div>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">📋 Personal Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Full Name</p>
              <p className="font-bold text-slate-900">{securityGuardProfile.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Employee ID</p>
              <p className="font-bold text-slate-900">{securityGuardProfile.empId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Phone</p>
              <p className="font-bold text-slate-900">{securityGuardProfile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Email</p>
              <p className="font-bold text-slate-900">{securityGuardProfile.email}</p>
            </div>
          </div>
        </div>

        {/* Shift Information */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-4">🕒 Shift Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Current Shift</p>
              <p className="font-bold text-slate-900">
                {securityGuardProfile.shiftStart} - {securityGuardProfile.shiftEnd}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <span className="inline-flex rounded-full bg-green-100 px-3 py-1 font-bold text-green-700">
                ● On Duty
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600">Experience</p>
              <p className="font-bold text-slate-900">5 years</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-lg bg-white p-6 shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-900">⚙️ Settings</h3>

        <button className="w-full px-6 py-3 bg-blue-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-blue-600 transition-colors">
          ✏️ Edit Profile
        </button>

        <button className="w-full px-6 py-3 bg-slate-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-slate-600 transition-colors">
          🔐 Change Password
        </button>

        <button className="w-full px-6 py-3 bg-red-500 text-[var(--text-main)] font-bold rounded-lg hover:bg-red-600 transition-colors">
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

export { BlacklistPage, ShiftLogsPage, ProfilePage };
