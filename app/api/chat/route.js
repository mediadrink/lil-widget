export async function POST(req) {
  const body = await req.json();
  const { message, widgetId } = body;

  const SYSTEM_PROMPTS = {
    demo123: "You are LIL Widget, a helpful assistant built to answer questions clearly and politely.",
  };

  const systemPrompt = SYSTEM_PROMPTS[widgetId] || "You are a helpful assistant.";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("OpenAI API response missing reply:", JSON.stringify(data, null, 2));
      return Response.json({ reply: "⚠️ No reply from GPT." }, { status: 500 });
    }

    return Response.json({ reply });
  } catch (err) {
    console.error("OpenAI API error:", err);
    return Response.json({ reply: "⚠️ Error reaching LIL Widget backend." }, { status: 500 });
  }
}
