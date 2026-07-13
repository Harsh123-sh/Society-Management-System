import { useState } from "react";
import { motion as Motion } from "framer-motion";

function TenantCommunity() {
  const [activeTab, setActiveTab] = useState("notices");
  const [notices] = useState([
    { id: 1, title: "Annual General Body Meeting", date: "2024-02-15", category: "Notice" },
    { id: 2, title: "Maintenance Work in Progress", date: "2024-02-10", category: "Notice" },
    { id: 3, title: "Water Supply Disruption", date: "2024-02-08", category: "Alert" },
  ]);
  const [events] = useState([
    { id: 1, title: "Annual Sports Day", date: "2024-02-20", time: "10:00 AM", location: "Ground" },
    { id: 2, title: "Diwali Celebration", date: "2024-02-25", time: "6:00 PM", location: "Community Hall" },
  ]);
  const [polls] = useState([
    { id: 1, title: "Should we implement new parking rules?", options: ["Yes", "No"], voted: false },
    { id: 2, title: "Preferred time for maintenance works?", options: ["Morning", "Evening", "Night"], voted: true },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Community
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Stay connected with your society community
        </p>
      </div>

      <div className="flex gap-4 border-b dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
        {["notices", "events", "polls", "surveys"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "notices" && (
        <div className="space-y-4">
          {notices.map((notice) => (
            <Motion.div
              key={notice.id}
              className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
              style={{ borderColor: "var(--border)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{notice.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{notice.date}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-semibold">
                  {notice.category}
                </span>
              </div>
              <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium">Read More →</button>
            </Motion.div>
          ))}
        </div>
      )}

      {activeTab === "events" && (
        <div className="space-y-4">
          {events.map((event) => (
            <Motion.div
              key={event.id}
              className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
              style={{ borderColor: "var(--border)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{event.title}</h3>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <p>📅 {event.date} at {event.time}</p>
                    <p>📍 {event.location}</p>
                  </div>
                </div>
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                Register
              </button>
            </Motion.div>
          ))}
        </div>
      )}

      {activeTab === "polls" && (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Motion.div
              key={poll.id}
              className="rounded-2xl border bg-white p-6 dark:bg-slate-800"
              style={{ borderColor: "var(--border)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{poll.title}</h3>
              <div className="space-y-2">
                {poll.options.map((option, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition">
                    <input
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={option}
                      disabled={poll.voted}
                      className="w-4 h-4"
                    />
                    <span className="text-slate-900 dark:text-white">{option}</span>
                  </label>
                ))}
              </div>
              {!poll.voted && (
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
                  Submit Vote
                </button>
              )}
            </Motion.div>
          ))}
        </div>
      )}

      {activeTab === "surveys" && (
        <Motion.div
          className="rounded-2xl border bg-white p-6 dark:bg-slate-800 text-center"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-slate-600 dark:text-slate-400">No active surveys at the moment</p>
        </Motion.div>
      )}
    </div>
  );
}

export default TenantCommunity;
