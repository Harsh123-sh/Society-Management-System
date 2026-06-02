import { reportsCharts } from "../data/navigation";

function ReportsPage() {
  const metrics = [
    {
      title: "Residents Trend",
      value: "+12%",
      color: "green",
      data: reportsCharts,
    },
    {
      title: "Collection Trend",
      value: "+18%",
      color: "blue",
      data: reportsCharts,
    },
    { title: "Complaint Resolution", value: "87%", color: "orange", data: [] },
    { title: "Staff Attendance", value: "92%", color: "purple", data: [] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📈 Reports & Analytics</h1>
        <p className="mt-2 text-slate-600">Comprehensive society analytics and trends</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="rounded-lg bg-white p-5 shadow-sm border border-slate-200"
          >
            <p className="text-sm text-slate-600">{metric.title}</p>
            <p className={`mt-2 text-3xl font-bold text-${metric.color}-600`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Residents Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">👥 Residents Growth</h3>
          
          <div className="mt-6 flex items-end justify-between gap-2 h-48">
            {reportsCharts.map((month, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400"
                  style={{ height: `${(month.residents / 1300) * 180}px` }}
                ></div>
                <span className="text-xs font-semibold text-slate-600">
                  {month.month}
                </span>
                <span className="text-xs text-slate-500">{month.residents}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Collection Chart */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">💰 Monthly Collection</h3>
          
          <div className="mt-6 flex items-end justify-between gap-2 h-48">
            {reportsCharts.map((month, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-green-500 to-green-400"
                  style={{
                    height: `${(month.collection / 2500000) * 180}px`,
                  }}
                ></div>
                <span className="text-xs font-semibold text-slate-600">
                  {month.month}
                </span>
                <span className="text-xs text-slate-500">
                  ₹{(month.collection / 100000).toFixed(1)}L
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
          <h4 className="font-bold text-slate-900">⚠️ Pending Complaints</h4>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Critical</span>
              <span className="font-bold text-red-600">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">High</span>
              <span className="font-bold text-orange-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Medium</span>
              <span className="font-bold text-blue-600">18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Low</span>
              <span className="font-bold text-slate-600">7</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
          <h4 className="font-bold text-slate-900">💳 Payment Status</h4>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Paid</span>
              <span className="font-bold text-green-600">1024/1245</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending</span>
              <span className="font-bold text-yellow-600">165/1245</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Overdue</span>
              <span className="font-bold text-red-600">56/1245</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Collection %</span>
              <span className="font-bold text-blue-600">82.2%</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200">
          <h4 className="font-bold text-slate-900">📊 Facility Usage</h4>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Community Hall</span>
              <span className="font-bold">12 bookings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Swimming Pool</span>
              <span className="font-bold">28 bookings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Gym</span>
              <span className="font-bold">45 bookings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Garden</span>
              <span className="font-bold">8 bookings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 border border-purple-200">
        <h3 className="text-lg font-bold text-slate-900">📥 Export Reports</h3>
        <p className="mt-1 text-sm text-slate-600">Download comprehensive reports</p>
        
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { format: "PDF", icon: "📄" },
            { format: "Excel", icon: "📊" },
            { format: "CSV", icon: "📋" },
            { format: "Print", icon: "🖨️" },
          ].map((option) => (
            <button
              key={option.format}
              className="rounded-lg bg-white border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <span className="text-2xl block mb-1">{option.icon}</span>
              {option.format}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
