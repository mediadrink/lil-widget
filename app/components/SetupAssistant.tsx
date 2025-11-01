// File: /components/SetupAssistant.tsx

"use client";

import { useState } from "react";

export default function SetupAssistant({
  websiteUrl,
  setWebsiteUrl,
  persona,
  setPersona,
  instructions,
  setInstructions,
}: {
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  persona: string;
  setPersona: (val: string) => void;
  instructions: string;
  setInstructions: (val: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!websiteUrl || !websiteUrl.startsWith("http")) {
      setError("Please enter a valid URL starting with http or https.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/crawl-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });

      const data = await res.json();

      if (res.ok) {
        setPersona(data.suggestedPersona);
        setInstructions(data.suggestedInstructions);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to fetch suggestions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-white shadow">
      <h2 className="text-lg font-bold mb-2">🧠 Setup Assistant</h2>

      <label className="block mb-2">
        <span className="text-sm font-medium">Website URL</span>
        <input
          className="w-full px-2 py-1 border rounded mt-1"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
        />
      </label>

      <button
        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? "Crawling..." : "Generate from Website"}
      </button>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
