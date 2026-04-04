"use client";

import { Card, CardContent } from "@/components/ui/card";

interface ReportSummaryProps {
  score: number;
  summary: string;
  jobRole: string;
  difficulty: string;
  duration?: number | null;
  date: string;
}

export function ReportSummary({
  score,
  summary,
  jobRole,
  difficulty,
  duration,
  date,
}: ReportSummaryProps) {
  const scoreColor =
    score >= 80
      ? "text-green-600"
      : score >= 60
        ? "text-blue-600"
        : score >= 40
          ? "text-amber-600"
          : "text-red-600";

  const ringColor =
    score >= 80
      ? "stroke-green-500"
      : score >= 60
        ? "stroke-blue-500"
        : score >= 40
          ? "stroke-amber-500"
          : "stroke-red-500";

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <Card>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
        {/* Score ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-xs text-gray-500">总分</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-lg font-semibold mb-2">面试总结</h2>
          <p className="text-sm text-gray-600 mb-4">{summary}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>岗位: {jobRole}</span>
            <span>难度: {difficulty}</span>
            {duration != null && (
              <span>时长: {Math.round(duration / 60)} 分钟</span>
            )}
            <span>日期: {date}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
