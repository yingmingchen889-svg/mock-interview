"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Crown } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MODEL_OPTIONS } from "@/lib/interview-config";

const LANGUAGE_OPTIONS = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateMutation = trpc.user.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("设置已保存");
    },
    onError: () => {
      toast.error("保存失败，请重试");
    },
  });

  const [name, setName] = useState("");
  const [preferredModel, setPreferredModel] = useState("gpt-4o-mini");
  const [preferredLanguage, setPreferredLanguage] = useState("zh");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPreferredModel(user.preferredModel ?? "gpt-4o-mini");
      setPreferredLanguage(user.preferredLanguage ?? "zh");
    }
  }, [user]);

  const handleSave = () => {
    updateMutation.mutate({ name, preferredModel, preferredLanguage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">设置</h1>
        <p className="text-gray-500 text-sm mt-1">管理你的个人信息和偏好设置</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入姓名"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              value={user?.email ?? ""}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <Input
              id="phone"
              value={user?.phone ?? ""}
              disabled
              className="bg-gray-50"
              placeholder="未绑定"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">偏好设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>默认 AI 模型</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPreferredModel(opt.value)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all",
                    preferredModel === opt.value
                      ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                      : "hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium">{opt.label}</p>
                    {opt.tier === "PRO" && (
                      <Badge variant="secondary" className="text-xs">
                        PRO
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>语言</Label>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Button
                  key={lang.value}
                  variant={
                    preferredLanguage === lang.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setPreferredLanguage(lang.value)}
                  className={
                    preferredLanguage === lang.value
                      ? "bg-blue-600 hover:bg-blue-700"
                      : ""
                  }
                >
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">订阅计划</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Crown className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium">免费版</p>
                <p className="text-xs text-gray-500">
                  每月 5 次面试，基础报告
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              升级 Pro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {updateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          <Save className="mr-2 h-4 w-4" />
          保存设置
        </Button>
      </div>
    </div>
  );
}
