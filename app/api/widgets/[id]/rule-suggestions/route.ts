// app/api/widgets/[id]/rule-suggestions/route.ts
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

  // Get conversations from last 24 hours (exclude test conversations)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, started_at")
    .eq("widget_id", widgetId)
    .eq("is_test", false)
    .gte("started_at", oneDayAgo);

  if (!conversations || conversations.length === 0) {
    return Response.json({
      suggestions: [],
      message: "No recent conversations to analyze",
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
      suggestions: [],
      message: "No messages to analyze",
    });
  }

  // Group messages by conversation
  const conversationTexts = conversationIds.map((convId) => {
    const convMessages = messages.filter((m) => m.conversation_id === convId);
    return convMessages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");
  });

  // Use GPT-4 to generate rule suggestions
  const systemPrompt = `You are analyzing customer conversations to suggest actionable widget rules.

Your task: Suggest 1-3 specific, actionable rules that would improve this widget's performance.

Good rule suggestions:
- "Always mention business hours: Mon-Fri 9am-5pm, Sat 10am-2pm"
- "For location questions, recommend the closest of our 3 locations: Downtown, Westside, Eastside"
- "If asked about pricing, always mention our free consultation before giving estimates"
- "When visitors ask about appointments, provide the booking link: calendly.com/example"

Bad rule suggestions:
- "Be more helpful" (too vague)
- "Answer questions better" (not actionable)
- "Improve responses" (not specific)

Rules should be:
1. SPECIFIC - Include exact information (hours, locations, prices, links)
2. ACTIONABLE - Can be immediately implemented
3. USEFUL - Address common questions or pain points
4. CLEAR - Business owner understands exactly what to add

Return ONLY a JSON array of 1-3 suggestions (no more than 3):
[
  {
    "rule": "The specific rule text to add",
    "reason": "Why this rule would help (1 sentence)"
  }
]

If conversations don't suggest any good rules, return an empty array: []`;

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
          content: `Analyze these ${conversations.length} conversations and suggest 1-3 actionable rules:\n\n${conversationSample}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = chatResponse.choices?.[0]?.message?.content || "[]";

    // Parse JSON response
    let suggestions = [];
    try {
      // Extract JSON array from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(responseText);
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", responseText);
      suggestions = [];
    }

    // Add unique IDs to suggestions
    const suggestionsWithIds = suggestions.map((s: any, idx: number) => ({
      id: `suggestion-${Date.now()}-${idx}`,
      rule: s.rule || "",
      reason: s.reason || "",
    }));

    return Response.json({
      suggestions: suggestionsWithIds,
      conversationCount: conversations.length,
    });
  } catch (error) {
    console.error("OpenAI suggestion error:", error);
    return Response.json(
      {
        suggestions: [],
        error: "Failed to generate suggestions",
      },
      { status: 200 }
    );
  }
}
