import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { Review } from "@/types";

export type ProAnalysisJson = {
  sentiment: string;
  summary: string;
  positive_keywords: string[];
  negative_keywords: string[];
  mentioned_menu_items: string[];
  recommended_dishes: string[];
};

function buildPrompt(reviewCount: number, reviewText: string): string {
  return `Analyze all ${reviewCount} Google reviews for this restaurant and provide a comprehensive analysis in JSON format.

1. Overall sentiment (positive/negative/mixed)
2. A detailed summary (2-3 sentences)
3. Key positive keywords (up to 5)
4. Key negative keywords (up to 5)
5. All menu items mentioned
6. Most recommended dishes

Reviews to analyze:
${reviewText}

Respond with valid JSON only (no markdown fences). Use this exact structure:
{
  "sentiment": "positive/negative/mixed",
  "summary": "Comprehensive summary here",
  "positive_keywords": ["keyword1"],
  "negative_keywords": ["keyword1"],
  "mentioned_menu_items": ["item1"],
  "recommended_dishes": ["dish1"]
}`;
}

function extractJsonObject(text: string): string {
  return text.replace(/```json\s*|\s*```/g, "").trim();
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter((s) => s.length > 0);
}

function parseProAnalysisResult(jsonText: string): ProAnalysisJson {
  const analysisResult = JSON.parse(jsonText) as Record<string, unknown>;
  const requiredFields = [
    "sentiment",
    "summary",
    "positive_keywords",
    "negative_keywords",
    "mentioned_menu_items",
    "recommended_dishes",
  ] as const;
  for (const field of requiredFields) {
    if (analysisResult[field] === undefined || analysisResult[field] === null) {
      throw new Error(`Analysis result missing required field: ${field}`);
    }
  }
  return {
    sentiment: String(analysisResult.sentiment),
    summary: String(analysisResult.summary),
    positive_keywords: asStringArray(analysisResult.positive_keywords),
    negative_keywords: asStringArray(analysisResult.negative_keywords),
    mentioned_menu_items: asStringArray(analysisResult.mentioned_menu_items),
    recommended_dishes: asStringArray(analysisResult.recommended_dishes),
  };
}

type Provider = "openai" | "anthropic" | "gemini";

function trimmedEnv(name: string): string | undefined {
  const v = process.env[name];
  if (v == null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/**
 * Pro 분석 LLM 선택:
 * 1) LLM_PROVIDER=openai|anthropic|gemini
 * 2) 키가 있으면: OpenAI → Anthropic → Gemini 순 (기본은 OpenAI 우선, 결제 연동 쉬움)
 */
function resolveProvider(): Provider {
  const explicit = trimmedEnv("LLM_PROVIDER")?.toLowerCase();
  if (explicit === "gemini") return "gemini";
  if (explicit === "anthropic") return "anthropic";
  if (explicit === "openai") return "openai";
  if (trimmedEnv("OPENAI_API_KEY")) return "openai";
  if (trimmedEnv("ANTHROPIC_API_KEY")) return "anthropic";
  return "gemini";
}

/**
 * Pro 분석 LLM. 기본: OPENAI_API_KEY + gpt-4o-mini (저비용·구조화 JSON에 적합).
 */
export async function runProAnalysisLlm(currentReviews: Review[]): Promise<ProAnalysisJson> {
  const provider = resolveProvider();
  const reviewText = currentReviews
    .map((review) => `Rating: ${review.rating}/5\nReview: ${review.text}`)
    .join("\n\n");
  const prompt = buildPrompt(currentReviews.length, reviewText);

  if (provider === "openai") {
    const key = trimmedEnv("OPENAI_API_KEY");
    if (!key) {
      throw new Error(
        "OpenAI is selected but OPENAI_API_KEY is missing. Add it to .env.local and restart next dev."
      );
    }
    const model = trimmedEnv("OPENAI_MODEL") || "gpt-4o-mini";
    const client = new OpenAI({ apiKey: key });
    try {
      const completion = await client.chat.completions.create({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      const raw = completion.choices[0]?.message?.content;
      if (!raw?.trim()) {
        throw new Error("OpenAI returned an empty response.");
      }
      const jsonText = extractJsonObject(raw);
      return parseProAnalysisResult(jsonText);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/401|invalid_api_key|Incorrect API key/i.test(msg)) {
        throw new Error(
          "OpenAI rejected the API key (401). Check OPENAI_API_KEY in .env.local and platform.openai.com."
        );
      }
      if (/429|rate_limit|quota|insufficient_quota|billing/i.test(msg)) {
        throw new Error(
          "OpenAI quota or billing issue (429 / insufficient_quota). Add payment method or credits at platform.openai.com."
        );
      }
      throw new Error(`OpenAI request failed: ${msg}`);
    }
  }

  if (provider === "anthropic") {
    const key = trimmedEnv("ANTHROPIC_API_KEY");
    if (!key) {
      throw new Error(
        "Anthropic is selected but ANTHROPIC_API_KEY is missing. Add it to .env.local and restart next dev."
      );
    }
    const model = trimmedEnv("ANTHROPIC_MODEL") || "claude-3-5-haiku-20241022";
    const client = new Anthropic({ apiKey: key });
    let message;
    try {
      message = await client.messages.create({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/401|authentication/i.test(msg)) {
        throw new Error(
          "Anthropic API rejected the key (401). Check ANTHROPIC_API_KEY and rotate the key if it was exposed."
        );
      }
      if (/402|credit|balance|billing|payment/i.test(msg)) {
        throw new Error(
          "Anthropic account billing or credits issue (402 / insufficient balance). Add credits in console.anthropic.com."
        );
      }
      if (/404|not_found|model/i.test(msg)) {
        throw new Error(
          `Anthropic model "${model}" may be invalid or unavailable for your account. Set ANTHROPIC_MODEL to a model from docs.anthropic.com (e.g. claude-3-5-haiku-20241022). Original: ${msg}`
        );
      }
      throw new Error(`Anthropic request failed: ${msg}`);
    }
    const block = message.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Anthropic response had no text block.");
    }
    const jsonText = extractJsonObject(block.text);
    return parseProAnalysisResult(jsonText);
  }

  const geminiKey = trimmedEnv("GOOGLE_GEMINI_API_KEY");
  if (!geminiKey) {
    throw new Error(
      "No LLM configured: set OPENAI_API_KEY (recommended), or ANTHROPIC_API_KEY, or GOOGLE_GEMINI_API_KEY with server-safe key restrictions."
    );
  }
  const genAI = new GoogleGenerativeAI(geminiKey);
  const modelName = trimmedEnv("GEMINI_MODEL") || "gemini-1.5-flash";
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const jsonText = extractJsonObject(text);
    return parseProAnalysisResult(jsonText);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/referer|403/i.test(msg)) {
      throw new Error(
        "Gemini returned 403 (often: API key has HTTP referrer restrictions; server requests have no referer). Use OPENAI_API_KEY or a server key without referrer restriction."
      );
    }
    throw new Error(`Gemini request failed: ${msg}`);
  }
}
