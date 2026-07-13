import { useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantAmenities() {
  const [amenities] = useState([
    { id: 1, name: "Swimming Pool", available: true, slots: 15, booked: false },
    { id: 2, name: "Gym", available: true, slots: 20, booked: true },
    { id: 3, name: "Badminton Court", available: true, slots: 4, booked: false },
    { id: 4, name: "Community Hall", available: true, slots: 10, booked: false },
    { id: 5, name: "Cricket Ground", available: false, slots: 0, booked: false },
    { id: 6, name: "Tennis Court", available: true, slots: 6, booked: true },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Amenities
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Browse and book community amenities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amenities.map((amenity) => (
          <Motion.div
            key={amenity.id}
            className="rounded-2xl border bg-white p-6 dark:bg-slate-800 overflow-hidden"
            style={{ borderColor: "var(--border)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{amenity.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                amenity.available
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
              }`}>
                {amenity.available ? "Available" : "Closed"}
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Available Slots</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{amenity.slots}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(amenity.slots / 20) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="flex gap-3">
              {amenity.available && (
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                  {amenity.booked ? "Manage Booking" : "Book Now"}
                </button>
              )}
              <button className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium">
                View History
              </button>
            </div>
          </Motion.div>
        ))}
      </div>
    </div>
  );
}

export default TenantAmenities;
