import { InterviewRoom } from "@/components/interview/interview-room";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InterviewPage({ params }: Props) {
  const { id } = await params;

  return <InterviewRoom interviewId={id} />;
}
