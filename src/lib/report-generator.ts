import OpenAI from "openai";
import { buildEvaluationPrompt } from "@/lib/prompts/evaluation";
import type { Difficulty, InterviewPhase, ReportData } from "@/types/interview";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
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
  transcripts: TranscriptEntry[]
): Promise<ReportData> {
  const prompt = buildEvaluationPrompt(jobRole, techStack, difficulty, transcripts);

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
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

  // Strip markdown fences if the model includes them despite instructions
  const cleaned = content.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");

  const parsed = JSON.parse(cleaned) as ReportData;

  // Basic validation
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
