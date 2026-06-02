// Security Dashboard Navigation

export const menuItems = [
  { id: 1, name: "Dashboard", icon: "📊", path: "/security-dashboard" },
  { id: 2, name: "Visitor Entry", icon: "👤", path: "/security-dashboard/visitors" },
  { id: 3, name: "Deliveries", icon: "📦", path: "/security-dashboard/deliveries" },
  { id: 4, name: "Vehicles", icon: "🚗", path: "/security-dashboard/vehicles" },
  { id: 5, name: "Alerts", icon: "🚨", path: "/security-dashboard/alerts" },
  { id: 6, name: "Blacklist", icon: "🚫", path: "/security-dashboard/blacklist" },
  { id: 7, name: "Shift Logs", icon: "🕒", path: "/security-dashboard/shift-logs" },
  { id: 8, name: "Profile", icon: "👤", path: "/security-dashboard/profile" },
];

export const securityGuardProfile = {
  id: 1,
  name: "Rajesh Kumar",
  avatar: "👮",
  role: "Security Guard",
  shiftStart: "8:00 AM",
  shiftEnd: "4:00 PM",
  empId: "SEC001",
  phone: "+91 9876543210",
  email: "rajesh@security.com",
  status: "on_duty",
};

export const flats = [
  { id: 1, number: "A-101", wing: "A", block: "A" },
  { id: 2, number: "A-102", wing: "A", block: "A" },
  { id: 3, number: "A-103", wing: "A", block: "A" },
  { id: 4, number: "B-201", wing: "B", block: "B" },
  { id: 5, number: "B-202", wing: "B", block: "B" },
  { id: 6, number: "B-203", wing: "B", block: "B" },
  { id: 7, number: "C-301", wing: "C", block: "C" },
  { id: 8, number: "C-302", wing: "C", block: "C" },
  { id: 9, number: "D-401", wing: "D", block: "D" },
  { id: 10, number: "E-501", wing: "E", block: "E" },
];

export const idTypes = [
  { id: 1, type: "Aadhar" },
  { id: 2, type: "PAN" },
  { id: 3, type: "Driving License" },
  { id: 4, type: "Passport" },
  { id: 5, type: "Voter ID" },
];

export const purposes = [
  { id: 1, purpose: "Meeting" },
  { id: 2, purpose: "Delivery" },
  { id: 3, purpose: "Repair Work" },
  { id: 4, purpose: "Guest" },
  { id: 5, purpose: "Tutor" },
  { id: 6, purpose: "Maintenance" },
  { id: 7, purpose: "Doctor" },
  { id: 8, purpose: "Other" },
];

export const vehicleTypes = [
  { id: 1, type: "Car" },
  { id: 2, type: "Bike" },
  { id: 3, type: "Auto" },
  { id: 4, type: "Truck" },
  { id: 5, type: "Van" },
];
