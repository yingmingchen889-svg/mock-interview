"use client";

import Link from "next/link";
import { Mic } from "lucide-react";

export function QuickStart() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
      <div className="relative z-10">
        <h3 className="text-xl font-semibold">准备好了吗？</h3>
        <p className="mt-2 text-blue-100 text-sm">
          选择你的目标岗位，开始一场真实的 AI 模拟面试
        </p>
        <Link
          href="/interview/new"
          className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-white text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Mic className="mr-2 h-4 w-4" />
          开始面试
        </Link>
      </div>
      <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-white/5" />
    </div>
  );
}
