import OpenAI from "openai";
import { buildEvaluationPrompt } from "@/lib/prompts/evaluation";
import { getProviderForModel, getProviderApiKey, getAvailableModels } from "@/lib/llm-providers";
import type { Difficulty, InterviewPhase, ReportData } from "@/types/interview";

/** Cache OpenAI clients per provider to reuse connections */
const _clients = new Map<string, OpenAI>();

function getClient(providerKey: string, baseURL: string): OpenAI {
  let client = _clients.get(providerKey);
  if (!client) {
    const apiKey = getProviderApiKey(providerKey);
    client = new OpenAI({ apiKey, baseURL });
    _clients.set(providerKey, client);
  }
  return client;
}

interface TranscriptEntry {
  role: string;
  content: string;
  phase: InterviewPhase;
  questionIndex?: number | null;
}

export async function generateReport(
  jobRole: string,
  techStack: string[],
  difficulty: Difficulty,
  transcripts: TranscriptEntry[],
  modelId?: string
): Promise<ReportData> {
  // Resolve which provider and model to use
  let resolvedModelId = modelId || "";
  let providerKey = "";
  let baseURL = "";

  const match = resolvedModelId ? getProviderForModel(resolvedModelId) : null;

  if (match) {
    providerKey = match.provider.key;
    baseURL = match.provider.baseURL;
  } else {
    // Fall back to the first available model
    const available = getAvailableModels();
    if (available.length === 0) {
      throw new Error("No LLM providers configured. Please set an API key in .env.local");
    }
    const fallback = getProviderForModel(available[0].id);
    if (!fallback) throw new Error("Failed to resolve fallback model");
    resolvedModelId = available[0].id;
    providerKey = fallback.provider.key;
    baseURL = fallback.provider.baseURL;
  }

  const client = getClient(providerKey, baseURL);
  const prompt = buildEvaluationPrompt(jobRole, techStack, difficulty, transcripts);

  const response = await client.chat.completions.create({
    model: resolvedModelId,
    messages: [
      {
        role: "system",
        content:
          "You are an expert interview evaluator. Always respond with valid JSON only, no markdown fences or extra text.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from evaluation model");
  }

  const cleaned = content.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
  const parsed = JSON.parse(cleaned) as ReportData;

  if (
    typeof parsed.overallScore !== "number" ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.weaknesses) ||
    !Array.isArray(parsed.questionScores) ||
    !Array.isArray(parsed.knowledgePoints) ||
    !Array.isArray(parsed.improvementSuggestions)
  ) {
    throw new Error("Invalid report structure from evaluation model");
  }

  return parsed;
}
