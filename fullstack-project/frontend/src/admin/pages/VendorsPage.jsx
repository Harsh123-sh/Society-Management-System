import { useState } from "react";
import { DataTable, Badge } from "../components/DataTable";
import { vendorData } from "../data/moduleData";

function VendorsPage() {
  const [vendors, setVendors] = useState(vendorData);
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredVendors = vendors.filter(
    (vendor) => filterStatus === "all" || vendor.status === filterStatus
  );

  const serviceTypes = [...new Set(vendors.map((v) => v.serviceType))];

  const columns = [
    { key: "name", label: "Vendor Name" },
    { key: "serviceType", label: "Service Type" },
    { key: "contact", label: "Contact" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (status) => <Badge status={status} />,
    },
    {
      key: "rating",
      label: "Rating",
      render: (rating) => <span className="font-bold text-yellow-600">⭐ {rating}</span>,
    },
  ];

  const actions = [
    {
      key: "view",
      label: "👁️",
      className: "bg-blue-100 hover:bg-blue-200 text-blue-700",
      onClick: (row) => console.log("View:", row),
    },
    {
      key: "edit",
      label: "✏️",
      className: "bg-amber-100 hover:bg-amber-200 text-amber-700",
      onClick: (row) => console.log("Edit:", row),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🧑‍💼 Vendor Management</h1>
          <p className="mt-2 text-slate-600">Manage external service providers and vendors</p>
        </div>
        <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-[var(--text-main)] hover:shadow-lg transition-all">
          ➕ Add Vendor
        </button>
      </div>

      {/* Service Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {serviceTypes.map((type) => {
          const count = vendors.filter((v) => v.serviceType === type).length;
          const icons = {
            "Electrical": "⚡",
            "Plumbing": "🔧",
            "Cleaning": "🧹",
            "Security": "🔒",
          };
          return (
            <div
              key={type}
              className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-5 border border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{type}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{count}</p>
                </div>
                <span className="text-4xl">{icons[type] || "💼"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select className="rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none">
          <option>All Services</option>
          {serviceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Search vendors..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filteredVendors} actions={actions} />

      {/* Top Vendors */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">⭐ Top Rated Vendors</h3>
          
          <div className="mt-4 space-y-4">
            {filteredVendors
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 4)
              .map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-amber-300 transition-colors cursor-pointer"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{vendor.name}</p>
                    <p className="text-sm text-slate-600">{vendor.serviceType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-600">⭐ {vendor.rating}</p>
                    <p className="text-xs text-slate-500">reviews</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Urgent Services */}
        <div className="rounded-2xl bg-orange-50 p-6 border border-orange-200">
          <h3 className="text-lg font-bold text-orange-900">🚨 Quick Booking</h3>
          
          <div className="mt-4 space-y-3">
            {[
              { service: "Emergency Plumbing", wait: "15 min" },
              { service: "Electrical Repair", wait: "30 min" },
              { service: "Lock Service", wait: "20 min" },
              { service: "HVAC Service", wait: "45 min" },
            ].map((service, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-white p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">{service.service}</p>
                  <p className="text-sm text-slate-600">Est. wait: {service.wait}</p>
                </div>
                <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-orange-600 transition-colors">
                  Book Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorsPage;
