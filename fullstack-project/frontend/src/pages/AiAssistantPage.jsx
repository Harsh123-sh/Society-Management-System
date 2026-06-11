import { useMemo, useRef, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import {
  aiOCR,
  aiSpeechToText,
  aiTextToSpeech,
  aiSearchKnowledge,
  executeAiAction,
  fetchAiAnalyticsInsights,
  fetchAiRecommendations,
  generateNoticeDraft,
  queryAssistant,
  suggestComplaintText,
  summarizeAiReport,
  translateAiMessage,
} from "../services/aiApi";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const commaIndex = raw.indexOf(",");
      resolve(commaIndex >= 0 ? raw.slice(commaIndex + 1) : raw);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AiAssistantPage() {
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [assistantReply, setAssistantReply] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [noticeTopic, setNoticeTopic] = useState("Water Tank Maintenance");
  const [noticeDetail, setNoticeDetail] = useState("Water supply will be paused for two hours tomorrow morning.");
  const [noticeAudience, setNoticeAudience] = useState("all residents");
  const [noticeOutput, setNoticeOutput] = useState("");

  const [complaintPrompt, setComplaintPrompt] = useState("Lift in B wing is stuck frequently and requires urgent repair.");
  const [complaintOutput, setComplaintOutput] = useState("");

  const [translateText, setTranslateText] = useState("Please clear maintenance dues before the due date.");
  const [targetLanguage, setTargetLanguage] = useState("hi");
  const [translatedText, setTranslatedText] = useState("");

  const [summaryInput, setSummaryInput] = useState("Complaints increased in B wing; billing collection dropped this month.");
  const [summaryOutput, setSummaryOutput] = useState("");

  const [searchQuery, setSearchQuery] = useState("pending lift complaints");
  const [searchOutput, setSearchOutput] = useState(null);

  const [analyticsOutput, setAnalyticsOutput] = useState(null);
  const [recommendationsOutput, setRecommendationsOutput] = useState([]);

  const [ocrOutput, setOcrOutput] = useState("");
  const [sttOutput, setSttOutput] = useState("");

  const [workflowAction, setWorkflowAction] = useState("translate_message");
  const [workflowPayload, setWorkflowPayload] = useState(
    JSON.stringify({ text: "Please visit society office", targetLanguage: "hi" }, null, 2)
  );
  const [workflowResult, setWorkflowResult] = useState("");

  const recognitionRef = useRef(null);

  const workflowHint = useMemo(() => {
    const hints = {
      create_notice: { title: "Water Maintenance", message: "Water shutdown from 8 AM to 10 AM." },
      create_complaint: { title: "Lift issue", description: "Lift not working", residentId: 1 },
      summarize_report: { text: "Report body text" },
      translate_message: { text: "Please update your profile", targetLanguage: "hi" },
      predict_maintenance: {},
      analytics_insights: {},
    };
    return JSON.stringify(hints[workflowAction] || {}, null, 2);
  }, [workflowAction]);

  function startVoiceInput() {
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
      setAssistantPrompt(text);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  async function speakAssistantReply() {
    if (!assistantReply) return;
    try {
      const response = await aiTextToSpeech({ text: assistantReply, voice: "alloy" });
      const audioBase64 = response?.data?.audioBase64 || "";
      if (!audioBase64) return;
      const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
      await audio.play();
    } catch (_error) {
      // Playback may fail without user interaction.
    }
  }

  async function handleAskAssistant() {
    try {
      setLoading(true);
      const response = await queryAssistant({ query: assistantPrompt, context: { module: "ai_control_center" } });
      setAssistantReply(response?.data?.answer || "No response generated");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not get AI assistant response") });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateNotice() {
    try {
      setLoading(true);
      const response = await generateNoticeDraft({ topic: noticeTopic, detail: noticeDetail, audience: noticeAudience });
      setNoticeOutput(response?.data?.notice || response?.data?.message || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not generate notice") });
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateComplaint() {
    try {
      setLoading(true);
      const response = await suggestComplaintText(complaintPrompt);
      setComplaintOutput(response?.data?.suggestion || response?.data?.description || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not generate complaint") });
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate() {
    try {
      setLoading(true);
      const response = await translateAiMessage({ text: translateText, targetLanguage });
      setTranslatedText(response?.data?.translatedText || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not translate content") });
    } finally {
      setLoading(false);
    }
  }

  async function handleSummarize() {
    try {
      setLoading(true);
      const response = await summarizeAiReport({ text: summaryInput, metadata: { section: "ai_page" } });
      setSummaryOutput(response?.data?.summary || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not summarize report") });
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      const response = await aiSearchKnowledge(searchQuery);
      setSearchOutput(response?.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not run AI smart search") });
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchAnalytics() {
    try {
      setLoading(true);
      const [analyticsRes, recommendationRes] = await Promise.all([
        fetchAiAnalyticsInsights(),
        fetchAiRecommendations({ question: "Give smart society recommendations for this week" }),
      ]);
      setAnalyticsOutput(analyticsRes?.data || null);
      setRecommendationsOutput(recommendationRes?.data?.suggestedActions || []);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load AI analytics") });
    } finally {
      setLoading(false);
    }
  }

  async function handleOcrUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const imageBase64 = await fileToBase64(file);
      const response = await aiOCR({ imageBase64 });
      setOcrOutput(response?.data?.extractedText || response?.data?.text || JSON.stringify(response?.data || {}, null, 2));
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not run OCR") });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function handleAudioUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const audioBase64 = await fileToBase64(file);
      const response = await aiSpeechToText({ audioBase64, mimeType: file.type || "audio/webm" });
      setSttOutput(response?.data?.text || response?.data?.transcript || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not run speech-to-text") });
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function handleExecuteWorkflow() {
    try {
      setLoading(true);
      const payload = workflowPayload ? JSON.parse(workflowPayload) : {};
      const response = await executeAiAction({ action: workflowAction, payload });
      setWorkflowResult(JSON.stringify(response?.data || {}, null, 2));
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not execute AI workflow action") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chairman-page space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-cyan-800 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">AI Control Center</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-100">
          Fully integrated AI assistant with chatbot, voice, notices, complaint generation, translation, summaries, analytics, smart search, OCR, STT, TTS, and workflow automation.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">AI Chatbot and Voice Assistant</h3>
        <textarea
          value={assistantPrompt}
          onChange={(event) => setAssistantPrompt(event.target.value)}
          rows={3}
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
          placeholder="Ask anything about society management"
        />
        <div className="chairman-page mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={handleAskAssistant} disabled={loading || !assistantPrompt.trim()} className="rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Ask AI</button>
          <button type="button" onClick={isListening ? stopVoiceInput : startVoiceInput} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{isListening ? "Stop Voice" : "Voice Input"}</button>
          <button type="button" onClick={speakAssistantReply} disabled={!assistantReply} className="rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 disabled:opacity-60">Speak Reply</button>
        </div>
        <div className="chairman-page mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{assistantReply || "AI reply will appear here."}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="chairman-page rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">AI Notices and Complaints</h3>
          <input value={noticeTopic} onChange={(event) => setNoticeTopic(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Notice topic" />
          <textarea value={noticeDetail} onChange={(event) => setNoticeDetail(event.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Notice detail" />
          <input value={noticeAudience} onChange={(event) => setNoticeAudience(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Audience" />
          <button type="button" onClick={handleGenerateNotice} disabled={loading} className="mt-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Generate Notice</button>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{noticeOutput || "Notice output"}</div>

          <textarea value={complaintPrompt} onChange={(event) => setComplaintPrompt(event.target.value)} rows={2} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Complaint prompt" />
          <button type="button" onClick={handleGenerateComplaint} disabled={loading} className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">Generate Complaint</button>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{complaintOutput || "Complaint output"}</div>
        </div>

        <div className="chairman-page rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">AI Translation and Report Summaries</h3>
          <textarea value={translateText} onChange={(event) => setTranslateText(event.target.value)} rows={2} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Text to translate" />
          <input value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Target language code" />
          <button type="button" onClick={handleTranslate} disabled={loading} className="mt-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Translate</button>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{translatedText || "Translation output"}</div>

          <textarea value={summaryInput} onChange={(event) => setSummaryInput(event.target.value)} rows={3} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Report text for summarization" />
          <button type="button" onClick={handleSummarize} disabled={loading} className="mt-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Summarize Report</button>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{summaryOutput || "Summary output"}</div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="chairman-page rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">AI Smart Search and Analytics</h3>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Search knowledge base" />
          <button type="button" onClick={handleSearch} disabled={loading} className="mt-2 rounded-lg theme-surface px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Search</button>

          <button type="button" onClick={handleFetchAnalytics} disabled={loading} className="mt-2 ml-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60">Load AI Analytics</button>

          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{searchOutput ? JSON.stringify(searchOutput, null, 2) : "Search output"}</pre>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{analyticsOutput ? JSON.stringify(analyticsOutput.summary || analyticsOutput, null, 2) : "Analytics output"}</pre>
          {recommendationsOutput.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {recommendationsOutput.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="chairman-page rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">OCR AI, Speech-to-Text, and Workflow Automation</h3>
          <div className="chairman-page mt-3 flex flex-wrap gap-2">
            <label className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 cursor-pointer">
              Upload Image for OCR
              <input type="file" accept="image/*" className="hidden" onChange={handleOcrUpload} />
            </label>
            <label className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 cursor-pointer">
              Upload Audio for STT
              <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
            </label>
          </div>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">OCR: {ocrOutput || "No OCR result"}</div>
          <div className="chairman-page mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">STT: {sttOutput || "No speech-to-text result"}</div>

          <select value={workflowAction} onChange={(event) => setWorkflowAction(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="create_notice">create_notice</option>
            <option value="create_complaint">create_complaint</option>
            <option value="summarize_report">summarize_report</option>
            <option value="translate_message">translate_message</option>
            <option value="predict_maintenance">predict_maintenance</option>
            <option value="analytics_insights">analytics_insights</option>
          </select>
          <textarea value={workflowPayload} onChange={(event) => setWorkflowPayload(event.target.value)} rows={6} className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" placeholder={workflowHint} />
          <button type="button" onClick={handleExecuteWorkflow} disabled={loading} className="mt-2 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">Run Workflow Action</button>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{workflowResult || "Workflow result"}</pre>
        </div>
      </section>
    </div>
  );
}

export default AiAssistantPage;
