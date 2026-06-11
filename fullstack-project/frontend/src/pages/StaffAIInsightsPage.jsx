import { useMemo } from "react";
import { loadStaffTasks } from "../utils/staffDashboardData";

function StaffAIInsightsPage() {
  const tasks = loadStaffTasks();

  const analytics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    const pending = tasks.filter((task) => task.status !== "completed").length;
    const efficiency = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    return {
      completed,
      pending,
      efficiency,
    };
  }, [tasks]);

  return (
    <div className="staff-page staff-ai-page space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-emerald-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">AI Features</h2>
        <p className="mt-1 text-sm text-slate-200">Smart assignment, priority detection, summaries, image diagnosis, and assistant prompts.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Tasks Completed</p>
          <p className="text-2xl font-bold text-slate-900">{analytics.completed}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Pending Tasks</p>
          <p className="text-2xl font-bold text-slate-900">{analytics.pending}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Efficiency</p>
          <p className="text-2xl font-bold text-slate-900">{analytics.efficiency}%</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Smart Task Assignment</h3>
          <p className="mt-2 text-sm text-slate-600">AI balances tasks based on staff skill, availability, and workload.</p>
          <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            Suggested assignment: Electric issue for staff with electrical skill and low active load.
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Priority Detection</h3>
          <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            "Water leakage" detected as High priority.
          </p>
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            "Routine cleaning" detected as Medium priority.
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Auto Work Summary</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Daily report auto-generated at 7:00 PM.</li>
            <li>Weekly report includes efficiency and delay patterns.</li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Image-Based Issue Detection</h3>
          <p className="mt-2 text-sm text-slate-600">Upload issue photo to detect electrical/plumbing category instantly.</p>
          <input type="file" accept="image/*" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">AI Assistant Prompts</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-700">My tasks today?</button>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-700">Pending complaints?</button>
        </div>
      </section>
    </div>
  );
}

export default StaffAIInsightsPage;
