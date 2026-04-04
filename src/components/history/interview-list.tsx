"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { FileText } from "lucide-react";
import { trpc } from "@/lib/trpc-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JOB_ROLES } from "@/lib/interview-config";

const statusMap: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  COMPLETED: { label: "已完成", variant: "default" },
  IN_PROGRESS: { label: "进行中", variant: "secondary" },
  CANCELLED: { label: "已取消", variant: "destructive" },
};

const FILTER_TABS = [
  { key: "all", label: "全部" },
  { key: "COMPLETED", label: "已完成" },
  { key: "frontend", label: "前端" },
  { key: "backend", label: "后端" },
  { key: "fullstack", label: "全栈" },
];

export function InterviewList() {
  const [filter, setFilter] = useState("all");
  const { data: interviews, isLoading } = trpc.interview.list.useQuery();

  const filtered = (interviews ?? []).filter((interview) => {
    if (filter === "all") return true;
    if (filter === "COMPLETED") return interview.status === "COMPLETED";
    return interview.jobRole === filter;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(tab.key)}
            className={filter === tab.key ? "bg-blue-600 hover:bg-blue-700" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Interview list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <FileText className="h-12 w-12 mb-3 text-gray-300" />
          <p>暂无面试记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((interview) => {
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
                className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{role?.icon ?? "💼"}</span>
                  <div>
                    <p className="font-medium">
                      {role?.label ?? interview.jobRole}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(interview.techStack as string[]).slice(0, 3).join(" / ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(
                        new Date(interview.createdAt),
                        "yyyy年MM月dd日 HH:mm",
                        { locale: zhCN }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {score != null && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">
                        {score}
                      </p>
                      <p className="text-xs text-gray-500">分</p>
                    </div>
                  )}
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
