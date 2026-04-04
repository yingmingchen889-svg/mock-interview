"use client";

import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FileText } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOB_ROLES } from "@/lib/interview-config";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  COMPLETED: { label: "已完成", variant: "default" },
  IN_PROGRESS: { label: "进行中", variant: "secondary" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

export function RecentInterviews() {
  const { data: interviews, isLoading } = trpc.interview.list.useQuery();

  const recentInterviews = interviews?.slice(0, 5) ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近面试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentInterviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近面试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
            <FileText className="h-10 w-10 mb-2 text-gray-300" />
            <p className="text-sm">暂无面试记录</p>
            <p className="text-xs mt-1">开始你的第一次模拟面试吧</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最近面试</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentInterviews.map((interview) => {
            const role = JOB_ROLES.find((r) => r.value === interview.jobRole);
            const status = statusMap[interview.status] ?? {
              label: interview.status,
              variant: "outline" as const,
            };
            const score = interview.report?.overallScore;

            return (
              <Link
                key={interview.id}
                href={
                  interview.status === "COMPLETED"
                    ? `/interview/${interview.id}/report`
                    : `/interview/${interview.id}`
                }
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{role?.icon ?? "💼"}</span>
                  <div>
                    <p className="text-sm font-medium">
                      {role?.label ?? interview.jobRole}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(interview.createdAt), "MM月dd日 HH:mm", {
                        locale: zhCN,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {score != null && (
                    <span className="text-sm font-semibold text-blue-600">
                      {score}分
                    </span>
                  )}
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
