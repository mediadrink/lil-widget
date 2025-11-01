// app/api/widgets/[id]/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    .select("id, title, owner_id")
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

  // If widget hasn't been installed yet, don't show conversation summary
  if (!firstPing) {
    return Response.json({
      summary: "Hi! Your widget hasn't been installed yet. Once visitors start chatting, you'll see insights here!",
      conversationCount: 0,
      categories: [],
    });
  }

  // Get conversations from last 24 hours (exclude test conversations)
  // ONLY count conversations that happened AFTER first widget installation
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const installTime = firstPing.created_at;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, started_at")
    .eq("widget_id", widgetId)
    .eq("is_test", false)
    .gte("started_at", oneDayAgo)
    .gte("started_at", installTime); // Only after installation

  if (!conversations || conversations.length === 0) {
    return Response.json({
      summary: "Hi! No conversations in the last 24 hours. Your widget is ready and waiting for visitors!",
      conversationCount: 0,
      categories: [],
    });
  }

  // Get all messages from those conversations
  const conversationIds = conversations.map((c) => c.id);
  const { data: messages } = await supabase
    .from("messages")
    .select("role, content, conversation_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return Response.json({
      summary: `Hi! You had ${conversations.length} conversation${conversations.length > 1 ? "s" : ""} started in the last 24 hours, but no messages yet.`,
      conversationCount: conversations.length,
      categories: [],
    });
  }

  // Group messages by conversation
  const conversationTexts = conversationIds.map((convId) => {
    const convMessages = messages.filter((m) => m.conversation_id === convId);
    return convMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
  });

  // Use GPT-4 to analyze and summarize
  const systemPrompt = `You are analyzing customer conversations for a business widget. Create a friendly, conversational daily summary.

Guidelines:
- Start with "Hi!" and mention the total number of conversations
- Categorize common topics (e.g., "5 people were asking about directions", "3 wanted pricing info", "4 requested to speak with someone")
- Identify patterns and insights
- Suggest actionable improvements in a friendly way (e.g., "I noticed customers are confused about X - consider adding a rule about Y")
- Keep it warm, helpful, and conversational
- Be specific with numbers and categories
- Limit to 3-4 sentences

Format example:
"Hi! We had 12 conversations today. 5 people were asking about directions to your location, 3 wanted pricing information, and 4 requested to speak with someone directly. I noticed several customers are confused about your business hours - consider adding a rule that clearly states your hours upfront!"`;

  const conversationSample =
    conversationTexts.length > 10
      ? conversationTexts.slice(0, 10).join("\n\n---\n\n") +
        "\n\n[...and more conversations]"
      : conversationTexts.join("\n\n---\n\n");

  try {
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Analyze these ${conversations.length} conversations and create a friendly daily summary:\n\n${conversationSample}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const summary =
      chatResponse.choices?.[0]?.message?.content ||
      `Hi! You had ${conversations.length} conversation${conversations.length > 1 ? "s" : ""} today.`;

    // Extract categories if possible (simple regex parsing)
    const categoryMatches = summary.match(/(\d+)\s+(?:people\s+)?(?:were\s+)?(?:asking|wanted|requested)[^.!?]*/g) || [];
    const categories = categoryMatches.map((match) => match.trim());

    return Response.json({
      summary,
      conversationCount: conversations.length,
      messageCount: messages.length,
      categories,
      timeRange: "last 24 hours",
    });
  } catch (error) {
    console.error("OpenAI summary error:", error);
    return Response.json(
      {
        summary: `Hi! You had ${conversations.length} conversation${conversations.length > 1 ? "s" : ""} in the last 24 hours with ${messages.length} total messages. I'm having trouble analyzing them right now - please try refreshing.`,
        conversationCount: conversations.length,
        messageCount: messages.length,
        categories: [],
      },
      { status: 200 }
    );
  }
}
