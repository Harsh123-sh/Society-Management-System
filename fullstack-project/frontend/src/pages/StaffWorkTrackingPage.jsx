import { useMemo } from "react";
import { TASK_STATUS, loadStaffTasks } from "../utils/staffDashboardData";

function StaffWorkTrackingPage() {
  const tasks = loadStaffTasks();

  const dailyLog = useMemo(
    () =>
      tasks.map((task) => ({
        id: task.id,
        job: task.taskName,
        flat: task.flat,
        status: task.status,
        date: new Date(task.createdAt).toLocaleDateString(),
      })),
    [tasks]
  );

  const completedJobs = tasks.filter((task) => task.status === TASK_STATUS.COMPLETED);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-teal-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Work Tracking</h2>
        <p className="mt-1 text-sm text-slate-200">Daily logs and completed jobs history for staff productivity tracking.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Daily Logs</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Flat</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {dailyLog.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">{item.job}</td>
                  <td className="px-3 py-2">{item.flat}</td>
                  <td className="px-3 py-2">{item.date}</td>
                  <td className="px-3 py-2 capitalize">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Completed Jobs History</h3>
        {completedJobs.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {completedJobs.map((job) => (
              <li key={job.id} className="rounded-lg border border-slate-200 px-3 py-2">
                {job.taskName} at {job.flat}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No completed jobs yet.</p>
        )}
      </section>
    </div>
  );
}

export default StaffWorkTrackingPage;
