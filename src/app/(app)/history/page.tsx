import { InterviewList } from "@/components/history/interview-list";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">面试记录</h1>
        <p className="text-gray-500 text-sm mt-1">查看你的所有面试历史和成绩</p>
      </div>
      <InterviewList />
    </div>
  );
}
