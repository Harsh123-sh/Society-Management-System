export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
};

const STORAGE_KEYS = {
  TASKS: "staff_tasks_v1",
  ATTENDANCE: "staff_attendance_v1",
};

export const defaultStaffTasks = [
  {
    id: 101,
    taskName: "Plumbing",
    description: "Fix kitchen sink leakage",
    flat: "A-302",
    priority: "high",
    status: TASK_STATUS.PENDING,
    accepted: false,
    createdAt: "2026-04-26T09:15:00.000Z",
  },
  {
    id: 102,
    taskName: "Cleaning",
    description: "Common corridor deep cleaning",
    flat: "B-Wing Common",
    priority: "medium",
    status: TASK_STATUS.IN_PROGRESS,
    accepted: true,
    createdAt: "2026-04-26T08:00:00.000Z",
  },
  {
    id: 103,
    taskName: "Electric",
    description: "Replace parking area tube light",
    flat: "Parking Block 1",
    priority: "low",
    status: TASK_STATUS.COMPLETED,
    accepted: true,
    createdAt: "2026-04-25T15:10:00.000Z",
  },
];

export function loadStaffTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return defaultStaffTasks;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultStaffTasks;
  } catch {
    return defaultStaffTasks;
  }
}

export function saveStaffTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

export function loadAttendanceState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) {
      return {
        isCheckedIn: false,
        checkInTime: "",
        checkOutTime: "",
        totalHours: 0,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      isCheckedIn: Boolean(parsed?.isCheckedIn),
      checkInTime: parsed?.checkInTime || "",
      checkOutTime: parsed?.checkOutTime || "",
      totalHours: Number(parsed?.totalHours || 0),
    };
  } catch {
    return {
      isCheckedIn: false,
      checkInTime: "",
      checkOutTime: "",
      totalHours: 0,
    };
  }
}

export function saveAttendanceState(attendance) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
}

export const defaultManuals = [
  {
    id: 1,
    title: "Electrical Safety Manual",
    category: "Electrical",
    updatedAt: "2026-03-12",
  },
  {
    id: 2,
    title: "Plumbing Emergency SOP",
    category: "Plumbing",
    updatedAt: "2026-04-04",
  },
  {
    id: 3,
    title: "Daily Cleaning Checklist",
    category: "Housekeeping",
    updatedAt: "2026-04-21",
  },
];
