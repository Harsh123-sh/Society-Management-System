export const summaryStats = [
  {
    id: 1,
    title: "Total Residents",
    value: "1,245",
    icon: "👥",
    color: "from-blue-500 to-blue-600",
    trend: "+12%",
    trendUp: true,
  },
  {
    id: 2,
    title: "Monthly Collection",
    value: "₹24,50,000",
    icon: "💰",
    color: "from-green-500 to-green-600",
    trend: "+8%",
    trendUp: true,
  },
  {
    id: 3,
    title: "Pending Payments",
    value: "₹3,25,000",
    icon: "⏳",
    color: "from-orange-500 to-orange-600",
    trend: "+5%",
    trendUp: false,
  },
  {
    id: 4,
    title: "Active Complaints",
    value: "42",
    icon: "⚠️",
    color: "from-red-500 to-red-600",
    trend: "-3%",
    trendUp: true,
  },
  {
    id: 5,
    title: "Visitors Today",
    value: "187",
    icon: "🚗",
    color: "from-purple-500 to-purple-600",
    trend: "+15%",
    trendUp: true,
  },
  {
    id: 6,
    title: "Staff On Duty",
    value: "24/25",
    icon: "👷",
    color: "from-indigo-500 to-indigo-600",
    trend: "+2%",
    trendUp: true,
  },
];

export const financialData = [
  { month: "Jan", income: 22, expense: 8 },
  { month: "Feb", income: 25, expense: 9 },
  { month: "Mar", income: 28, expense: 10 },
  { month: "Apr", income: 24, expense: 11 },
  { month: "May", income: 30, expense: 12 },
  { month: "Jun", income: 32, expense: 13 },
];

export const pendingDues = [
  {
    id: 1,
    resident: "Rajesh Kumar",
    flat: "A-101",
    wing: "A",
    amount: "₹15,000",
    daysOverdue: 45,
    status: "critical",
  },
  {
    id: 2,
    resident: "Priya Singh",
    flat: "B-205",
    wing: "B",
    amount: "₹8,500",
    daysOverdue: 20,
    status: "warning",
  },
  {
    id: 3,
    resident: "Amit Patel",
    flat: "C-310",
    wing: "C",
    amount: "₹5,200",
    daysOverdue: 5,
    status: "pending",
  },
  {
    id: 4,
    resident: "Neha Sharma",
    flat: "A-205",
    wing: "A",
    amount: "₹12,000",
    daysOverdue: 30,
    status: "warning",
  },
];

export const complaintStats = [
  { name: "Water", value: 25, color: "#3B82F6" },
  { name: "Electricity", value: 18, color: "#F59E0B" },
  { name: "Maintenance", value: 32, color: "#EF4444" },
  { name: "Noise", value: 15, color: "#8B5CF6" },
  { name: "Others", value: 10, color: "#10B981" },
];

export const recentComplaints = [
  {
    id: 1,
    resident: "Vikram Singh",
    issue: "Water leakage in C-205",
    status: "pending",
    priority: "high",
    date: "2024-04-20",
  },
  {
    id: 2,
    resident: "Anjali Gupta",
    issue: "Lift not working - Wing B",
    status: "in_progress",
    priority: "critical",
    date: "2024-04-19",
  },
  {
    id: 3,
    resident: "Suresh Kumar",
    issue: "Pest infestation",
    status: "resolved",
    priority: "medium",
    date: "2024-04-18",
  },
  {
    id: 4,
    resident: "Deepika Sharma",
    issue: "Broken common light",
    status: "pending",
    priority: "low",
    date: "2024-04-17",
  },
];

export const visitorsList = [
  {
    id: 1,
    name: "Amit Technician",
    flat: "A-101",
    purpose: "Maintenance",
    entryTime: "09:30 AM",
    exitTime: "10:45 AM",
    status: "exited",
  },
  {
    id: 2,
    name: "Delivery Person",
    flat: "B-205",
    purpose: "Delivery",
    entryTime: "10:15 AM",
    exitTime: "10:22 AM",
    status: "exited",
  },
  {
    id: 3,
    name: "Plumber Expert",
    flat: "C-310",
    purpose: "Repair",
    entryTime: "11:00 AM",
    exitTime: null,
    status: "in_premises",
  },
  {
    id: 4,
    name: "Electrician Pro",
    flat: "A-205",
    purpose: "Installation",
    entryTime: "02:00 PM",
    exitTime: null,
    status: "in_premises",
  },
];

export const latestNotices = [
  {
    id: 1,
    title: "Annual General Meeting Scheduled",
    description: "AGM will be held on April 30, 2024 at 6:00 PM",
    date: "2024-04-15",
    views: 1245,
    postedBy: "Admin",
  },
  {
    id: 2,
    title: "Maintenance Work - Wing B",
    description: "Common area maintenance on April 25-27, 2024",
    date: "2024-04-10",
    views: 892,
    postedBy: "Secretary",
  },
  {
    id: 3,
    title: "Billing Reminder",
    description: "Monthly bills are due by April 25, 2024",
    date: "2024-04-01",
    views: 2156,
    postedBy: "Treasurer",
  },
];

export const staffOverview = [
  {
    id: 1,
    name: "Rajesh Verma",
    role: "Security",
    status: "on_duty",
    shift: "Morning (6 AM - 2 PM)",
  },
  {
    id: 2,
    name: "Priya Rao",
    role: "Receptionist",
    status: "on_duty",
    shift: "Morning (8 AM - 4 PM)",
  },
  {
    id: 3,
    name: "Sunil Kumar",
    role: "Maintenance",
    status: "off_duty",
    shift: "Evening (2 PM - 10 PM)",
  },
  {
    id: 4,
    name: "Meera Singh",
    role: "Housekeeper",
    status: "on_duty",
    shift: "Full-day (8 AM - 8 PM)",
  },
  {
    id: 5,
    name: "Arjun Patel",
    role: "Security",
    status: "on_duty",
    shift: "Night (10 PM - 6 AM)",
  },
];

export const aiInsights = [
  {
    id: 1,
    type: "warning",
    title: "Collection Alert",
    message: "Collection decreased by 12% this month compared to last month",
    icon: "📉",
  },
  {
    id: 2,
    type: "warning",
    title: "Complaint Trend",
    message: "Water complaints increased by 40% this week",
    icon: "💧",
  },
  {
    id: 3,
    type: "critical",
    title: "Unusual Activity",
    message: "Unusual visitor activity detected today",
    icon: "🚨",
  },
  {
    id: 4,
    type: "success",
    title: "Performance",
    message: "Staff efficiency improved by 18% this week",
    icon: "⭐",
  },
];
