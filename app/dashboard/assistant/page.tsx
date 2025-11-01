// app/dashboard/assistant/page.tsx
"use client";

import { useState } from "react";

function extractSuggestedRules(md: string) {
  // grab the ### Suggested Rules section, pull bullet lines
  const m = md.match(/###\s*Suggested Rules([\s\S]*?)(\n###|\n##|$)/i);
  const block = m ? m[1] : "";
  return block
    .split("\n")
    .map((l) => l.replace(/^\s*[-*]\s*/, "").trim())
    .filter((l) => l.length > 0);
}

export default function AdminAssistantPage() {
  const [widgetId, setWidgetId] = useState("");
  const [input, setInput] = useState(
    "Half our visitors asked about shipping—what rules should I add? Also suggest enabling a shipping calculator."
  );
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [applyLoading, setApplyLoading] = useState(false);
  const [appliedVersion, setAppliedVersion] = useState<number | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    setReply(null);
    setRules([]);
    setAppliedVersion(null);
    try {
      const res = await fetch("/api/admin-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId, message: input }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      setReply(json.reply);
      setRules(extractSuggestedRules(json.reply || ""));
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function applySuggestions(mode: "append" | "replace") {
    setApplyLoading(true);
    setError(null);
    setAppliedVersion(null);
    try {
      const res = await fetch(`/api/widget/${widgetId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestions: rules, mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Apply failed");
      setAppliedVersion(json.version);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setApplyLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-5">
      <h1 className="text-2xl font-semibold">Admin Helper</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Widget ID</label>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Paste your widget ID"
          value={widgetId}
          onChange={(e) => setWidgetId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ask a question</label>
        <textarea
          className="w-full rounded border px-3 py-2 h-28"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      <button
        onClick={ask}
        disabled={loading || !widgetId}
        className="rounded px-4 py-2 border hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? "Thinking…" : "Ask"}
      </button>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {reply && (
        <div className="rounded border p-4 whitespace-pre-wrap leading-relaxed">
          {reply}
        </div>
      )}

      {rules.length > 0 && (
        <div className="rounded border p-4 space-y-3">
          <div className="font-medium">Parsed Suggested Rules</div>
          <ul className="list-disc pl-5 space-y-1">
            {rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => applySuggestions("append")}
              disabled={applyLoading}
              className="rounded px-3 py-2 border hover:bg-gray-50 disabled:opacity-50"
            >
              {applyLoading ? "Applying…" : "Apply (append as new version)"}
            </button>
            <button
              onClick={() => applySuggestions("replace")}
              disabled={applyLoading}
              className="rounded px-3 py-2 border hover:bg-gray-50 disabled:opacity-50"
            >
              Replace current rules
            </button>
          </div>
          {appliedVersion && (
            <div className="text-sm text-green-700">
              ✅ Created rules v{appliedVersion}. New chats can use it immediately.
            </div>
          )}
        </div>
      )}
    </main>
  );
}
