import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { fetchOverviewStats } from "../services/analyticsApi";
import {
  aiTextToSpeech,
  fetchAiDashboardWidgets,
  fetchAiRecommendations,
  predictAiMaintenance,
  queryAssistant,
} from "../services/aiApi";

const PIE_COLORS = ["#0f172a", "#f59e0b", "#10b981", "#6366f1"];

function normalizeOverview(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const totals = safePayload.totals && typeof safePayload.totals === "object" ? safePayload.totals : {};
  const charts = safePayload.charts && typeof safePayload.charts === "object" ? safePayload.charts : {};

  return {
    totals: {
      totalResidents: Number(totals.totalResidents) || 0,
      pendingComplaints: Number(totals.pendingComplaints) || 0,
      totalUnpaidBills: Number(totals.totalUnpaidBills) || 0,
    },
    charts: {
      complaintStatus: Array.isArray(charts.complaintStatus) ? charts.complaintStatus : [],
      billStatus: Array.isArray(charts.billStatus) ? charts.billStatus : [],
      monthlyTrend: Array.isArray(charts.monthlyTrend) ? charts.monthlyTrend : [],
    },
  };
}

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
    </div>
  );
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [overview, setOverview] = useState({
    totals: {
      totalResidents: 0,
      pendingComplaints: 0,
      totalUnpaidBills: 0,
    },
    charts: {
      complaintStatus: [],
      billStatus: [],
      monthlyTrend: [],
    },
  });
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [maintenancePrediction, setMaintenancePrediction] = useState(null);
  const [aiWidgets, setAiWidgets] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const complaintStatus = useMemo(() => {
    if (overview.charts.complaintStatus.length) {
      return overview.charts.complaintStatus;
    }

    return [
      { name: "pending", value: 0 },
      { name: "resolved", value: 0 },
    ];
  }, [overview.charts.complaintStatus]);

  const billStatus = useMemo(() => {
    if (overview.charts.billStatus.length) {
      return overview.charts.billStatus;
    }

    return [
      { name: "unpaid", value: 0 },
      { name: "paid", value: 0 },
    ];
  }, [overview.charts.billStatus]);

  const monthlyTrend = useMemo(() => {
    return overview.charts.monthlyTrend || [];
  }, [overview.charts.monthlyTrend]);

  async function loadOverview() {
    try {
      setLoading(true);
      const response = await fetchOverviewStats();
      setOverview(normalizeOverview(response?.data));
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load analytics data"),
      });
      setOverview(normalizeOverview(null));
    } finally {
      setLoading(false);
    }
  }

  async function loadAiData() {
    try {
      setAiLoading(true);
      const [widgetRes, predictionRes, recommendationRes] = await Promise.all([
        fetchAiDashboardWidgets(),
        predictAiMaintenance({}),
        fetchAiRecommendations({ question: "What actions should society admins prioritize this week?" }),
      ]);

      setAiWidgets(widgetRes?.data?.widgets || []);
      setMaintenancePrediction(predictionRes?.data || null);
      setRecommendations(recommendationRes?.data?.suggestedActions || []);
      if (recommendationRes?.data?.reply) {
        setAssistantReply(recommendationRes.data.reply);
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load AI insights"),
      });
      setAiWidgets([]);
      setMaintenancePrediction(null);
      setRecommendations([]);
    } finally {
      setAiLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
    loadAiData();
  }, []);

  async function handleAskAssistant(event) {
    event.preventDefault();
    const prompt = assistantInput.trim();
    if (!prompt) return;

    try {
      setAssistantLoading(true);
      const response = await queryAssistant({ query: prompt, context: { section: "dashboard" } });
      setAssistantReply(response?.data?.answer || "No response from assistant");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "AI assistant failed") });
    } finally {
      setAssistantLoading(false);
    }
  }

  function startVoiceAssistant() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAlert({ type: "error", message: "Speech recognition is not supported in this browser" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setAssistantInput(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceAssistant() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function speakReply() {
    if (!assistantReply) return;

    try {
      const response = await aiTextToSpeech({ text: assistantReply, voice: "alloy" });
      const audioBase64 = response?.data?.audioBase64 || "";
      if (!audioBase64) return;
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      await audio.play();
    } catch (_error) {
      // Browser playback can fail without user gesture; keep silent.
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-amber-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-100">
          Real-time society metrics, trends, and AI assistant insights for proactive operations.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Residents"
          value={overview.totals.totalResidents}
          helper="Registered resident accounts"
        />
        <StatCard
          label="Pending Complaints"
          value={overview.totals.pendingComplaints}
          helper="Open issues requiring action"
        />
        <StatCard
          label="Total Unpaid Bills"
          value={overview.totals.totalUnpaidBills}
          helper="Bills awaiting payment"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Complaints vs Bills (6 Months)</h3>
          <div className="mt-4 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="complaints" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bills" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Complaint Status</h3>
          <div className="mt-4 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complaintStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {complaintStatus.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Bill Status Distribution</h3>
        <div className="mt-4 h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={billStatus}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-indigo-950">AI Assistant</h3>
          <p className="mt-1 text-sm text-indigo-900/80">
            Text and voice assistant for society Q&A, action suggestions, and operational guidance.
          </p>

          <form className="mt-4 space-y-3" onSubmit={handleAskAssistant}>
            <textarea
              rows={3}
              value={assistantInput}
              onChange={(event) => setAssistantInput(event.target.value)}
              placeholder="Ask about notices, complaints, maintenance, billing, or analytics"
              className="w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={assistantLoading}
                className="rounded-lg bg-indigo-900 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-indigo-800 disabled:opacity-50"
              >
                {assistantLoading ? "Thinking..." : "Ask AI"}
              </button>
              <button
                type="button"
                onClick={isListening ? stopVoiceAssistant : startVoiceAssistant}
                className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100"
              >
                {isListening ? "Stop Voice" : "Voice Input"}
              </button>
              <button
                type="button"
                onClick={speakReply}
                disabled={!assistantReply}
                className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 disabled:opacity-50"
              >
                Speak Reply
              </button>
            </div>
          </form>

          <div className="mt-4 rounded-lg border border-indigo-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Assistant reply</p>
            <p className="mt-2 text-sm text-slate-700">
              {assistantReply || "Ask AI assistant to receive smart operational guidance."}
            </p>
          </div>

          <div className="mt-4 rounded-lg border border-indigo-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Smart recommendations</p>
            {recommendations.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {recommendations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No recommendations available.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-emerald-950">AI Predictive Engine</h3>
          <p className="mt-1 text-sm text-emerald-900/80">
            Maintenance prediction, anomaly tracking, and dashboard AI insight widgets.
          </p>

          {aiLoading ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 text-sm text-slate-500">
              Loading AI insights...
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Maintenance risk score</p>
                <p className="mt-2 text-3xl font-bold text-emerald-950">{maintenancePrediction?.riskScore || 0}</p>
                <p className="mt-2 text-sm text-slate-700">{(maintenancePrediction?.preventiveActions || [])[0] || "No prediction data."}</p>
              </div>

              <div className="mt-4 space-y-3">
                {(aiWidgets || []).map((widget) => (
                  <article key={`${widget.title}-${widget.value}`} className="rounded-lg border border-emerald-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-slate-900">{widget.title}</h4>
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{widget.trend || "stable"}</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-emerald-950">{widget.value}</p>
                    <p className="mt-1 text-sm text-slate-600">{widget.detail}</p>
                  </article>
                ))}
                {!aiWidgets.length ? (
                  <div className="rounded-lg border border-emerald-200 bg-white p-3 text-sm text-slate-500">
                    AI widgets are currently unavailable.
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
