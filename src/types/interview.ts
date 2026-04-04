export type InterviewPhase = "INTRO" | "TECHNICAL" | "BEHAVIORAL" | "QA";
export type Difficulty = "JUNIOR" | "MID" | "SENIOR";

export interface InterviewConfig {
  jobRole: string;
  techStack: string[];
  difficulty: Difficulty;
  model: string;
}

export interface QuestionScore {
  question: string;
  score: number;
  maxScore: number;
  feedback: string;
  phase: InterviewPhase;
}

export interface KnowledgePoint {
  name: string;
  category: string;
  mastery: "weak" | "partial" | "strong";
  suggestion: string;
}

export interface ReportData {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  questionScores: QuestionScore[];
  knowledgePoints: KnowledgePoint[];
  improvementSuggestions: string[];
}
