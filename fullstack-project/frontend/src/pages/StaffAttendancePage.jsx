import { useMemo, useState } from "react";
import {
  loadAttendanceState,
  saveAttendanceState,
} from "../utils/staffDashboardData";

function StaffAttendancePage() {
  const [attendance, setAttendance] = useState(() => loadAttendanceState());

  function updateAttendance(next) {
    setAttendance(next);
    saveAttendanceState(next);
  }

  function checkIn() {
    const now = new Date();
    updateAttendance({
      ...attendance,
      isCheckedIn: true,
      checkInTime: now.toISOString(),
      checkOutTime: "",
    });
  }

  function checkOut() {
    const now = new Date();
    const checkInTime = attendance.checkInTime ? new Date(attendance.checkInTime) : null;
    const workedMs = checkInTime ? now.getTime() - checkInTime.getTime() : 0;
    const workedHours = workedMs > 0 ? workedMs / (1000 * 60 * 60) : 0;

    updateAttendance({
      isCheckedIn: false,
      checkInTime: attendance.checkInTime,
      checkOutTime: now.toISOString(),
      totalHours: Number((attendance.totalHours + workedHours).toFixed(2)),
    });
  }

  const formattedIn = useMemo(
    () => (attendance.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : "-"),
    [attendance.checkInTime]
  );
  const formattedOut = useMemo(
    () => (attendance.checkOutTime ? new Date(attendance.checkOutTime).toLocaleString() : "-"),
    [attendance.checkOutTime]
  );

  return (
    <div className="staff-page staff-attendance-page space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-indigo-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Attendance System</h2>
        <p className="mt-1 text-sm text-slate-200">
          Check-in / check-out with work-hours tracking for daily staff attendance.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Current Status</p>
          <p className="text-xl font-bold text-slate-900">
            {attendance.isCheckedIn ? "Checked In" : "Checked Out"}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Last Check-in</p>
          <p className="text-sm font-semibold text-slate-900">{formattedIn}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Last Check-out</p>
          <p className="text-sm font-semibold text-slate-900">{formattedOut}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">Total tracked hours: <span className="font-semibold text-slate-900">{attendance.totalHours.toFixed(2)} h</span></p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={checkIn}
            disabled={attendance.isCheckedIn}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-50"
          >
            Check In
          </button>
          <button
            type="button"
            onClick={checkOut}
            disabled={!attendance.isCheckedIn}
            className="rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-50"
          >
            Check Out
          </button>
        </div>
      </section>
    </div>
  );
}

export default StaffAttendancePage;
