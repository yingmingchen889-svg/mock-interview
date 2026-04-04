"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc-client";
import {
  JOB_ROLES,
  TECH_STACKS,
  DIFFICULTY_OPTIONS,
  MODEL_OPTIONS,
} from "@/lib/interview-config";
import type { Difficulty } from "@/types/interview";

type Step = "role" | "stack" | "difficulty" | "model";

const STEPS: { key: Step; label: string }[] = [
  { key: "role", label: "选择岗位" },
  { key: "stack", label: "技术栈" },
  { key: "difficulty", label: "难度" },
  { key: "model", label: "AI 模型" },
];

export function InterviewSetupForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("role");
  const [jobRole, setJobRole] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [model, setModel] = useState("");

  const createMutation = trpc.interview.create.useMutation({
    onSuccess: (data) => {
      router.push(`/interview/${data.interviewId}`);
    },
  });

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case "role":
        return jobRole !== "";
      case "stack":
        return techStack.length > 0;
      case "difficulty":
        return difficulty !== "";
      case "model":
        return model !== "";
    }
  };

  const goNext = () => {
    const idx = currentStepIndex;
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].key);
    }
  };

  const goPrev = () => {
    const idx = currentStepIndex;
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].key);
    }
  };

  const handleSubmit = () => {
    if (!jobRole || techStack.length === 0 || !difficulty || !model) return;
    createMutation.mutate({
      jobRole,
      techStack,
      difficulty: difficulty as Difficulty,
      model,
    });
  };

  const toggleTechStack = (stack: string) => {
    setTechStack((prev) =>
      prev.includes(stack) ? prev.filter((s) => s !== stack) : [...prev, stack]
    );
  };

  const availableStacks = TECH_STACKS[jobRole] ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (i <= currentStepIndex) setCurrentStep(step.key);
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                i <= currentStepIndex
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {i + 1}
            </button>
            <span
              className={cn(
                "text-sm hidden sm:inline",
                i === currentStepIndex
                  ? "font-medium text-gray-900"
                  : "text-gray-500"
              )}
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-8",
                  i < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === "role" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">选择目标岗位</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {JOB_ROLES.map((role) => (
              <Card
                key={role.value}
                className={cn(
                  "cursor-pointer p-4 text-center transition-all hover:shadow-md",
                  jobRole === role.value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "hover:border-gray-300"
                )}
                onClick={() => {
                  setJobRole(role.value);
                  setTechStack([]);
                }}
              >
                <div className="text-2xl mb-2">{role.icon}</div>
                <p className="text-sm font-medium">{role.label}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentStep === "stack" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">选择技术栈</h2>
          <p className="text-sm text-gray-500 text-center">
            可以选择多个，面试将围绕这些技术展开
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {availableStacks.map((stack) => (
              <Badge
                key={stack}
                variant={techStack.includes(stack) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-2 text-sm transition-colors",
                  techStack.includes(stack)
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "hover:bg-gray-100"
                )}
                onClick={() => toggleTechStack(stack)}
              >
                {stack}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {currentStep === "difficulty" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">选择难度</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                className={cn(
                  "cursor-pointer p-5 transition-all hover:shadow-md",
                  difficulty === opt.value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "hover:border-gray-300"
                )}
                onClick={() => setDifficulty(opt.value)}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-sm text-gray-500 mt-1">{opt.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {currentStep === "model" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-center">选择 AI 模型</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODEL_OPTIONS.map((opt) => (
              <Card
                key={opt.value}
                className={cn(
                  "cursor-pointer p-5 transition-all hover:shadow-md",
                  model === opt.value
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "hover:border-gray-300"
                )}
                onClick={() => setModel(opt.value)}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium">{opt.label}</p>
                  {opt.tier === "PRO" && (
                    <Badge variant="secondary" className="text-xs">
                      PRO
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{opt.description}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl border bg-white p-4">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {jobRole && (
            <span>
              岗位:{" "}
              <strong>
                {JOB_ROLES.find((r) => r.value === jobRole)?.label}
              </strong>
            </span>
          )}
          {techStack.length > 0 && (
            <span>
              技术栈: <strong>{techStack.join(", ")}</strong>
            </span>
          )}
          {difficulty && (
            <span>
              难度:{" "}
              <strong>
                {DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label}
              </strong>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentStepIndex > 0 && (
            <Button variant="outline" onClick={goPrev}>
              上一步
            </Button>
          )}
          {currentStep !== "model" ? (
            <Button onClick={goNext} disabled={!canProceed()}>
              下一步
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || createMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              开始面试
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
