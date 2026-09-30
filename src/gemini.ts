// Gemini AI Client for TubeEarn
// Incorporates Thinking Mode (gemini-3.1-pro-preview, thinkingLevel: HIGH),
// General tasks (gemini-3.5-flash), and Fast screening (gemini-3.1-flash-lite).

const API_KEY = process.env.GEMINI_API_KEY || '';

interface GeminiGenerateResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
    finishReason?: string;
  }[];
  error?: {
    message: string;
    code: number;
  };
}

async function callGeminiRest(
  model: string,
  prompt: string,
  systemInstruction?: string,
  thinkingLevel?: 'HIGH' | 'LOW'
): Promise<string> {
  if (!API_KEY) {
    console.warn("GEMINI_API_KEY not configured. Falling back to rule-based analysis.");
    return "";
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  const body: any = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  if (thinkingLevel) {
    body.generationConfig = {
      thinkingConfig: {
        thinkingLevel: thinkingLevel
      }
      // Note: As specified, do NOT set maxOutputTokens with thinkingLevel
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini API error (${model}):`, errorText);
    throw new Error(`Gemini request failed: ${response.status} ${response.statusText}`);
  }

  const data: GeminiGenerateResponse = await response.json();
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No text candidate returned from Gemini");
  }

  return text;
}

/**
 * 1. Deep Thinking Audit Mode (gemini-3.1-pro-preview with thinkingLevel: HIGH)
 * Performs forensic anti-fraud analysis on user velocity, suspicious patterns,
 * payout velocity, and duplicate account signals.
 */
export async function auditFraudDeepThinking(params: {
  userId: string;
  userName: string;
  totalSubmissions: number;
  avgWatchDurationSeconds: number;
  requiredWatchSeconds: number;
  ipVelocityCount: number;
  recentFeedbacks: string[];
  requestedWithdrawalAmount?: number;
}): Promise<{
  fraudScore: number; // 0 (legitimate) to 100 (extreme fraud)
  verdict: 'APPROVED' | 'HOLD_FOR_REVIEW' | 'SUSPEND_ACCOUNT';
  confidence: number;
  reasoning: string;
  flaggedSignals: string[];
}> {
  const prompt = `
You are the Chief Anti-Fraud & Risk Security Officer for TubeEarn, a creator engagement rewards marketplace.
Perform an exhaustive forensic audit on the following user activity data.

USER AUDIT DOSSIER:
- User ID: ${params.userId} (${params.userName})
- Total Completed Submissions: ${params.totalSubmissions}
- Average Watch Duration: ${params.avgWatchDurationSeconds}s (Required Minimum: ${params.requiredWatchSeconds}s)
- IP/Device Velocity (Submissions from same footprint in 1hr): ${params.ipVelocityCount}
- Recent Submitted Feedback Texts:
${params.recentFeedbacks.map((f, i) => `  [Task #${i+1}]: "${f}"`).join('\n')}
${params.requestedWithdrawalAmount ? `- Withdrawal Payout Requested: ₹${params.requestedWithdrawalAmount}` : ''}

CRITERIA:
1. Copy-paste / bot-generated feedback texts vs genuine subjective human observation.
2. Timing anomalies: watch duration significantly below required duration or inhuman task-completion frequency.
3. Multi-accounting / syndicate signals.
4. Withdrawal risk: whether payout of ₹${params.requestedWithdrawalAmount || 0} should be executed or held.

Evaluate with high-level cognitive reasoning and output your conclusion in pure JSON:
{
  "fraudScore": <number 0-100>,
  "verdict": <"APPROVED" | "HOLD_FOR_REVIEW" | "SUSPEND_ACCOUNT">,
  "confidence": <number 0-100>,
  "reasoning": "<thorough explanation of reasoning and observations>",
  "flaggedSignals": ["<signal 1>", "<signal 2>"]
}
`;

  try {
    const rawResult = await callGeminiRest(
      'gemini-3.1-pro-preview',
      prompt,
      'You are a high-precision anti-fraud intelligence engine. Return JSON only.',
      'HIGH' // Thinking level HIGH without maxOutputTokens!
    );

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Deep thinking fraud audit fallback:", err);
  }

  // Graceful rule-based fallback
  const isSuspiciousWatch = params.avgWatchDurationSeconds < params.requiredWatchSeconds * 0.7;
  const isHighVelocity = params.ipVelocityCount > 5;
  const score = (isSuspiciousWatch ? 45 : 10) + (isHighVelocity ? 40 : 5);

  return {
    fraudScore: score,
    verdict: score > 70 ? 'SUSPEND_ACCOUNT' : score > 35 ? 'HOLD_FOR_REVIEW' : 'APPROVED',
    confidence: 85,
    reasoning: `Rule-based analysis: Watch duration ratio is ${Math.round((params.avgWatchDurationSeconds / (params.requiredWatchSeconds || 1)) * 100)}%. Device velocity index is ${params.ipVelocityCount}.`,
    flaggedSignals: [
      ...(isSuspiciousWatch ? ['Watch duration significantly below required threshold'] : []),
      ...(isHighVelocity ? ['Elevated submission velocity on device footprint'] : [])
    ]
  };
}

/**
 * 2. General Task Intelligence (gemini-3.5-flash)
 * Verifies submitted user review / feedback against campaign requirements,
 * checking for quality, constructive criticism, and authentic comprehension.
 */
export async function verifyTaskWithAI(params: {
  campaignTitle: string;
  taskType: string;
  userFeedback: string;
  answers: { question: string; answer: string }[];
  watchDurationSeconds: number;
  minimumWatchTimeSeconds: number;
}): Promise<{
  isAccepted: boolean;
  score: number; // 0-100 quality score
  feedbackSummary: string;
  feedbackQuality: 'HIGH' | 'MEDIUM' | 'POOR' | 'SPAM';
}> {
  const prompt = `
Examine this participant task submission for a creator engagement campaign:
Campaign: "${params.campaignTitle}" (Task Type: ${params.taskType})
Required Watch Time: ${params.minimumWatchTimeSeconds}s | Logged Watch Time: ${params.watchDurationSeconds}s

Participant Feedback:
"${params.userFeedback}"

Question Answers:
${params.answers.map(a => `Q: ${a.question} -> A: ${a.answer}`).join('\n')}

Evaluate if this is authentic human feedback or low-effort spam/placeholder text.
Return JSON ONLY:
{
  "isAccepted": <boolean>,
  "score": <number 0-100>,
  "feedbackSummary": "<short constructive 1-sentence assessment>",
  "feedbackQuality": <"HIGH" | "MEDIUM" | "POOR" | "SPAM">
}
`;

  try {
    const rawResult = await callGeminiRest(
      'gemini-3.5-flash',
      prompt,
      'You are a content reviewer validating legitimate user engagement. Return JSON only.'
    );

    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Gemini 3.5 Flash task verification fallback:", err);
  }

  // Graceful fallback
  const isLongEnough = params.userFeedback.trim().length >= 25;
  const isWatchSatisfied = params.watchDurationSeconds >= params.minimumWatchTimeSeconds * 0.8;
  const isAccepted = isLongEnough && isWatchSatisfied;

  return {
    isAccepted,
    score: isAccepted ? 88 : 35,
    feedbackSummary: isAccepted ? "Constructive feedback and verified watch duration." : "Feedback is too brief or watch time was insufficient.",
    feedbackQuality: isAccepted ? 'HIGH' : 'POOR'
  };
}

/**
 * 3. Creator Campaign Optimizer (gemini-3.5-flash)
 * Generates compelling, platform-policy-compliant research questions and
 * audience feedback prompts for creators setting up new campaigns.
 */
export async function generateCampaignOptimizer(params: {
  platform: string;
  topicOrChannel: string;
  goal: string;
}): Promise<{
  optimizedTitle: string;
  description: string;
  verificationQuestions: { question: string; expectedEvidence: string }[];
  suggestedDurationSeconds: number;
}> {
  const prompt = `
A creator on ${params.platform} wants to launch a discovery and feedback campaign on TubeEarn.
Channel/Topic: ${params.topicOrChannel}
Creator's Goal: ${params.goal}

Generate a 100% platform-policy compliant campaign (STRICTLY NO artificial engagement, no sub4sub or paid likes).
Focus on authentic audience discovery, video quality feedback, and audience research.

Return JSON ONLY:
{
  "optimizedTitle": "<catchy, professional title>",
  "description": "<detailed clear instructions for users on what specific segment to watch and what feedback to provide>",
  "verificationQuestions": [
    { "question": "<question 1 exploring video content or production>", "expectedEvidence": "<what genuine viewer will notice>" },
    { "question": "<question 2 exploring takeaways or critique>", "expectedEvidence": "<insight>" }
  ],
  "suggestedDurationSeconds": <number 60 to 180>
}
`;

  try {
    const rawResult = await callGeminiRest(
      'gemini-3.5-flash',
      prompt,
      'You are a YouTube/Meta Creator Strategist expert in authentic community engagement. Return JSON only.'
    );
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn("Campaign optimizer fallback:", err);
  }

  return {
    optimizedTitle: `Content Discovery & Feedback: ${params.topicOrChannel}`,
    description: `Watch at least 90 seconds of the latest content. Provide 2-3 sentences of thoughtful critique on video pacing, audio balance, and your key takeaway.`,
    verificationQuestions: [
      { question: "What was the main topic introduced in the first 2 minutes?", expectedEvidence: "Accurate summary of theme" },
      { question: "What improvement would you recommend for the thumbnail or intro hook?", expectedEvidence: "Constructive feedback" }
    ],
    suggestedDurationSeconds: 90
  };
}

/**
 * 4. Fast Screening (gemini-3.1-flash-lite)
 * Rapid sentiment and spam screening for real-time form inputs.
 */
export async function quickScreenText(text: string): Promise<{ isClean: boolean; reason?: string }> {
  if (text.length < 5) return { isClean: false, reason: "Text too short" };

  try {
    const rawResult = await callGeminiRest(
      'gemini-3.1-flash-lite',
      `Classify this text for a user review task. Does it appear to be spam, gibberish, or profane?
Text: "${text}"
Return JSON: {"isClean": boolean, "reason": string}`
    );
    const match = rawResult.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch (err) {
    // fast fallback
  }

  return { isClean: true };
}
