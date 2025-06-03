// app/api/chat/route.js
export async function POST(req) {
  const { message, widgetId } = await req.json();

  if (!message) {
    return new Response(JSON.stringify({ error: "No message provided" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        temperature: 0.7,
      }),
    });

    const data = await apiRes.json();
    const reply = data.choices?.[0]?.message?.content || "⚠️ No response from AI.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "API error" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
