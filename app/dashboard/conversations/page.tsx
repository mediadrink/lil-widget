// app/dashboard/conversations/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LilHelperButton } from "@/components/LilHelperButton";
import { ChatMessage, ChatMessagesContainer } from "@/components/ChatMessage";

type Conversation = {
  id: string;
  widget_id: string;
  widget_title: string;
  started_at: string;
  message_count: number;
  char_count: number;
};

type Message = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

async function fetchJSON<T = any>(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  try {
    return (await res.json()) as T;
  } catch {
    return {} as T;
  }
}

export default function ConversationsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  const [convos, setConvos] = React.useState<Conversation[]>([]);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);

  // For promoting to rule
  const [promoting, setPromoting] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON<{ conversations: Conversation[] }>(
          "/api/conversations"
        );
        setConvos(data?.conversations ?? []);
      } catch (err: any) {
        setToast(`Load failed: ${err.message || String(err)}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return convos;
    return convos.filter(
      (c) =>
        c.widget_title?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [convos, query]);

  async function openConversation(id: string) {
    setSelectedId(id);
    setMessages([]);
    setLoadingMsgs(true);
    try {
      const data = await fetchJSON<{ messages: Message[] }>(
        `/api/conversations/${id}/messages`
      );
      setMessages(data?.messages ?? []);
    } catch (err: any) {
      setToast(`Load messages failed: ${err.message || String(err)}`);
    } finally {
      setLoadingMsgs(false);
    }
  }

  async function promoteToRule(m: Message, widgetId: string) {
    const text = m.content.trim();
    if (!text) return;
    setPromoting(true);
    try {
      await fetchJSON(`/api/widget/${widgetId}/rules`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setToast("Promoted to rule.");
    } catch (err: any) {
      setToast(`Promote failed: ${err.message || String(err)}`);
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top Level Navigation */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Lil' Widget</div>
          <div className="flex items-center gap-6">
            <a
              className="text-sm font-medium hover:text-black text-neutral-500"
              href="/dashboard/widgets"
            >
              My Widgets
            </a>
            <a
              className="text-sm font-medium hover:text-black text-neutral-500"
              href="/dashboard/account"
            >
              Account
            </a>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Conversations list */}
        <section className="lg:col-span-1 bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Conversations</h2>
          <div className="mb-4">
            <input
              className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
              placeholder="Filter by widget title or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <ul className="divide-y border rounded-lg max-h-[72vh] overflow-auto">
            {filtered.length === 0 && (
              <li className="p-3 text-sm text-neutral-500">No conversations.</li>
            )}
            {filtered.map((c) => (
              <li
                key={c.id}
                className={cx(
                  "p-3 cursor-pointer hover:bg-neutral-50",
                  selectedId === c.id && "bg-neutral-50"
                )}
                onClick={() => openConversation(c.id)}
              >
                <div className="text-sm font-medium">{c.widget_title || "Untitled Widget"}</div>
                <div className="text-xs text-neutral-500">
                  {new Date(c.started_at).toLocaleString()} · {c.message_count} msgs · {c.char_count} chars
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">Conversation ID: {c.id}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Right: Messages */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-900 mb-6">Messages</h2>
          {!selectedId ? (
            <div className="text-sm text-neutral-600 text-center py-12">Select a conversation to view messages.</div>
          ) : loadingMsgs ? (
            <div className="text-sm text-neutral-600 text-center py-12 animate-pulse">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-neutral-600 text-center py-12">No messages in this conversation.</div>
          ) : (
            <ChatMessagesContainer variant="dashboard">
              {messages.map((m) => (
                <div key={m.id} className="border border-neutral-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={cx(
                        "text-xs font-semibold uppercase tracking-wide",
                        m.role === "user" ? "text-blue-600" : "text-neutral-900"
                      )}
                    >
                      {m.role === "user" ? "User" : "Assistant"}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                  <ChatMessage
                    role={m.role}
                    content={m.content}
                    variant="dashboard"
                    className="!ml-0 !mr-0"
                  />

                  {/* Promote to rule */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        const conv = convos.find((c) => c.id === m.conversation_id) ||
                                     convos.find((c) => c.id === selectedId!);
                        if (!conv) {
                          setToast("Widget not found for this conversation.");
                          return;
                        }
                        promoteToRule(m, conv.widget_id);
                      }}
                      disabled={promoting}
                      className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium text-xs px-4 py-2 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                    >
                      {promoting ? "Adding…" : "Promote to Rule"}
                    </button>
                  </div>
                </div>
              ))}
            </ChatMessagesContainer>
          )}
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-neutral-900 text-white text-sm px-6 py-3 shadow-xl flex items-center gap-3 animate-[slideUp_0.3s_ease-out]">
          <span>{toast}</span>
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Page loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm grid place-items-center">
          <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm">
            Loading…
          </div>
        </div>
      )}

      {/* Lil' Helper Floating Button */}
      <LilHelperButton />
    </div>
  );
}
