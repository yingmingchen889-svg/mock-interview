import { InterviewSetupForm } from "@/components/interview/interview-setup-form";

export default function InterviewNewPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">配置面试</h1>
        <p className="text-gray-500 text-sm mt-1">
          根据你的需求，定制一场专属面试
        </p>
      </div>
      <InterviewSetupForm />
    </div>
  );
}
