import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const isSafetyClassifierReply = (content: string) =>
  content.replace(/[^a-z]+/gi, " ").trim().toLowerCase() === "user safety safe response safety safe";
const assessmentDomains = ["hunger", "thirst", "sleep", "stool", "urine", "sweat"] as const;
type AssessmentDomain = typeof assessmentDomains[number];
const domainKeywords: Record<AssessmentDomain, RegExp> = {
  hunger: /\b(hunger|hungry|appetite)\b/i,
  thirst: /\b(thirst|thirsty|water|fluids?)\b/i,
  sleep: /\b(sleep|sleeping|wake|waking|rest)\b/i,
  stool: /\b(stool|bowel|constipation|diarrh(?:ea|oea)|motion)\b/i,
  urine: /\b(urine|urinary|urinate|urination)\b/i,
  sweat: /\b(sweat|sweating|perspiration)\b/i,
};
const isQuestionReply = (content: string) => content.includes("?");
const isDomainQuestionReply = (content: string, domain: AssessmentDomain) => isQuestionReply(content) && domainKeywords[domain].test(content);
const isConclusionReply = (content: string) =>
  /Your\s+(?:Vata\s*,\s*Pitta\s+and\s+Kapha|Vata\s+and\s+Pitta|Vata\s+and\s+Kapha|Pitta\s+and\s+Kapha|Vata|Pitta|Kapha)\s+doshas?\s+(?:is|are)\s+imbalanced/i.test(content) &&
  /Symptoms\s*:\s*[^\r\n]+/i.test(content) &&
  /Reasoning\s*:\s*[^\r\n]+/i.test(content);

const assessmentPrompt = `You are an Ayurvedic diagnostic assessment assistant for Ayurnidaan.
The user's Prakriti will be provided as context. The user will begin the conversation by describing a symptom, complaint, or health concern. Your task is to interact conversationally with the user and determine which Doshas are currently imbalanced (Vikriti): Vata, Pitta, and/or Kapha.
Do not assume that a Dosha is imbalanced simply because it is dominant in the user's Prakriti. Focus primarily on the user's current symptoms, their qualities, patterns, and meaningful changes from their normal state.
The application controls the assessment in two question phases. Follow the phase instruction appended to this prompt exactly.
In the complaint phase, ask exactly one short, focused follow-up question directly relevant to the user's initial complaint. Across this phase, the application will request exactly three questions. Use each answer to make the next question more relevant and to distinguish between Vata, Pitta, and Kapha patterns.
In the domain phase, ask exactly one short question about the single required domain named by the application. The required domains are hunger, thirst, sleep, stool, urine, and sweat. Tailor the wording to the conversation where useful, but make the named domain explicit and do not combine it with another domain.
Until the application explicitly instructs you to conclude, return only the requested single question. Never return a conclusion early. Avoid long or compound questions and do not overwhelm the user.
You may consider other relevant information including digestion, energy, body temperature, skin, pain, and mental or emotional state when interpreting the answers, but do not add extra questions outside the controlled phases.
Use Ayurvedic qualities and symptom patterns to guide your questioning:
Vata: dryness, coldness, lightness, roughness, irregularity, variability, restlessness, hardness, scantiness, bloating, gas, constipation, disturbed sleep.
Pitta: heat, sharpness, intensity, burning, acidity, excessive hunger, excessive thirst, loose or frequent stools, sweating, heat intolerance, irritability.
Kapha: heaviness, slowness, coldness, stability, oiliness, stickiness, mucus, lethargy, excessive sleep, reduced appetite, slow digestion.
Do not assign a Dosha based on a single symptom. Consider combinations of symptoms, their qualities, frequency, intensity, timing, and whether they represent a change from the user's baseline.
When symptoms could indicate more than one Dosha, ask concise questions specifically designed to distinguish between them.
Do not ask unnecessary questions. Prioritize questions that provide the most useful information for determining the current Dosha imbalance.
After the user answers the three complaint-specific questions and all six domain questions, the application will provide the final question exactly as "Any more complaints?" Do not ask this question yourself. After the user answers that application-provided question, you will receive an explicit instruction to conclude. At that point, assess all information in the conversation and return the required structured result with concise reasoning.
The possible conclusions are:
Vata
Pitta
Kapha
Vata and Pitta
Vata and Kapha
Pitta and Kapha
Vata, Pitta and Kapha
When the application explicitly instructs you to conclude, stop asking questions and return ONLY these three lines in exactly this format:
Your X doshas are imbalanced
Symptoms: symptom 1 | symptom 2 | symptom 3
Reasoning: one concise sentence connecting the reported symptom patterns and relevant changes from baseline to the identified Dosha qualities
Replace X with the identified Dosha or Doshas.
Examples:
Your Vata dosha is imbalanced
Symptoms: constipation | disturbed sleep | bloating
Reasoning: The combination of dryness, irregular bowel habits, and disturbed sleep reflects a current Vata pattern beyond the user's baseline.

Your Vata and Pitta doshas are imbalanced
Symptoms: irregular appetite | acidity | irritability
Reasoning: Irregularity suggests Vata involvement, while acidity and heat-related irritability support a concurrent Pitta imbalance.

Your Vata, Pitta and Kapha doshas are imbalanced
Symptoms: variable digestion | fatigue | disturbed sleep
Reasoning: The reported variability, heat-related digestive changes, and heaviness show meaningful features of all three Doshas.
Do not add bullets, confidence scores, qualifications, medical diagnoses, or any text beyond those three required lines.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Authentication required" }, { status: 401, headers: corsHeaders });
    const body = await request.json();
    const forceConclusion = body.forceConclusion === true;
    const questionPhase = body.questionPhase === "domain" ? "domain" : "complaint";
    const requiredDomain = assessmentDomains.includes(body.requiredDomain) ? body.requiredDomain as AssessmentDomain : undefined;
    if (!forceConclusion && questionPhase === "domain" && !requiredDomain) {
      return Response.json({ error: "A valid assessment domain is required" }, { status: 400, headers: corsHeaders });
    }
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
    const responseInstruction = forceConclusion
      ? `The user has now answered all three complaint-specific follow-up questions, one question about each required domain (hunger, thirst, sleep, stool, urine, and sweat), and the application's final question, "Any more complaints?" Do not ask another question. Return ONLY the three required lines in the exact format defined above. Include the key current symptoms as short phrases separated by | and give one concise, evidence-based reasoning sentence.`
      : questionPhase === "domain"
        ? `DOMAIN PHASE: Ask exactly one short question specifically about ${requiredDomain}. Return only that question and make the ${requiredDomain} domain explicit.`
        : `COMPLAINT PHASE: Ask exactly one short follow-up question directly relevant to the user's initial complaint and prior answers. Return only that question.`;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-OpenRouter-Title": "Ayurnidaan Current Health Assessment" },
        body: JSON.stringify({ model, messages: [{ role: "system", content: `${assessmentPrompt}\n\n${context}\n\n${responseInstruction}` }, ...messages], temperature: 0.2 }),
      });
      if (!response.ok) {
        const providerError = (await response.text()).slice(0, 500);
        console.error("OpenRouter request failed", response.status, providerError);
        if (response.status === 429) throw new Error("The free AI model is temporarily rate-limited. Please try again shortly.");
        throw new Error(`The assessment AI is temporarily unavailable (${response.status}). Please try again.`);
      }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
      const validReply = forceConclusion
        ? isConclusionReply(reply)
        : questionPhase === "domain" && requiredDomain
          ? isDomainQuestionReply(reply, requiredDomain)
          : isQuestionReply(reply);
      if (!isSafetyClassifierReply(reply) && validReply) return Response.json({ reply }, { headers: corsHeaders });
      console.warn(`Rejected invalid assessment reply on attempt ${attempt + 1}`);
    }
    throw new Error("The free AI model did not return the required assessment format. Please try again.");
  } catch (error) {
    console.error("Current health assessment failed", error instanceof Error ? error.message : "Unexpected error");
    return Response.json({ error: error instanceof Error ? error.message : "Unexpected error" }, { status: 500, headers: corsHeaders });
  }
});
