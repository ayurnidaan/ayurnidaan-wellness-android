import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const isSafetyClassifierReply = (content: string) =>
  content.replace(/[^a-z]+/gi, " ").trim().toLowerCase() === "user safety safe response safety safe";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { messages = [] } = await request.json();
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL");
    if (!apiKey || !model) return Response.json({ reply: "Upcoming feature" }, { headers: corsHeaders });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan" },
        body: JSON.stringify({ model, messages, temperature: 0.4 }),
      });
      if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!isSafetyClassifierReply(reply)) return Response.json({ reply: reply || "Upcoming feature" }, { headers: corsHeaders });
      console.warn(`Rejected safety-classifier reply on attempt ${attempt + 1}`);
    }
    throw new Error("The free AI router repeatedly selected a safety classifier. Please try again.");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
