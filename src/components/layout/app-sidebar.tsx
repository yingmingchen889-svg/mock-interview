"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  History,
  TrendingUp,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "控制台", icon: LayoutDashboard },
  { href: "/interview/new", label: "开始面试", icon: Mic },
  { href: "/history", label: "面试记录", icon: History },
  { href: "/progress", label: "成长追踪", icon: TrendingUp },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
          M
        </div>
        <span className="text-lg font-semibold">MockInterview</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-blue-50 p-3 text-center">
          <p className="text-xs text-blue-600 font-medium">免费版</p>
          <p className="text-xs text-gray-500 mt-1">本月剩余 3 次面试</p>
        </div>
      </div>
    </aside>
  );
}
