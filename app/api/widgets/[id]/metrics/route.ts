// app/api/widgets/[id]/metrics/route.ts
import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const params = await context.params;
  const supabase = await supabaseServer();
  const widgetId = String(params?.id ?? "").trim();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!widgetId)
    return Response.json({ error: "widgetId required" }, { status: 400 });

  // Verify ownership
  const { data: widget, error: widgetErr } = await supabase
    .from("widgets")
    .select("id, owner_id")
    .eq("id", widgetId)
    .single();

  if (widgetErr || !widget) {
    return Response.json({ error: "Widget not found" }, { status: 404 });
  }
  if (widget.owner_id !== user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if widget has been installed (has pings)
  const { data: firstPing } = await supabase
    .from("widget_pings")
    .select("created_at")
    .eq("widget_id", widgetId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  // If widget hasn't been installed yet, return zeros
  if (!firstPing) {
    return Response.json({
      conversationsByDay: [],
      totalConversations: 0,
      avgMessagesPerConvo: 0,
      totalMessages: 0,
      monthlySessionsUsed: 0,
    });
  }

  // Get conversations from last 7 days (exclude test conversations)
  // ONLY count conversations that happened AFTER first widget installation
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const installTime = firstPing.created_at;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, started_at")
    .eq("widget_id", widgetId)
    .eq("is_test", false)
    .gte("started_at", sevenDaysAgo)
    .gte("started_at", installTime) // Only after installation
    .order("started_at", { ascending: true });

  // Get conversations from this month for usage tracking
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data: monthlyConversations } = await supabase
    .from("conversations")
    .select("id")
    .eq("widget_id", widgetId)
    .eq("is_test", false)
    .gte("started_at", startOfMonth.toISOString())
    .gte("started_at", installTime); // Only after installation

  if (!conversations || conversations.length === 0) {
    return Response.json({
      conversationsByDay: [],
      totalConversations: 0,
      avgMessagesPerConvo: 0,
      totalMessages: 0,
      monthlySessionsUsed: monthlyConversations?.length || 0,
    });
  }

  // Get all messages from those conversations
  const conversationIds = conversations.map((c) => c.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, role, created_at")
    .in("conversation_id", conversationIds);

  // Group conversations by day
  const conversationsByDay: { [key: string]: number } = {};
  conversations.forEach((c) => {
    const day = new Date(c.started_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    conversationsByDay[day] = (conversationsByDay[day] || 0) + 1;
  });

  // Calculate average messages per conversation
  const totalMessages = messages?.length || 0;
  const avgMessagesPerConvo =
    conversations.length > 0
      ? Math.round(totalMessages / conversations.length)
      : 0;

  // Build 7-day chart data (fill in missing days with 0)
  const chartData: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const day = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    chartData.push({
      day,
      count: conversationsByDay[day] || 0,
    });
  }

  return Response.json({
    conversationsByDay: chartData,
    totalConversations: conversations.length,
    avgMessagesPerConvo,
    totalMessages,
    monthlySessionsUsed: monthlyConversations?.length || 0,
  });
}
