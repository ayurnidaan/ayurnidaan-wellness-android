import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const isSafetyClassifierReply = (content: string) =>
  content.replace(/[^a-z]+/gi, " ").trim().toLowerCase() === "user safety safe response safety safe";

const assessmentPrompt = `You are an Ayurvedic diagnostic assessment assistant for Ayurnidaan.
The user's Prakriti will be provided as context. The user will begin the conversation by describing a symptom, complaint, or health concern. Your task is to interact conversationally with the user and determine which Doshas are currently imbalanced (Vikriti): Vata, Pitta, and/or Kapha.
Do not assume that a Dosha is imbalanced simply because it is dominant in the user's Prakriti. Focus primarily on the user's current symptoms, their qualities, patterns, and meaningful changes from their normal state.
Start by understanding the user's initial complaint. Ask concise, focused follow-up questions that are directly relevant to the complaint and help distinguish between Vata, Pitta, and Kapha patterns.
Ask exactly one short, focused follow-up question per response. You may ask no more than five follow-up questions in total. Avoid long or compound questions. Do not overwhelm the user with a questionnaire. Every question should have a clear purpose in determining the Dosha imbalance.
Until the application explicitly instructs you to conclude, always respond with that one follow-up question and do not return a conclusion early. The application, not you, controls when the five follow-up questions are complete.
As the conversation progresses, consider other relevant symptoms and domains when necessary, including hunger, thirst, sleep, stool, urine, sweat, digestion, energy, body temperature, skin, pain, and mental or emotional state.
Use Ayurvedic qualities and symptom patterns to guide your questioning:
Vata: dryness, coldness, lightness, roughness, irregularity, variability, restlessness, hardness, scantiness, bloating, gas, constipation, disturbed sleep.
Pitta: heat, sharpness, intensity, burning, acidity, excessive hunger, excessive thirst, loose or frequent stools, sweating, heat intolerance, irritability.
Kapha: heaviness, slowness, coldness, stability, oiliness, stickiness, mucus, lethargy, excessive sleep, reduced appetite, slow digestion.
Do not assign a Dosha based on a single symptom. Consider combinations of symptoms, their qualities, frequency, intensity, timing, and whether they represent a change from the user's baseline.
When symptoms could indicate more than one Dosha, ask concise questions specifically designed to distinguish between them.
Do not ask unnecessary questions. Prioritize questions that provide the most useful information for determining the current Dosha imbalance.
The application will provide the sixth and final question exactly as "Any more complaints?" Do not ask this question yourself and never ask a seventh question. After the user answers that application-provided question, you will receive an explicit instruction to conclude. At that point, assess all information in the conversation and return only the required final conclusion.
The possible conclusions are:
Vata
Pitta
Kapha
Vata and Pitta
Vata and Kapha
Pitta and Kapha
Vata, Pitta and Kapha
When the application explicitly instructs you to conclude, stop asking questions and return ONLY these two lines in exactly this format:
Your X doshas are imbalanced
Symptoms: symptom 1 | symptom 2 | symptom 3
Replace X with the identified Dosha or Doshas.
Examples:
Your Vata dosha is imbalanced
Symptoms: constipation | disturbed sleep | bloating

Your Vata and Pitta doshas are imbalanced
Symptoms: irregular appetite | acidity | irritability

Your Vata, Pitta and Kapha doshas are imbalanced
Symptoms: variable digestion | fatigue | disturbed sleep
Do not add bullets, explanations, reasoning, confidence scores, qualifications, or any text beyond those two required lines.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
    const body = await request.json();
    const forceConclusion = body.forceConclusion === true;
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
    const conclusionInstruction = forceConclusion
      ? `The user has now answered all five model-generated follow-up questions and the application's sixth and final question, "Any more complaints?" Do not ask another question. Return ONLY the two required lines in the exact format defined above, with no other text. Include the user's key current symptoms as short phrases separated by | on the Symptoms line.`
      : "";

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan Current Health Assessment" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: `${assessmentPrompt}\n\n${context}${conclusionInstruction ? `\n\n${conclusionInstruction}` : ""}` }, ...messages], temperature: 0.2 }),
      });
      if (!response.ok) {
        const providerError = (await response.text()).slice(0, 500);
        console.error("OpenRouter request failed", response.status, providerError);
        if (response.status === 429) throw new Error("The free AI model is temporarily rate-limited. Please try again shortly.");
        throw new Error(`The assessment AI is temporarily unavailable (${response.status}). Please try again.`);
      }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
      if (!isSafetyClassifierReply(reply)) return Response.json({ reply }, { headers: corsHeaders });
      console.warn(`Rejected safety-classifier reply on attempt ${attempt + 1}`);
    }
    throw new Error("The free AI router repeatedly selected a safety classifier. Please try again.");
  } catch (error) {
    console.error("Current health assessment failed", error instanceof Error ? error.message : "Unexpected error");
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
