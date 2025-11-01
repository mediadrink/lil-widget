import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  const { message, widgetId, persona, instructions } = await req.json();

  if (!message || !widgetId) {
    return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
  }

  const messages = [];

  if (persona || instructions) {
    messages.push({
      role: "system",
      content: `${persona || ""} ${instructions || ""}`.trim(),
    });
  }

  messages.push({ role: "user", content: message });

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
  });

  const reply = chatResponse.choices?.[0]?.message?.content || "⚠️ No reply.";
  return new Response(JSON.stringify({ reply }), { status: 200 });
}
