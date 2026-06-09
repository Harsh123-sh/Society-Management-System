import { useMemo } from "react";
import { Link } from "react-router-dom";
import { loadStaffTasks } from "../utils/staffDashboardData";

function StaffHomePage() {
  const tasks = loadStaffTasks();
  const todaySchedule = [
    { time: "09:00 AM", job: "Plumbing visit - A-302" },
    { time: "11:00 AM", job: "Complaint follow-up - C-401" },
    { time: "02:30 PM", job: "Cleaning review - B Wing" },
  ];

  const stats = useMemo(
    () => ({
      assignedTasks: tasks.length,
      pendingWork: tasks.filter((item) => item.status === "pending").length,
      completedWork: tasks.filter((item) => item.status === "completed").length,
    }),
    [tasks]
  );

  return (
    <div className="space-y-6">
      <section className="surface-card app-surface rounded-[28px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">Staff Dashboard</p>
        <h2 className="mt-2 text-3xl font-bold text-[rgb(var(--app-text-rgb))]">Daily work queue</h2>
        <p className="mt-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
          Assigned tasks, pending/completed work, and today's schedule in one view.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Assigned Tasks</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.assignedTasks}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Pending Work</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.pendingWork}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Completed Work</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.completedWork}</p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">Today's Schedule</h3>
          <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
            {todaySchedule.map((item) => (
              <li key={`${item.time}-${item.job}`} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2">
                <span className="font-semibold text-[rgb(var(--app-text-rgb))]">{item.time}</span> - {item.job}
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card app-surface p-4">
          <h3 className="text-base font-semibold text-[rgb(var(--app-text-rgb))]">AI Assistant</h3>
          <p className="mt-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">Quick prompts for staff operations.</p>
          <div className="mt-3 grid gap-2">
            <button className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-left text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]">
              My tasks today?
            </button>
            <button className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-left text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]">
              Pending complaints?
            </button>
          </div>
        </article>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition-all hover:opacity-90" to="/staff/tasks">
          Open Tasks
        </Link>
        <Link className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]" to="/staff/attendance">
          Attendance
        </Link>
        <Link className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]" to="/staff/ai-insights">
          AI Features
        </Link>
      </div>
    </div>
  );
}

export default StaffHomePage;
