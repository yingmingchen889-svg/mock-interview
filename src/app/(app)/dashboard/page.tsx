"use client";

import { BarChart3, Target, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";
import { QuickStart } from "@/components/dashboard/quick-start";
import { RecentInterviews } from "@/components/dashboard/recent-interviews";

const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

export default function DashboardPage() {
  const { data: interviews } = trpc.interview.list.useQuery();

  const completedInterviews =
    interviews?.filter((i) => i.status === "COMPLETED") ?? [];

  const monthlyInterviews = completedInterviews.filter(
    (i) => new Date(i.createdAt) >= startOfMonth
  );

  const scores = completedInterviews
    .map((i) => i.report?.overallScore)
    .filter((s): s is number => s != null);

  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const stats = [
    {
      label: "本月面试次数",
      value: monthlyInterviews.length,
      icon: BarChart3,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "平均得分",
      value: avgScore > 0 ? `${avgScore}分` : "--",
      icon: Target,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "最佳得分",
      value: bestScore > 0 ? `${bestScore}分` : "--",
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "剩余次数",
      value: "不限",
      icon: Zap,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">控制台</h1>
        <p className="text-gray-500 text-sm mt-1">欢迎回来，开始你的面试练习</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickStart />
        <RecentInterviews />
      </div>
    </div>
  );
}
