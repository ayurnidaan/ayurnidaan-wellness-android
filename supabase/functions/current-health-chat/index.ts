import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const assessmentPrompt = `You are an Ayurvedic diagnostic assessment assistant for Ayurnidaan.

The user's Prakriti will be provided to you as context. Your task is to interact conversationally with the user and determine which Doshas are currently imbalanced (Vikriti): Vata, Pitta, and/or Kapha.

Prakriti represents the user's constitutional baseline. Do not assume that a Dosha is imbalanced simply because it is dominant in the user's Prakriti. Focus on the user's current symptoms and meaningful changes from their normal state.

Ask the user questions progressively rather than presenting a long questionnaire. Begin with high-value questions and use the user's answers to decide what to ask next. Continue asking questions until you have enough evidence to confidently determine the imbalanced Dosha(s).

Assess symptoms particularly across:

- Hunger and appetite
- Thirst
- Sleep
- Stool and bowel habits
- Urine
- Sweat
- Digestion
- Energy
- Body temperature and heat/cold sensitivity
- Skin
- Pain
- Mental and emotional state
- Any significant recent changes from the user's normal condition

Pay attention to Ayurvedic qualities and patterns.

Vata: dryness, coldness, lightness, roughness, irregularity, variability, restlessness, hardness, scantiness, bloating, gas, constipation, disturbed sleep.

Pitta: heat, sharpness, intensity, burning, acidity, excessive hunger, excessive thirst, loose/frequent stools, sweating, heat intolerance, irritability.

Kapha: heaviness, slowness, coldness, stability, oiliness, stickiness, mucus, lethargy, excessive sleep, reduced appetite, slow digestion.

Do not assign a Dosha based on a single symptom. Consider combinations of symptoms, their qualities, frequency, intensity, timing, and whether they represent a change from the user's baseline.

When symptoms could indicate more than one Dosha, ask additional questions to distinguish between them.

The possible conclusions are:

- Vata
- Pitta
- Kapha
- Vata and Pitta
- Vata and Kapha
- Pitta and Kapha
- Vata, Pitta and Kapha

Do not conclude until you are sufficiently confident about which Doshas are currently imbalanced.

Once you are confident, stop asking questions and return ONLY the following exact format:

"Your X doshas are imbalanced"

Replace X with the identified Dosha or Doshas.

Examples:
"Your Vata dosha is imbalanced"
"Your Vata and Pitta doshas are imbalanced"
"Your Vata, Pitta and Kapha doshas are imbalanced"

Do not provide explanations, qualifications, confidence scores, or any additional text in the final conclusion.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
    const body = await request.json();
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((message) => (message?.role === "user" || message?.role === "assistant") && typeof message?.content === "string")
      .slice(-40)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }));
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!apiKey || !model || !supabaseUrl || !anonKey) throw new Error("Assessment service is not configured");

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { Authorization: authorization, apikey: anonKey } });
    if (!userResponse.ok) return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });
    const user = await userResponse.json();
    if (!user?.id) return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });

    const prakritiResponse = await fetch(`${supabaseUrl}/rest/v1/prakriti_assessments?select=vata_percentage,pitta_percentage,kapha_percentage&user_id=eq.${encodeURIComponent(user.id)}&order=completed_at.desc&limit=1`, {
      headers: { Authorization: authorization, apikey: anonKey },
    });
    if (!prakritiResponse.ok) {
      console.error("Prakriti lookup failed", prakritiResponse.status);
      throw new Error("Could not load your Prakriti context");
    }
    const [prakriti] = await prakritiResponse.json();
    if (!prakriti) return Response.json({ error: "Complete the Prakriti assessment first" }, { status: 400, headers: corsHeaders });
    const context = `The user's latest Prakriti is Vata ${prakriti.vata_percentage}%, Pitta ${prakriti.pitta_percentage}%, and Kapha ${prakriti.kapha_percentage}%.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan Current Health Assessment" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: `${assessmentPrompt}\n\n${context}` }, ...messages], temperature: 0.2 }),
    });
    if (!response.ok) {
      const providerError = (await response.text()).slice(0, 500);
      console.error("OpenRouter request failed", response.status, providerError);
      if (response.status === 429) throw new Error("The free AI model is temporarily rate-limited. Please try again shortly.");
      throw new Error(`The assessment AI is temporarily unavailable (${response.status}). Please try again.`);
    }
    const data = await response.json();
    return Response.json({ reply: data.choices?.[0]?.message?.content ?? "" }, { headers: corsHeaders });
  } catch (error) {
    console.error("Current health assessment failed", error instanceof Error ? error.message : "Unexpected error");
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
