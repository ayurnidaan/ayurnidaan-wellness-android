import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { messages = [] } = await request.json();
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL");
    if (!apiKey || !model) return Response.json({ reply: "Upcoming feature" }, { headers: corsHeaders });
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan" },
      body: JSON.stringify({ model, messages, temperature: 0.4 }),
    });
    if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
    const data = await response.json();
    return Response.json({ reply: data.choices?.[0]?.message?.content ?? "Upcoming feature" }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
