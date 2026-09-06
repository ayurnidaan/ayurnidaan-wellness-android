import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const isSafetyClassifierReply = (content: string) => content.replace(/[^a-z]+/gi, " ").trim().toLowerCase() === "user safety safe response safety safe";
const redFlagPatterns = [
  /\b(chest pain|chest pressure|chest tightness)\b/i,
  /\b(can(?:not|'t) breathe|severe shortness of breath|struggling to breathe|choking)\b/i,
  /\b(face droop|one[- ]sided weakness|slurred speech|signs? of (?:a )?stroke)\b/i,
  /\b(fainted|fainting|unconscious|unresponsive|seizure)\b/i,
  /\b(severe bleeding|bleeding heavily|vomiting blood|coughing blood|black tarry stool)\b/i,
  /\b(anaphylaxis|throat (?:is )?swelling|swollen tongue)\b/i,
  /\b(overdose|poisoning|suicidal|suicide|kill myself|self[- ]harm)\b/i,
  /\b(sudden (?:worst|severe) headache|worst headache of my life)\b/i,
];
const containsRedFlag = (text: string) => redFlagPatterns.some((pattern) => pattern.test(text));
const RED_FLAG_REPLY = "AYURNIDAAN_RED_FLAG_DETECTED";
const SAFE_REPLY = "AYURNIDAAN_NO_RED_FLAG";
const classifyRedFlag = async (apiKey: string, model: string, text: string) => {
  const prompt = `You are a medical safety classifier. Decide whether the user's latest message describes a potential emergency or urgent red flag where an Ayurveda wellness chatbot must stop and direct the user to a doctor or emergency services. Red flags include chest pain or pressure, severe breathing difficulty, stroke signs, fainting or unconsciousness, seizures, severe bleeding, anaphylaxis, overdose or poisoning, suicidal intent or self-harm, and sudden severe headache. Do not classify routine or mild symptoms as red flags. Return exactly one string and nothing else: ${RED_FLAG_REPLY} or ${SAFE_REPLY}.`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan Safety Check" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: prompt }, { role: "user", content: text }], temperature: 0, max_tokens: 20 }),
    });
    if (!response.ok) throw new Error(`Safety classifier request failed (${response.status})`);
    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (result === RED_FLAG_REPLY) return true;
    if (result === SAFE_REPLY) return false;
  }
  throw new Error("The safety classifier did not return a valid decision");
};
const ageFromDateOfBirth = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const birth = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
};

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
    if (!messages.length) return Response.json({ error: "A chat message is required" }, { status: 400, headers: corsHeaders });
    const newestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    const model = Deno.env.get("OPENROUTER_MODEL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!apiKey || !model || !supabaseUrl || !anonKey) throw new Error("AI chat service is not configured");
    const llmDetectedRedFlag = await classifyRedFlag(apiKey, model, newestUserMessage);
    if (llmDetectedRedFlag || containsRedFlag(newestUserMessage)) {
      return Response.json({ red_flag: true, reply: RED_FLAG_REPLY, safety_code: RED_FLAG_REPLY }, { headers: corsHeaders });
    }
    const requestHeaders = { Authorization: authorization, apikey: anonKey };
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: requestHeaders });
    if (!userResponse.ok) return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });
    const user = await userResponse.json();
    if (!user?.id) return Response.json({ error: "Invalid session" }, { status: 401, headers: corsHeaders });

    const userId = encodeURIComponent(user.id);
    const [profileResponse, prakritiResponse, vikritiResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/profiles?select=date_of_birth,height_cm,weight_kg,ai_context_enabled&user_id=eq.${userId}&limit=1`, { headers: requestHeaders }),
      fetch(`${supabaseUrl}/rest/v1/prakriti_assessments?select=vata_percentage,pitta_percentage,kapha_percentage&user_id=eq.${userId}&order=completed_at.desc&limit=1`, { headers: requestHeaders }),
      fetch(`${supabaseUrl}/rest/v1/current_health_assessments?select=conclusion,symptoms,vata_imbalanced,pitta_imbalanced,kapha_imbalanced&user_id=eq.${userId}&order=completed_at.desc&limit=1`, { headers: requestHeaders }),
    ]);
    const [profile] = profileResponse.ok ? await profileResponse.json() : [];
    const [prakriti] = prakritiResponse.ok ? await prakritiResponse.json() : [];
    const [vikriti] = vikritiResponse.ok ? await vikritiResponse.json() : [];
    const prakritiText = prakriti ? `Vata ${prakriti.vata_percentage}%, Pitta ${prakriti.pitta_percentage}%, Kapha ${prakriti.kapha_percentage}%` : "Not available";
    const imbalancedDoshas = vikriti ? [vikriti.vata_imbalanced && "Vata", vikriti.pitta_imbalanced && "Pitta", vikriti.kapha_imbalanced && "Kapha"].filter(Boolean) : [];
    const vikritiText = vikriti ? (imbalancedDoshas.length ? imbalancedDoshas.join(", ") : vikriti.conclusion || "No imbalance identified") : "Not available";
    const symptoms = Array.isArray(vikriti?.symptoms) ? vikriti.symptoms.filter((item: unknown) => typeof item === "string").join(", ") : "Not available";
    const age = ageFromDateOfBirth(profile?.date_of_birth);
    const optionalContext = profile?.ai_context_enabled === true ? [
      age !== null ? `Age: ${age}` : null,
      Number.isFinite(Number(profile.height_cm)) ? `Height: ${Number(profile.height_cm)} cm` : null,
      Number.isFinite(Number(profile.weight_kg)) ? `Weight: ${Number(profile.weight_kg)} kg` : null,
    ].filter(Boolean) : [];
    const systemPrompt = `You are AI Vaidya, a concise Ayurveda wellness assistant. Do not diagnose, prescribe, or claim to cure disease. Encourage professional or emergency care where appropriate. Use the following verified assessment context without inventing missing details.\nPrakriti: ${prakritiText}\nVikriti: ${vikritiText}\nSymptoms: ${symptoms}${optionalContext.length ? `\nOptional profile context (the user consented to AI context):\n${optionalContext.join("\n")}` : ""}`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, ...messages], temperature: 0.4 }),
      });
      if (!response.ok) throw new Error(`OpenRouter request failed (${response.status})`);
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!isSafetyClassifierReply(reply)) return Response.json({ reply: reply || "I could not prepare a response. Please try again." }, { headers: corsHeaders });
      console.warn(`Rejected safety-classifier reply on attempt ${attempt + 1}`);
    }
    throw new Error("The AI service could not prepare a response. Please try again.");
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
