// File: /app/widget-frame/page.tsx

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChatMessage } from "@/components/ChatMessage";

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
        <div className="h-48 overflow-y-auto bg-gray-50 p-2 rounded space-y-2">
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              variant="widget"
              className={m.role === "user" ? "!ml-0" : "!mr-0"}
            />
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
