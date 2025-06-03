export async function POST(req) {
  const { message, widgetId } = await req.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    }),
  });

  const data = await res.json();

  return new Response(JSON.stringify({ reply: data.choices[0].message.content }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Allow all origins for now
    },
  });
}
