"use client";

import {
  BarChart3,
  Target,
  Trophy,
  Flame,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc-client";

const SKILL_AREAS = [
  { name: "数据结构与算法", progress: 0 },
  { name: "系统设计", progress: 0 },
  { name: "编程语言基础", progress: 0 },
  { name: "框架与工具", progress: 0 },
  { name: "行为面试", progress: 0 },
  { name: "项目经验表达", progress: 0 },
];

const WEAK_AREAS = [
  { name: "系统设计", desc: "需要加强分布式系统和高可用设计" },
  { name: "算法复杂度分析", desc: "时间空间复杂度分析不够清晰" },
  { name: "行为面试 STAR 法", desc: "回答结构化程度有待提升" },
];

export default function ProgressPage() {
  const { data: interviews } = trpc.interview.list.useQuery();

  const completedInterviews =
    interviews?.filter((i) => i.status === "COMPLETED") ?? [];

  const scores = completedInterviews
    .map((i) => i.report?.overallScore)
    .filter((s): s is number => s != null);

  const totalInterviews = completedInterviews.length;
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  // Count unique days
  const activeDays = new Set(
    completedInterviews.map((i) =>
      new Date(i.createdAt).toISOString().slice(0, 10)
    )
  ).size;

  const stats = [
    {
      label: "累计面试",
      value: totalInterviews,
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
      label: "最高得分",
      value: bestScore > 0 ? `${bestScore}分` : "--",
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "活跃天数",
      value: activeDays,
      icon: Flame,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">成长追踪</h1>
        <p className="text-gray-500 text-sm mt-1">
          追踪你的面试表现，持续进步
        </p>
      </div>

      {/* Stats row */}
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

      {/* Score trend placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            成长趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-gray-400">
            <p className="text-sm">成长趋势图表将在有足够数据后显示</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Skill radar placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">能力雷达图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-gray-400">
              <p className="text-sm">完成更多面试后解锁能力分析</p>
            </div>
          </CardContent>
        </Card>

        {/* Skill progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">能力进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {SKILL_AREAS.map((skill) => (
              <div key={skill.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{skill.name}</span>
                  <span className="text-gray-500">
                    {skill.progress > 0 ? `${skill.progress}%` : "待解锁"}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${skill.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Weak areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">薄弱环节</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEAK_AREAS.map((area) => (
            <div
              key={area.name}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="text-sm font-medium">{area.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{area.desc}</p>
              </div>
              <Link
                href="/interview/new"
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors"
              >
                开始专项练习
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
