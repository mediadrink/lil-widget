// app/api/conversations/[conversationId]/messages/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ conversationId: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const supabase = await supabaseServer();
  const params = await context.params;
  const conversationId = String(params?.conversationId ?? "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!conversationId)
    return Response.json({ error: "conversationId required" }, { status: 400 });

  // Confirm ownership via join
  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select(
      `
      id,
      widget_id,
      widgets!inner(id, owner_id)
    `
    )
    .eq("id", conversationId)
    .single();

  if (convErr || !conv) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Handle widgets as array (Supabase typing issue with joins)
  const widget = Array.isArray(conv.widgets) ? conv.widgets[0] : conv.widgets;
  if (widget?.owner_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ messages: data ?? [] });
}
