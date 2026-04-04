import type { Difficulty, InterviewPhase } from "@/types/interview";

interface TranscriptEntry {
  role: string;
  content: string;
  phase: InterviewPhase;
  questionIndex?: number | null;
}

export function buildEvaluationPrompt(
  jobRole: string,
  techStack: string[],
  difficulty: Difficulty,
  transcripts: TranscriptEntry[]
): string {
  const formattedTranscripts = transcripts
    .map(
      (t, i) =>
        `[${t.phase}] ${t.role === "AI" ? "Interviewer" : "Candidate"}: ${t.content}`
    )
    .join("\n\n");

  return `You are an expert technical interviewer evaluator. Analyze the following mock interview transcript and produce a detailed evaluation report.

## Interview Context
- **Job Role**: ${jobRole}
- **Tech Stack**: ${techStack.join(", ")}
- **Difficulty Level**: ${difficulty}

## Transcript
${formattedTranscripts}

## Instructions
Evaluate the candidate's performance and return a JSON object with the following structure. Return ONLY the JSON, no markdown fences or extra text.

{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment in Chinese>",
  "strengths": ["<strength 1 in Chinese>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1 in Chinese>", "<weakness 2>", ...],
  "questionScores": [
    {
      "question": "<the question asked>",
      "score": <number 0-10>,
      "maxScore": 10,
      "feedback": "<specific feedback in Chinese>",
      "phase": "<INTRO|TECHNICAL|BEHAVIORAL|QA>"
    }
  ],
  "knowledgePoints": [
    {
      "name": "<skill/knowledge area>",
      "category": "<category>",
      "mastery": "<weak|partial|strong>",
      "suggestion": "<improvement suggestion in Chinese>"
    }
  ],
  "improvementSuggestions": ["<suggestion 1 in Chinese>", "<suggestion 2>", ...]
}

## Scoring Guidelines
- JUNIOR: Focus on fundamentals, basic implementation ability, learning attitude
- MID: Expect design patterns, system thinking, debugging methodology
- SENIOR: Expect architecture decisions, trade-off analysis, mentorship mindset

Be fair but thorough. Provide actionable feedback in Chinese (Simplified).`;
}
