import { useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantParking() {
  const [vehicles, setVehicles] = useState([
    { id: 1, type: "Car", number: "DL01AB1234", color: "Black", slot: "P-12", registeredDate: "2023-01-15" },
    { id: 2, type: "Motorcycle", number: "DL01CD5678", color: "Blue", slot: "P-13", registeredDate: "2023-06-20" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Parking Management
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your vehicles and parking slots
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Vehicle
        </button>
      </div>

      {showAddForm && (
        <Motion.div
          className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Vehicle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600" style={{ borderColor: "var(--border)" }}>
              <option>Select Vehicle Type</option>
              <option>Car</option>
              <option>Motorcycle</option>
              <option>Scooter</option>
            </select>
            <input
              type="text"
              placeholder="Registration Number"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <input
              type="text"
              placeholder="Vehicle Color"
              className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
              style={{ borderColor: "var(--border)" }}
            />
            <select className="rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600" style={{ borderColor: "var(--border)" }}>
              <option>Select Parking Slot</option>
              <option>P-14</option>
              <option>P-15</option>
            </select>
          </div>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Register Vehicle
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
          </div>
        </Motion.div>
      )}

      <div className="rounded-2xl border bg-white dark:bg-slate-800" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Number</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Color</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Slot</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition" style={{ borderColor: "var(--border)" }}>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{vehicle.type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{vehicle.number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{vehicle.color}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{vehicle.slot}</td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                    <button className="text-red-600 hover:text-red-700 font-medium">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TenantParking;
