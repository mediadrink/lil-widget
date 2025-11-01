// Page: Widget Configuration & Preview
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WidgetConfigPage() {
  const router = useRouter();
  const [widgetName, setWidgetName] = useState("");
  const [persona, setPersona] = useState("");
  const [embedCode, setEmbedCode] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedWidgetName = localStorage.getItem("widgetName");
    const savedPersona = localStorage.getItem("persona");
    if (savedWidgetName && savedPersona) {
      setWidgetName(savedWidgetName);
      setPersona(savedPersona);
      setSaved(true);
    }
  }, []);

  const handleSave = async () => {
    if (!widgetName || !persona) {
      setError("Please fill out all fields.");
      return;
    }

    setError("");

    try {
      localStorage.setItem("widgetName", widgetName);
      localStorage.setItem("persona", persona);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save. Try again later.");
    }
  };

  const handleGenerateCode = () => {
    if (!saved) {
      setError("Please save your widget settings first.");
      return;
    }

    const code = `
<!-- LIL Widget Embed -->
<script src="https://lil-widget-n3s7.vercel.app/public/widget.js" data-widget-id="${widgetName.replaceAll(" ", "-").toLowerCase()}"></script>
    `.trim();
    setEmbedCode(code);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎛️ Configure Your Widget</h1>

      <label className="block font-medium mb-1">Widget Name</label>
      <input
        className="w-full p-2 border rounded mb-4"
        value={widgetName}
        onChange={(e) => setWidgetName(e.target.value)}
        placeholder="Example: Portland Dental Widget"
      />

      <label className="block font-medium mb-1">Chatbot Persona / Instructions</label>
      <textarea
        className="w-full p-2 border rounded mb-4 h-32"
        value={persona}
        onChange={(e) => setPersona(e.target.value)}
        placeholder="Tell the bot how to behave (e.g., friendly assistant for a dental office)."
      />

      {error && <p className="text-red-600 mb-2">⚠ {error}</p>}
      {saved && <p className="text-green-600 mb-2">✅ Widget settings saved!</p>}

      <div className="flex gap-4 mb-4">
        <button
          className="bg-black text-white px-4 py-2 rounded"
          onClick={handleSave}
        >
          Save Settings
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleGenerateCode}
        >
          Generate Embed Code
        </button>
      </div>

      {embedCode && (
        <div className="mt-6">
          <label className="block font-medium mb-1">Embed Code</label>
          <textarea
            readOnly
            className="w-full p-2 border rounded text-xs h-32 bg-gray-50"
            value={embedCode}
          />
        </div>
      )}
    </div>
  );
}
