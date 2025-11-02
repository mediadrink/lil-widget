// File: /app/widget-frame/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";

// Parse markdown for chat messages
function parseMarkdown(text: string): string {
  if (!text) return '';
  let html = text;

  // Escape HTML for XSS protection
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');

  // Lists before line breaks
  html = html.replace(/^[\-\*•]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li style="list-style-type: decimal;">$1</li>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p style="margin: 0.5em 0;">');
  html = html.replace(/\n/g, '<br>');

  // Wrap lists
  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>(?:<br>|<br\/>|\s)*)+/g, function(match) {
    const cleanedMatch = match.replace(/<br\s*\/?>/g, '');
    if (match.includes('list-style-type: decimal')) {
      return '<ol style="margin: 0.5em 0; padding-left: 1.5em;">' + cleanedMatch + '</ol>';
    } else {
      return '<ul style="margin: 0.5em 0; padding-left: 1.5em; list-style-type: disc;">' + cleanedMatch + '</ul>';
    }
  });

  return html;
}

function WidgetFrame() {
  const params = useSearchParams();
  const uid = params.get("uid");
  const supabase = createClient();
  const [widget, setWidget] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();
      if (!error) setWidget(data);
    })();
  }, [uid, supabase]);

  const sendMessage = async () => {
    if (!input.trim() || !widget?.id) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          widgetId: widget.id,
          persona: widget.persona,
          instructions: widget.instructions,
        }),
      });
      const data = await res.json();
      const reply = data?.reply || "⚠️ No response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: "assistant", content: "⚠️ Server error." }]);
    }
  };

  if (!widget) return <p className="p-4">Loading widget...</p>;

  return (
    <div className="p-4 max-w-md mx-auto font-sans text-sm">
      <div className="bg-white border rounded shadow p-4 space-y-2">
        <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <span className={`inline-block px-3 py-2 rounded ${m.role === "user" ? "bg-blue-100" : "bg-green-100"}`}>
                {m.role === "assistant" ? (
                  <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.content) }} />
                ) : (
                  m.content
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border px-2 py-1 rounded"
            placeholder="Ask a question..."
          />
          <button
            onClick={sendMessage}
            className="bg-black text-white px-3 py-1 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WidgetFramePage() {
  return (
    <Suspense fallback={<p className="p-4">Loading widget...</p>}>
      <WidgetFrame />
    </Suspense>
  );
}
