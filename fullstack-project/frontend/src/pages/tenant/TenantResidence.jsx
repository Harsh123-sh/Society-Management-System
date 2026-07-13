import { useEffect, useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantResidence() {
  const [residenceData, setResidenceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResidenceData = async () => {
      try {
        // TODO: Replace with actual API call
        // For now using mock data
        setResidenceData({
          societyName: "Skyline Heights CHS",
          tower: "Tower A",
          wing: "Wing North",
          floor: "12th Floor",
          flatNumber: "A-1204",
          leaseStartDate: "2023-01-15",
          leaseEndDate: "2025-01-14",
          occupancyStatus: "Occupied",
          agreement: "/documents/agreement.pdf",
        });
      } catch (err) {
        setError("Failed to load residence information");
      } finally {
        setLoading(false);
      }
    };

    fetchResidenceData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading residence information...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          My Residence
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View your apartment details and information
        </p>
      </div>

      <Motion.div
        className="rounded-2xl border bg-white p-8 dark:bg-slate-800"
        style={{ borderColor: "var(--border)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Society Name
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {residenceData?.societyName}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Flat Number
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {residenceData?.flatNumber}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Tower
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {residenceData?.tower}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Wing
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {residenceData?.wing}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Floor
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                {residenceData?.floor}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Occupancy Status
              </p>
              <p className="mt-2 text-lg font-bold text-green-600 dark:text-green-400">
                {residenceData?.occupancyStatus}
              </p>
            </div>
          </div>

          <div className="border-t pt-6 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Lease Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Lease Start Date
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {new Date(residenceData?.leaseStartDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Lease End Date
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  {new Date(residenceData?.leaseEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6 dark:border-slate-700 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              View Details
            </button>
            <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition">
              Download Agreement
            </button>
            <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
              View Residence Information
            </button>
          </div>
        </div>
      </Motion.div>
    </div>
  );
}

export default TenantResidence;
