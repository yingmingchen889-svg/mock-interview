"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuestionScore } from "@/types/interview";

const phaseLabels: Record<string, string> = {
  INTRO: "开场",
  TECHNICAL: "技术",
  BEHAVIORAL: "行为",
  QA: "Q&A",
};

interface QuestionScoresProps {
  questions: QuestionScore[];
}

export function QuestionScores({ questions }: QuestionScoresProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">逐题评分</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, i) => {
          const pct = (q.score / q.maxScore) * 100;
          const barColor =
            pct >= 80
              ? "bg-green-500"
              : pct >= 60
                ? "bg-blue-500"
                : pct >= 40
                  ? "bg-amber-500"
                  : "bg-red-500";

          return (
            <div key={i} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {phaseLabels[q.phase] ?? q.phase}
                  </Badge>
                  <p className="text-sm font-medium">{q.question}</p>
                </div>
                <span className="text-sm font-semibold">
                  {q.score}/{q.maxScore}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${barColor} transition-all`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{q.feedback}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
