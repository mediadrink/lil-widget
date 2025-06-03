// LIL Widget MVP - Widget Chat with OpenAI API backend
"use client";

import { useState } from 'react';

export default function WidgetDemo() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, widgetId: "demo123" }),
    });

    if (!res.ok) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Failed to connect to AI backend.' }]);
      setLoading(false);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full bg-white shadow-lg border rounded-xl p-4 z-50">
      <h2 className="text-lg font-semibold mb-2">💬 LIL Widget</h2>
      <div className="h-48 overflow-y-auto text-sm mb-2 border p-2 rounded">
        {messages.map((m, i) => (
          <div key={i} className="mb-1">
            <strong>{m.role === 'user' ? 'You' : 'Bot'}:</strong> {m.content}
          </div>
        ))}
        {loading && <div>Typing...</div>}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        className="w-full border rounded p-2 text-sm"
        placeholder="Type a message..."
      />
      <button
        onClick={sendMessage}
        className="mt-2 bg-black text-white w-full py-2 rounded text-sm"
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
