import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import ModulePageHeader from "../components/ModulePageHeader";
import { getApiMessage } from "../services/authApi";
import {
  createUser,
  deleteUser,
  fetchTrashUsers,
  permanentlyDeleteUser,
  restoreUser,
  updateUser,
  updateUserStatus,
} from "../services/userApi";
import {
  fetchMonthlyAttendance,
  fetchStaffSecurity,
  reviewStaffAttendanceRequest,
  updateAttendanceCorrection,
} from "../services/staffSecurityApi";
import "./staff-security-page.css";

const emptyData = { summary: {}, staff: [], securityGuards: [], attendanceRequests: [] };
const emptyStaffForm = { name: "", email: "", password: "", phone: "", department: "", designation: "", status: "active" };
const attendanceLegend = [["present", "Present"], ["absent", "Absent"], ["half_day", "Half Day"], ["leave", "Leave"], ["weekly_off", "Weekly Off"], ["holiday", "Holiday"], ["not_marked", "Not Marked"]];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function toDateKey(value) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toTitle(value) {
  return String(value || "-").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function badgeClass(value) {
  const status = String(value || "").toLowerCase();
  if (["active", "present", "approved", "restored"].includes(status)) return "is-green";
  if (["leave", "scheduled"].includes(status)) return "is-blue";
  if (["pending", "not_marked", "weekly_off"].includes(status)) return "is-yellow";
  if (["inactive", "absent", "rejected", "deleted"].includes(status)) return "is-red";
  if (["half_day", "late", "overtime"].includes(status)) return "is-orange";
  return "is-purple";
}

function Icon({ name }) {
  const paths = {
    users: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    shield: "M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z",
    calendar: "M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
    leave: "M5 4h14v16H5V4Zm4 5h6M9 13h6M9 17h4",
    shift: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    trash: "M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3",
    plus: "M12 5v14M5 12h14",
    download: "M12 3v12m0 0 5-5m-5 5-5-5M5 21h14",
    dots: "M12 6h.01M12 12h.01M12 18h.01",
    close: "M6 6l12 12M18 6 6 18",
    check: "M20 6 9 17l-5-5",
    back: "M15 18l-6-6 6-6",
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name] || paths.users} /></svg>;
}

function getDaysInMonth(month, year) {
  return Array.from({ length: new Date(Number(year), Number(month), 0).getDate() }, (_, index) => index + 1);
}

function getPersonKey(person) {
  return String(person?.userId || person?.id || person?.name || "");
}

function StaffManagementPage() {
  const now = new Date();
  const [view, setView] = useState("home");
  const [data, setData] = useState(emptyData);
  const [trashRows, setTrashRows] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [monthFilters, setMonthFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), type: "all", department: "all", status: "all", search: "" });
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [staffModal, setStaffModal] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [actionMenu, setActionMenu] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);

  async function loadStaffSecurity(search = nameSearch) {
    try {
      setLoading(true);
      const response = await fetchStaffSecurity({ search });
      setData(response?.data || emptyData);
      setAlert({ type: "", message: "" });
    } catch (error) {
      setData(emptyData);
      setAlert({ type: "error", message: getApiMessage(error, "Unable to load staff and security data.") });
    } finally {
      setLoading(false);
    }
  }

  async function loadMonthlyAttendance(next = monthFilters) {
    try {
      setAttendanceLoading(true);
      const response = await fetchMonthlyAttendance({ month: next.month, year: next.year });
      setMonthlyAttendance(response?.data || []);
    } catch (error) {
      setMonthlyAttendance([]);
      setAlert({ type: "error", message: getApiMessage(error, "Unable to load monthly attendance.") });
    } finally {
      setAttendanceLoading(false);
    }
  }

  async function loadTrash() {
    try {
      setTrashLoading(true);
      const response = await fetchTrashUsers({ role: "all", limit: 100 });
      setTrashRows((response?.data || []).filter((row) => ["staff", "security"].includes(String(row.role).toLowerCase())));
    } catch (error) {
      setTrashRows([]);
      setAlert({ type: "error", message: getApiMessage(error, "Unable to load trash.") });
    } finally {
      setTrashLoading(false);
    }
  }

  useEffect(() => {
    loadStaffSecurity("");
    loadMonthlyAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === "trash") loadTrash();
  }, [view]);

  const allPeople = useMemo(() => {
    const map = new Map();
    [...data.staff, ...data.securityGuards].forEach((person) => map.set(person.id, person));
    return Array.from(map.values());
  }, [data.staff, data.securityGuards]);

  const departmentOptions = useMemo(() => ["all", ...new Set(allPeople.map((item) => item.department).filter(Boolean))], [allPeople]);

  const attendanceMatrix = useMemo(() => {
    const recordMap = new Map();
    monthlyAttendance.forEach((record) => recordMap.set(`${record.staff_user_id}-${toDateKey(record.attendance_date)}`, record));
    return allPeople
      .filter((person) => monthFilters.type === "all" || String(person.role).toLowerCase() === monthFilters.type)
      .filter((person) => monthFilters.department === "all" || person.department === monthFilters.department)
      .filter((person) => !monthFilters.search || String(person.name || "").toLowerCase().includes(monthFilters.search.toLowerCase()))
      .map((person) => {
        const days = getDaysInMonth(monthFilters.month, monthFilters.year).map((day) => {
          const key = `${monthFilters.year}-${String(monthFilters.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const record = recordMap.get(`${getPersonKey(person)}-${key}`);
          return { day, date: key, status: record?.status || "not_marked", record };
        });
        const totals = days.reduce((acc, day) => {
          acc[day.status] = (acc[day.status] || 0) + 1;
          acc.overtime += Number(day.record?.overtime_minutes || 0);
          acc.workingMinutes += Number(day.record?.working_minutes || 0);
          if (day.status === "late") acc.late += 1;
          return acc;
        }, { present: 0, absent: 0, leave: 0, half_day: 0, overtime: 0, workingMinutes: 0, late: 0 });
        return { person, days, totals };
      })
      .filter((row) => monthFilters.status === "all" || row.days.some((day) => day.status === monthFilters.status));
  }, [allPeople, monthFilters, monthlyAttendance]);

  const monthlySummary = useMemo(() => {
    const pendingLeaves = data.attendanceRequests?.filter((request) => String(request.status).toLowerCase() === "pending").length || 0;
    return attendanceMatrix.reduce((acc, row) => ({
      totalStaff: acc.totalStaff + 1,
      securityGuards: acc.securityGuards + (row.person.role === "security" ? 1 : 0),
      presentThisMonth: acc.presentThisMonth + (row.totals.present || 0),
      absentThisMonth: acc.absentThisMonth + (row.totals.absent || 0),
      leaveRequests: pendingLeaves,
      overtimeHours: acc.overtimeHours + Number(((row.totals.overtime || 0) / 60).toFixed(1)),
    }), { totalStaff: 0, securityGuards: 0, presentThisMonth: 0, absentThisMonth: 0, leaveRequests: 0, overtimeHours: 0 });
  }, [attendanceMatrix, data.attendanceRequests]);

  function updateMonthFilter(name, value) {
    const next = { ...monthFilters, [name]: value };
    setMonthFilters(next);
    if (name === "month" || name === "year") loadMonthlyAttendance(next);
  }

  function openAdd(role) {
    setStaffModal({ mode: "add", role, form: { ...emptyStaffForm, designation: role === "security" ? "Security Guard" : "Staff" } });
  }

  function openEdit(person) {
    setStaffModal({
      mode: "edit",
      person,
      role: person.role,
      form: { name: person.name || "", email: person.email || "", password: "", phone: person.mobile || "", department: person.department || "", designation: person.staffRole || "", status: person.status || "active" },
    });
  }

  async function submitStaff(event) {
    event.preventDefault();
    const { mode, role, person, form } = staffModal;
    try {
      if (mode === "add") {
        await createUser({ ...form, role, password: form.password || "Nexora@123" });
        setAlert({ type: "success", message: `${role === "security" ? "Security guard" : "Staff"} added.` });
      } else {
        await updateUser(person.userId || person.id, { name: form.name, email: form.email, phone: form.phone, department: form.department, designation: form.designation });
        if (form.status && form.status !== person.status) await updateUserStatus(person.userId || person.id, form.status);
        setAlert({ type: "success", message: "Profile updated." });
      }
      setStaffModal(null);
      loadStaffSecurity(nameSearch);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to save profile.") });
    }
  }

  async function toggleStatus(person) {
    const nextStatus = String(person.status).toLowerCase() === "active" ? "inactive" : "active";
    try {
      await updateUserStatus(person.userId || person.id, nextStatus);
      setAlert({ type: "success", message: `${person.name} marked ${nextStatus}.` });
      setActionMenu(null);
      loadStaffSecurity(nameSearch);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to update status.") });
    }
  }

  async function removePerson(person) {
    const reason = window.prompt(`Reason for deleting ${person.name}?`);
    if (!reason) return;
    try {
      await deleteUser(person.userId || person.id, reason);
      setAlert({ type: "success", message: `${person.name} moved to Trash.` });
      setActionMenu(null);
      loadStaffSecurity(nameSearch);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to delete profile.") });
    }
  }

  async function restoreTrashUser(user) {
    try {
      await restoreUser(user.id);
      setAlert({ type: "success", message: `${user.name} restored.` });
      loadTrash();
      loadStaffSecurity(nameSearch);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to restore user.") });
    }
  }

  async function hardDeleteTrashUser(user) {
    if (!window.confirm(`Permanently delete ${user.name}? This cannot be undone.`)) return;
    try {
      await permanentlyDeleteUser(user.id);
      setAlert({ type: "success", message: `${user.name} permanently deleted.` });
      loadTrash();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to permanently delete user.") });
    }
  }

  function exportMonthly(format) {
    const days = getDaysInMonth(monthFilters.month, monthFilters.year);
    const header = ["Name", "Role", "Department", ...days.map((day) => `Day ${day}`), "Present", "Absent", "Leave", "Half Day", "Overtime Hours"];
    const rows = attendanceMatrix.map((row) => [row.person.name, row.person.staffRole, row.person.department, ...row.days.map((day) => toTitle(day.status)), row.totals.present || 0, row.totals.absent || 0, row.totals.leave || 0, row.totals.half_day || 0, Number(((row.totals.overtime || 0) / 60).toFixed(1))]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `staff-security-attendance-${monthFilters.year}-${String(monthFilters.month).padStart(2, "0")}.${format === "pdf" ? "pdf" : "csv"}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function approveCorrection(request, status = "approved") {
    try {
      await reviewStaffAttendanceRequest(request.id, { status, reason: correctionReason });
      setAlert({ type: "success", message: `Leave/correction request ${status}.` });
      setSelectedAttendance(null);
      setCorrectionReason("");
      loadStaffSecurity(nameSearch);
      loadMonthlyAttendance(monthFilters);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to review request.") });
    }
  }

  async function markAttendance(record, status) {
    if (!record?.id) return;
    try {
      await updateAttendanceCorrection(record.id, { status, reason: correctionReason || "Manual chairman correction", notes: correctionReason });
      setAlert({ type: "success", message: "Attendance updated." });
      setSelectedAttendance(null);
      setCorrectionReason("");
      loadMonthlyAttendance(monthFilters);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Unable to update attendance.") });
    }
  }

  const titleMap = {
    home: ["Staff & Security", "Choose a workflow to manage staff, security, attendance, leave, shifts, and trash."],
    staff: ["Staff Register", "Search, add, edit, export, view profiles, and soft delete staff."],
    security: ["Security Guard Register", "Manage guard profiles, status, attendance, leave, edit, and trash flow."],
    attendance: ["Attendance Management", "Monthly calendar, attendance history, correction approvals, and reports."],
    leave: ["Leave Management", "Review pending leave and attendance correction requests."],
    shift: ["Shift Management", "Review assigned staff and security shifts."],
    trash: ["Trash", "Restore or permanently delete removed staff and security guards."],
  };
  const [pageTitle, pageSubtitle] = titleMap[view] || titleMap.home;

  return (
    <div className="chairman-page staff-security-page">
      <ModulePageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        actions={view === "home" ? null : <button type="button" className="ss-button ss-button--ghost" onClick={() => setView("home")}><Icon name="back" /> Back</button>}
      />
      <AlertMessage type={alert.type} message={alert.message} />

      {view === "home" ? <FeatureHome setView={setView} /> : null}
      {view === "staff" ? <RegisterPage type="staff" rows={data.staff} loading={loading} search={nameSearch} setSearch={setNameSearch} onSearch={loadStaffSecurity} onAdd={openAdd} onView={setProfile} onEdit={openEdit} onDelete={removePerson} onStatus={toggleStatus} actionMenu={actionMenu} setActionMenu={setActionMenu} onExport={() => exportRegister(data.staff, "staff-register")} /> : null}
      {view === "security" ? <RegisterPage type="security" rows={data.securityGuards} loading={loading} search={nameSearch} setSearch={setNameSearch} onSearch={loadStaffSecurity} onAdd={openAdd} onView={setProfile} onEdit={openEdit} onDelete={removePerson} onStatus={toggleStatus} actionMenu={actionMenu} setActionMenu={setActionMenu} onExport={() => exportRegister(data.securityGuards, "security-guard-register")} /> : null}
      {view === "attendance" ? <AttendancePage rows={attendanceMatrix} filters={monthFilters} setFilter={updateMonthFilter} departments={departmentOptions} loading={attendanceLoading} onExport={exportMonthly} onSelect={setSelectedAttendance} summary={monthlySummary} /> : null}
      {view === "leave" ? <LeavePage requests={data.attendanceRequests || []} people={allPeople} onSelect={(request) => setSelectedAttendance({ requestOnly: true, request, person: allPeople.find((person) => Number(getPersonKey(person)) === Number(request.staff_user_id)) || { name: request.staff_name, staffRole: request.staff_role } })} /> : null}
      {view === "shift" ? <ShiftPage people={allPeople} /> : null}
      {view === "trash" ? <TrashPage rows={trashRows} loading={trashLoading} onRestore={restoreTrashUser} onPermanentDelete={hardDeleteTrashUser} /> : null}

      {staffModal ? <StaffModal state={staffModal} setState={setStaffModal} onSubmit={submitStaff} onClose={() => setStaffModal(null)} /> : null}
      {profile ? <ProfileDrawer person={profile} onClose={() => setProfile(null)} onEdit={openEdit} onAttendance={(person) => { setProfile(null); setView("attendance"); setMonthFilters((current) => ({ ...current, search: person.name || "" })); }} onLeave={(person) => { setProfile(null); setView("leave"); setMonthFilters((current) => ({ ...current, search: person.name || "" })); }} /> : null}
      {selectedAttendance ? <AttendanceDetailsModal item={selectedAttendance} requests={data.attendanceRequests || []} reason={correctionReason} setReason={setCorrectionReason} onClose={() => setSelectedAttendance(null)} onApprove={approveCorrection} onMark={markAttendance} /> : null}
    </div>
  );
}

function FeatureHome({ setView }) {
  const cards = [
    ["staff", "Staff Register", "Add, search, view, edit, delete, and export staff.", "users"],
    ["security", "Security Guard Register", "Manage guards with profile and attendance access.", "shield"],
    ["attendance", "Attendance Management", "Calendar, history, correction approvals, reports.", "calendar"],
    ["leave", "Leave Management", "Approve leave and correction requests.", "leave"],
    ["shift", "Shift Management", "Review assigned duties and shift timing.", "shift"],
    ["trash", "Trash", "Restore or permanently delete soft-deleted records.", "trash"],
  ];
  return (
    <section className="ss-feature-grid">
      {cards.map(([key, title, text, icon]) => (
        <button key={key} type="button" className="ss-feature-card" onClick={() => setView(key)}>
          <span className="ss-kpi-icon"><Icon name={icon} /></span>
          <strong>{title}</strong>
          <p>{text}</p>
        </button>
      ))}
    </section>
  );
}

function RegisterPage({ type, rows, loading, search, setSearch, onSearch, onAdd, onView, onEdit, onDelete, onStatus, actionMenu, setActionMenu, onExport }) {
  const label = type === "security" ? "Security Guard" : "Staff";
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const departmentOptions = useMemo(() => ["all", ...new Set(rows.map((row) => row.department).filter(Boolean))], [rows]);
  const filteredRows = rows
    .filter((row) => statusFilter === "all" || String(row.status).toLowerCase() === statusFilter)
    .filter((row) => departmentFilter === "all" || row.department === departmentFilter);

  return (
    <>
      <section className="ss-panel ss-register-toolbar">
        <div className="ss-search"><label>Search {label} (Name only)</label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${label.toLowerCase()} by name`} /></div>
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={["all", "active", "inactive", "pending", "rejected"]} />
        <FilterSelect label="Department" value={departmentFilter} onChange={setDepartmentFilter} options={departmentOptions} />
        <div className="ss-filter-actions">
          <button type="button" className="ss-button ss-button--primary" onClick={() => onSearch(search)}>Search</button>
          <button type="button" className="ss-button ss-button--ghost" onClick={() => onAdd(type)}><Icon name="plus" /> Add {label}</button>
          <button type="button" className="ss-button ss-button--ghost" onClick={onExport}><Icon name="download" /> Export</button>
        </div>
      </section>
      <section className="ss-panel">
        {loading ? <EmptyState text={`Loading ${label.toLowerCase()} register...`} /> : filteredRows.length ? (
          <div className="ss-card-register">
            {filteredRows.map((row) => (
              <article key={row.id} className="ss-staff-card ss-staff-card--simple">
                <button type="button" className="ss-staff-identity" onClick={() => onView(row)}><span className="ss-avatar">{String(row.name || "?").slice(0, 1).toUpperCase()}</span><span><strong>{row.name}</strong><small>{row.staffRole || toTitle(row.role)}</small></span></button>
                <div className="ss-card-field"><span>Department</span><strong>{row.department || "-"}</strong></div>
                <div className="ss-card-field"><span>Mobile</span><strong>{row.mobile || "-"}</strong></div>
                <div className="ss-card-field"><span>Status</span><Badge value={row.status} /></div>
                <div className="ss-card-field"><span>Attendance</span><Badge value={row.attendanceStatus} /></div>
                <div className="ss-action">
                  <button type="button" onClick={() => setActionMenu(actionMenu === row.id ? null : row.id)} aria-label={`Actions for ${row.name}`}><Icon name="dots" /></button>
                  {actionMenu === row.id ? (
                    <div className="ss-action-menu">
                      <button type="button" onClick={() => { setActionMenu(null); onView(row); }}>View</button>
                      <button type="button" onClick={() => { setActionMenu(null); onEdit(row); }}>Edit</button>
                      <button type="button" onClick={() => onStatus(row)}>{String(row.status).toLowerCase() === "active" ? "Mark Inactive" : "Mark Active"}</button>
                      <button type="button" onClick={() => onDelete(row)}>Delete</button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState text={`No ${label.toLowerCase()} records found.`} />}
      </section>
    </>
  );
}

function AttendancePage({ rows, filters, setFilter, departments, loading, onExport, onSelect, summary }) {
  return (
    <>
      <section className="ss-summary-grid ss-summary-grid--six">
        {[["Present Days", summary.presentThisMonth], ["Absent Days", summary.absentThisMonth], ["Leave Requests", summary.leaveRequests], ["Overtime Hours", summary.overtimeHours], ["Total People", summary.totalStaff], ["Security Guards", summary.securityGuards]].map(([label, value]) => <article key={label} className="ss-kpi-card"><span className="ss-kpi-icon"><Icon name="calendar" /></span><div><p>{label}</p><strong>{Number(value || 0).toLocaleString("en-IN")}</strong><small>Attendance summary</small></div></article>)}
      </section>
      <MonthlyAttendance rows={rows} filters={filters} setFilter={setFilter} departments={departments} loading={loading} onExport={onExport} onSelect={onSelect} />
    </>
  );
}

function MonthlyAttendance({ rows, filters, setFilter, departments, loading, onExport, onSelect }) {
  const days = getDaysInMonth(filters.month, filters.year);
  const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 2 + index);
  return (
    <section className="ss-panel ss-monthly-panel">
      <div className="ss-section-head ss-monthly-head"><div><p>Monthly Attendance</p><h3>Attendance Calendar and Reports</h3></div><div className="ss-month-actions"><button type="button" className="ss-button ss-button--ghost" onClick={() => onExport("excel")}><Icon name="download" /> Export Excel</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onExport("pdf")}><Icon name="download" /> Export PDF</button></div></div>
      <div className="ss-month-filters">
        <label className="ss-field">Month<select value={filters.month} onChange={(event) => setFilter("month", Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2026, index, 1).toLocaleDateString("en-IN", { month: "long" })}</option>)}</select></label>
        <label className="ss-field">Year<select value={filters.year} onChange={(event) => setFilter("year", Number(event.target.value))}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
        <FilterSelect label="Staff/Security" value={filters.type} onChange={(value) => setFilter("type", value)} options={["all", "staff", "security"]} />
        <FilterSelect label="Department" value={filters.department} onChange={(value) => setFilter("department", value)} options={departments} />
        <FilterSelect label="Status" value={filters.status} onChange={(value) => setFilter("status", value)} options={["all", ...attendanceLegend.map(([key]) => key), "overtime", "late"]} />
        <label className="ss-field ss-month-search">Search by Name<input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Name only" /></label>
      </div>
      <div className="ss-legend">{attendanceLegend.map(([key, label]) => <span key={key}><i className={`ss-day-dot ss-day--${key}`} />{label}</span>)}</div>
      {loading ? <EmptyState text="Loading monthly attendance..." /> : rows.length ? (
        <div className="ss-attendance-matrix"><table><thead><tr><th className="ss-sticky-person">Staff / Security</th>{days.map((day) => <th key={day}>{day}</th>)}<th>P</th><th>A</th><th>L</th><th>H</th><th>OT</th></tr></thead><tbody>{rows.map((row) => <tr key={row.person.id}><td className="ss-sticky-person"><button type="button" className="ss-month-person"><span className="ss-avatar">{String(row.person.name || "?").slice(0, 1).toUpperCase()}</span><span><strong>{row.person.name}</strong><small>{row.person.staffRole} - {row.person.department}</small></span></button></td>{row.days.map((day) => <td key={day.date}><button type="button" className={`ss-day-cell ss-day--${day.status}`} title={`${row.person.name} - ${toTitle(day.status)} on ${day.date}`} onClick={() => onSelect({ ...day, person: row.person })}>{day.status === "not_marked" ? "" : toTitle(day.status).slice(0, 1)}</button></td>)}<td>{row.totals.present || 0}</td><td>{row.totals.absent || 0}</td><td>{row.totals.leave || 0}</td><td>{row.totals.half_day || 0}</td><td>{Number(((row.totals.overtime || 0) / 60).toFixed(1))}</td></tr>)}</tbody></table></div>
      ) : <EmptyState text="No monthly attendance rows match these filters." />}
    </section>
  );
}

function LeavePage({ requests, people, onSelect }) {
  const pending = requests.filter((request) => String(request.status).toLowerCase() === "pending");
  return <section className="ss-panel"><div className="ss-section-head"><div><p>Leave Management</p><h3>Pending leave and correction requests</h3></div></div>{pending.length ? <div className="ss-leave-list">{pending.map((request) => { const person = people.find((item) => Number(getPersonKey(item)) === Number(request.staff_user_id)); return <article key={request.id}><div><strong>{person?.name || request.staff_name || "Staff"}</strong><span>{toTitle(request.request_type)} - {formatDate(request.attendance_date)}</span></div><p>{request.reason || "No reason provided."}</p><button type="button" className="ss-button ss-button--ghost" onClick={() => onSelect(request)}>Review</button></article>; })}</div> : <EmptyState text="No pending leave or correction requests." />}</section>;
}

function ShiftPage({ people }) {
  return <section className="ss-panel"><div className="ss-section-head"><div><p>Shift Management</p><h3>Assigned staff and security shift overview</h3></div></div>{people.length ? <div className="ss-card-register">{people.map((person) => <article key={person.id} className="ss-staff-card ss-staff-card--simple"><div className="ss-staff-identity"><span className="ss-avatar">{String(person.name || "?").slice(0, 1).toUpperCase()}</span><span><strong>{person.name}</strong><small>{person.staffRole || toTitle(person.role)}</small></span></div><div className="ss-card-field"><span>Department</span><strong>{person.department || "-"}</strong></div><div className="ss-card-field"><span>Shift</span><strong>{person.shift || "Not assigned"}</strong></div><div className="ss-card-field"><span>Area / Gate</span><strong>{person.assignedGate || person.assignedArea || "-"}</strong></div><div className="ss-card-field"><span>Status</span><Badge value={person.status} /></div></article>)}</div> : <EmptyState text="No staff or security shift records found." />}</section>;
}

function TrashPage({ rows, loading, onRestore, onPermanentDelete }) {
  const staff = rows.filter((row) => String(row.role).toLowerCase() === "staff");
  const security = rows.filter((row) => String(row.role).toLowerCase() === "security");
  return <div className="ss-trash-grid"><TrashSection title="Deleted Staff" rows={staff} loading={loading} onRestore={onRestore} onPermanentDelete={onPermanentDelete} /><TrashSection title="Deleted Security Guards" rows={security} loading={loading} onRestore={onRestore} onPermanentDelete={onPermanentDelete} /></div>;
}

function TrashSection({ title, rows, loading, onRestore, onPermanentDelete }) {
  return <section className="ss-panel"><div className="ss-section-head"><div><p>Trash</p><h3>{title}</h3></div></div>{loading ? <EmptyState text="Loading trash..." /> : rows.length ? <div className="ss-trash-list">{rows.map((row) => <article key={row.id}><div><strong>{row.name}</strong><span>{toTitle(row.role)}</span></div><div><span>Deleted By</span><strong>{row.deleted_by_name || row.deleted_by || "-"}</strong></div><div><span>Deleted Date</span><strong>{formatDate(row.deleted_at)}</strong></div><div><span>Reason</span><strong>{row.delete_reason || "-"}</strong></div><div className="ss-trash-actions"><button type="button" className="ss-button ss-button--ghost" onClick={() => onRestore(row)}>Restore</button><button type="button" className="ss-button ss-button--primary" onClick={() => onPermanentDelete(row)}>Permanently Delete</button></div></article>)}</div> : <EmptyState text={`No ${title.toLowerCase()} records in trash.`} />}</section>;
}

function StaffModal({ state, setState, onSubmit, onClose }) {
  const { form, mode, role } = state;
  const title = mode === "add" ? `Add ${role === "security" ? "Security Guard" : "Staff"}` : "Edit Profile";
  const update = (key, value) => setState({ ...state, form: { ...form, [key]: value } });
  return <Modal title={title} subtitle="Staff & Security Profile" onClose={onClose}><form className="ss-form" onSubmit={onSubmit}><FormInput label="Name" value={form.name} onChange={(value) => update("name", value)} required /><FormInput label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} required />{mode === "add" ? <FormInput label="Password" type="password" value={form.password} onChange={(value) => update("password", value)} placeholder="Default: Nexora@123" /> : null}<FormInput label="Mobile" value={form.phone} onChange={(value) => update("phone", value)} /><FormInput label="Department" value={form.department} onChange={(value) => update("department", value)} /><FormInput label="Role / Designation" value={form.designation} onChange={(value) => update("designation", value)} /><FormSelect label="Status" value={form.status} onChange={(value) => update("status", value)} options={["active", "inactive", "pending", "rejected"]} /><div className="ss-modal-actions"><button type="button" className="ss-button ss-button--ghost" onClick={onClose}>Cancel</button><button type="submit" className="ss-button ss-button--primary">Save</button></div></form></Modal>;
}

function ProfileDrawer({ person, onClose, onEdit, onAttendance, onLeave }) {
  return <div className="ss-drawer-backdrop" onMouseDown={onClose}><aside className="ss-drawer" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="ss-close" onClick={onClose}><Icon name="close" /></button><span className="ss-drawer-avatar">{String(person.name || "?").slice(0, 1).toUpperCase()}</span><h2>{person.name}</h2><p>{person.staffRole || toTitle(person.role)}</p><div className="ss-profile-sections">{[["Personal Details", [["Name", person.name], ["Role", person.staffRole || toTitle(person.role)]]], ["Contact Information", [["Email", person.email], ["Mobile", person.mobile]]], ["Employment Details", [["Department", person.department], ["Joining Date", formatDate(person.joiningDate)], ["Shift", person.shift || "Not assigned"]]], ["Documents", [["Document Status", "No uploaded documents"]]], ["Assigned Society", [["Area / Gate", person.assignedGate || person.assignedArea || "-"]]], ["Status", [["Account Status", toTitle(person.status)], ["Attendance", toTitle(person.attendanceStatus)]]]].map(([section, items]) => <section key={section}><h3>{section}</h3>{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || "-"}</strong></div>)}</section>)}</div><div className="ss-drawer-actions"><button type="button" className="ss-button ss-button--primary" onClick={() => onEdit(person)}>Edit</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onAttendance(person)}>Attendance</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onLeave(person)}>Leave History</button><button type="button" className="ss-button ss-button--ghost" onClick={onClose}>Close</button></div></aside></div>;
}

function AttendanceDetailsModal({ item, requests, reason, setReason, onClose, onApprove, onMark }) {
  const person = item.person || {};
  const request = item.request || requests.find((entry) => Number(entry.staff_user_id) === Number(getPersonKey(person)) && toDateKey(entry.attendance_date) === item.date && entry.status === "pending");
  return <Modal title={item.requestOnly ? "Leave Approval" : "Attendance Details"} subtitle={`${person.name || "Staff"} - ${formatDate(item.date || request?.attendance_date)}`} onClose={onClose}><div className="ss-attendance-detail"><article><span>Status</span><Badge value={request?.status || item.status} /></article><article><span>Role</span><strong>{person.staffRole || person.role || request?.staff_role || "-"}</strong></article><article><span>Request</span><strong>{toTitle(request?.request_type || "Attendance")}</strong></article><article><span>Notes</span><strong>{request?.reason || item.record?.notes || "No notes"}</strong></article></div><label className="ss-form-wide ss-correction-reason">Approval / correction reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add chairman reason." /></label><div className="ss-modal-actions">{request ? <><button type="button" className="ss-button ss-button--primary" onClick={() => onApprove(request, "approved")}><Icon name="check" /> Approve</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onApprove(request, "rejected")}>Reject</button></> : null}{item.record?.id ? <><button type="button" className="ss-button ss-button--ghost" onClick={() => onMark(item.record, "present")}>Mark Present</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onMark(item.record, "absent")}>Mark Absent</button><button type="button" className="ss-button ss-button--ghost" onClick={() => onMark(item.record, "half_day")}>Half Day</button></> : null}</div></Modal>;
}

function exportRegister(rows, filename) {
  const header = ["Name", "Role", "Department", "Mobile", "Email", "Status"];
  const csvRows = rows.map((row) => [row.name, row.staffRole || row.role, row.department, row.mobile, row.email, row.status]);
  const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="ss-field">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{toTitle(option)}</option>)}</select></label>;
}
function Badge({ value }) { return <span className={`ss-badge ${badgeClass(value)}`}>{toTitle(value)}</span>; }
function EmptyState({ text }) { return <div className="ss-empty">{text}</div>; }
function FormInput({ label, type = "text", value, onChange, required = false, placeholder = "" }) { return <label>{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} /></label>; }
function FormSelect({ label, value, onChange, options }) { return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{toTitle(option)}</option>)}</select></label>; }
function Modal({ title, subtitle, children, onClose }) { return <div className="ss-modal-backdrop" onMouseDown={onClose}><section className="ss-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><header><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button type="button" className="ss-close" onClick={onClose}><Icon name="close" /></button></header>{children}</section></div>; }

export default StaffManagementPage;
