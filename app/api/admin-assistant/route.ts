// app/api/admin-assistant/route.ts
// Admin AI assistant for generating widget rule suggestions
// Expects: { message: string, widget_id: string }
// Returns: { reply: string }

import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // Require an authenticated user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error('Auth error:', authErr);
    }
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse body
    const body = await req.json().catch(() => ({} as any));
    const message = String(body?.message ?? '').trim();
    const widget_id = String(body?.widget_id ?? '').trim();

    if (!message || !widget_id) {
      return NextResponse.json(
        { error: 'message and widget_id are required' },
        { status: 400 }
      );
    }

    // Fetch widget details
    const { data: widget } = await supabase
      .from('widgets')
      .select('title, url, persona_text')
      .eq('id', widget_id)
      .single();

    // Fetch existing rules
    const { data: existingRules } = await supabase
      .from('widget_rules')
      .select('text')
      .eq('widget_id', widget_id)
      .order('created_at', { ascending: false });

    // Fetch recent conversations for context
    const { data: recentConvos } = await supabase
      .from('conversations')
      .select('id')
      .eq('widget_id', widget_id)
      .order('started_at', { ascending: false })
      .limit(5);

    let conversationContext = '';
    if (recentConvos && recentConvos.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .in('conversation_id', recentConvos.map(c => c.id))
        .limit(20);

      if (messages && messages.length > 0) {
        conversationContext = '\n\nRecent conversation samples:\n';
        messages.forEach((msg, idx) => {
          conversationContext += `${msg.role}: ${msg.content.substring(0, 100)}...\n`;
        });
      }
    }

    // Build system prompt for the admin assistant
    const systemPrompt = `You are an AI assistant helping a widget admin optimize their chatbot.

Widget Details:
- Title: ${widget?.title || 'Untitled'}
- URL: ${widget?.url || 'Not set'}
- Persona: ${widget?.persona_text || 'Not set'}

Existing Rules (${existingRules?.length || 0}):
${existingRules?.map((r, i) => `${i + 1}. ${r.text}`).join('\n') || 'No rules yet'}
${conversationContext}

Your job is to:
1. Analyze the admin's request
2. Suggest specific, actionable rules to improve the chatbot
3. Consider tone, safety, routing, lead capture, and user experience
4. Format suggestions as a numbered list of clear, concise rules (max 280 chars each)
5. Be specific and practical - avoid generic advice

If the admin asks for specific improvements, provide 3-5 targeted rules.
If they ask general questions, provide thoughtful analysis with 2-3 suggested rules.`;

    // Call OpenAI for admin assistant reply
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = chatResponse.choices?.[0]?.message?.content || 'I could not generate suggestions at this time.';

    // Optionally: Parse suggestions and store in suggested_rules table
    // For now, we'll just return the reply and let the UI handle adding to rules

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Admin assistant error:', err);
    return NextResponse.json(
      { error: (err as Error).message ?? 'Server error' },
      { status: 500 }
    );
  }
}
