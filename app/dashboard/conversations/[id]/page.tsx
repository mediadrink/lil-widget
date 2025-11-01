// app/dashboard/conversations/[id]/page.tsx
import { supabaseAdmin } from "@/utils/supabase/serverAdmin"; 
// If the "@/..." alias fails in your project, use:
// import { supabaseAdmin } from "../../../../utils/supabase/serverAdmin";

export const dynamic = "force-dynamic";

export default async function ConversationThread({ params }: { params: Promise<{ id: string }> }) {
  const { id: convId } = await params;

  const [{ data: conv, error: convErr }, { data: msgs, error: msgsErr }] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("id, widget_id, started_at, status, rules_version_used")
      .eq("id", convId)
      .single(),
    supabaseAdmin
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true }),
  ]);

  if (convErr) console.error("Conversation load error:", convErr);
  if (msgsErr) console.error("Messages load error:", msgsErr);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">
        Conversation {conv?.id?.slice(0, 8)}…
      </h1>
      <div className="text-sm text-gray-500 mb-4">
        Widget {conv?.widget_id?.slice(0, 8)}… • Status {conv?.status} • Rules v{conv?.rules_version_used ?? "—"}
      </div>

      <div className="space-y-3">
        {(msgs ?? []).map((m) => (
          <div key={m.id} className={`rounded p-3 border ${m.role === "user" ? "bg-white" : "bg-gray-50"}`}>
            <div className="text-xs uppercase text-gray-500 mb-1">{m.role}</div>
            <div className="whitespace-pre-wrap">{m.content}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(m.created_at as any).toLocaleString()}
            </div>
          </div>
        ))}
        {(!msgs || msgs.length === 0) && <div className="text-gray-500">No messages.</div>}
      </div>
    </main>
  );
}
