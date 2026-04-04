"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc-client";
import { ReportSummary } from "@/components/report/report-summary";
import { StrengthsWeaknesses } from "@/components/report/strengths-weaknesses";
import { QuestionScores } from "@/components/report/question-scores";
import { JOB_ROLES, DIFFICULTY_OPTIONS } from "@/lib/interview-config";
import type { QuestionScore } from "@/types/interview";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.id as string;

  const generateMutation = trpc.report.generate.useMutation();

  useEffect(() => {
    generateMutation.mutate({ interviewId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const isGenerating = generateMutation.isPending;
  const reportData = generateMutation.data as {
    overallScore: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    questionScores: unknown;
    interviewId: string;
    interview?: {
      jobRole?: string;
      difficulty?: string;
      durationSeconds?: number | null;
      createdAt?: string | Date;
    };
  } | undefined;

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
        <h2 className="text-lg font-semibold">正在生成面试报告...</h2>
        <p className="text-sm text-gray-500 mt-1">AI 正在分析你的面试表现</p>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">报告暂时无法生成</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => generateMutation.mutate({ interviewId })}
        >
          重试
        </Button>
      </div>
    );
  }

  const interview = reportData.interview ?? null;
  const jobRoleLabel =
    JOB_ROLES.find((r) => r.value === interview?.jobRole)?.label ??
    interview?.jobRole ??
    "--";
  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((d) => d.value === interview?.difficulty)?.label ??
    interview?.difficulty ??
    "--";

  const questionScores = (
    Array.isArray(reportData.questionScores)
      ? reportData.questionScores
      : []
  ) as QuestionScore[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">面试报告</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            导出 PDF
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push("/interview/new")}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            再来一次
          </Button>
        </div>
      </div>

      <ReportSummary
        score={reportData.overallScore}
        summary={reportData.summary}
        jobRole={jobRoleLabel}
        difficulty={difficultyLabel}
        duration={interview?.durationSeconds}
        date={
          interview?.createdAt
            ? format(new Date(interview.createdAt), "yyyy年MM月dd日", {
                locale: zhCN,
              })
            : "--"
        }
      />

      <StrengthsWeaknesses
        strengths={reportData.strengths as string[]}
        weaknesses={reportData.weaknesses as string[]}
      />

      {questionScores.length > 0 && (
        <QuestionScores questions={questionScores} />
      )}
    </div>
  );
}
