import { useState } from "react";
import { motion } from "framer-motion";
import { fetchAiRecommendations } from "../services/adminApi";

export default function AiCommandCenter() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handleRun() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetchAiRecommendations();
      setResult(res);
    } catch (err) {
      setResult({ error: 'AI fetch failed' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">AI Command Center</h4>
        <small className="text-xs text-[rgb(var(--app-text-muted-rgb))]">GPT-driven suggestions</small>
      </div>

      <div className="mt-3">
        <textarea className="w-full rounded-xl border px-3 py-2 text-sm" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the AI: summarize complaints, detect fraud, suggest urgent actions..." />
        <div className="mt-3 flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleRun} className="rounded-xl bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)]" disabled={loading}>
            {loading ? 'Running...' : 'Run AI'}
          </motion.button>
          <button className="rounded-xl border px-4 py-2 text-sm" onClick={() => { setPrompt(''); setResult(null); }}>Clear</button>
        </div>
      </div>

      <div className="mt-4">
        {result ? (
          <pre className="whitespace-pre-wrap text-xs text-[rgb(var(--app-text-muted-rgb))]">{JSON.stringify(result, null, 2)}</pre>
        ) : (
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">AI suggestions will appear here.</p>
        )}
      </div>
    </div>
  );
}
