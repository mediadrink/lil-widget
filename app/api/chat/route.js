export async function POST(req) {
  try {
    const body = await req.json();
    const { message, widgetId } = body;

    const SYSTEM_PROMPTS = {
      demo123: "You are LIL Widget, a helpful assistant built to answer questions clearly and politely.",
    };

    const systemPrompt = SYSTEM_PROMPTS[widgetId] || "You are a helpful assistant.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await response.json();

    console.log("🧠 OpenAI Response:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]?.message?.content) {
      return Response.json({ reply: "⚠️ GPT responded with no message." }, { status: 500 });
    }

    return Response.json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error("🚨 /api/chat error:", err);
    return Response.json({ reply: "⚠️ Internal server error." }, { status: 500 });
  }
}
