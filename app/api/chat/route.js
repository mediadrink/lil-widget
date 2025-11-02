import { OpenAI } from "openai";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rateLimit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  // Rate limiting - prevent bot abuse
  const clientIp = getClientIp(req);
  const rateLimitKey = `chat:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.WIDGET_CHAT);

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimit.reset).toISOString(),
          "Retry-After": Math.ceil((rateLimit.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const { message, widgetId, persona, instructions } = await req.json();

  if (!message || !widgetId) {
    return new Response(
      JSON.stringify({ error: "Missing fields" }),
      {
        status: 400,
        headers: {
          "X-RateLimit-Limit": rateLimit.limit.toString(),
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
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
  return new Response(
    JSON.stringify({ reply }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": rateLimit.limit.toString(),
        "X-RateLimit-Remaining": rateLimit.remaining.toString(),
      },
    }
  );
}
