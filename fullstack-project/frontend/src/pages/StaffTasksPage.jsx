import { useMemo, useState } from "react";
import {
  TASK_STATUS,
  loadStaffTasks,
  saveStaffTasks,
} from "../utils/staffDashboardData";

function StaffTasksPage() {
  const [tasks, setTasks] = useState(() => loadStaffTasks());

  function updateTasks(nextTasks) {
    setTasks(nextTasks);
    saveStaffTasks(nextTasks);
  }

  function acceptTask(taskId) {
    updateTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, accepted: true, status: TASK_STATUS.PENDING } : task
      )
    );
  }

  function updateStatus(taskId, status) {
    updateTasks(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)));
  }

  const stats = useMemo(
    () => ({
      assigned: tasks.length,
      pending: tasks.filter((task) => task.status === TASK_STATUS.PENDING).length,
      inProgress: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS).length,
      completed: tasks.filter((task) => task.status === TASK_STATUS.COMPLETED).length,
    }),
    [tasks]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-orange-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <p className="mt-1 text-sm text-slate-200">
          Accept assigned work and update each task as Pending, In Progress, or Completed.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Assigned</p>
          <p className="text-2xl font-bold text-slate-900">{stats.assigned}</p>
        </article>
        <article className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </article>
        <article className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
        </article>
        <article className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
        </article>
      </section>

      <section className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{task.taskName}</p>
                <p className="text-sm text-slate-600">{task.description}</p>
                <p className="mt-1 text-xs text-slate-500">Assigned Flat: {task.flat}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold uppercase text-slate-700">
                  {task.priority}
                </span>
                {!task.accepted ? (
                  <button
                    type="button"
                    className="rounded-lg theme-surface px-3 py-2 text-xs font-semibold text-[var(--text-main)]"
                    onClick={() => acceptTask(task.id)}
                  >
                    Accept Task
                  </button>
                ) : null}
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  value={task.status}
                  onChange={(event) => updateStatus(task.id, event.target.value)}
                >
                  <option value={TASK_STATUS.PENDING}>Pending</option>
                  <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                  <option value={TASK_STATUS.COMPLETED}>Completed</option>
                </select>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default StaffTasksPage;
