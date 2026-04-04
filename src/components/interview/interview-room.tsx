"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc-client";
import { InterviewTimer } from "./interview-timer";
import { TranscriptPanel, type TranscriptMessage } from "./transcript-panel";
import type { InterviewPhase } from "@/types/interview";

const PHASES: { key: InterviewPhase; label: string }[] = [
  { key: "INTRO", label: "开场" },
  { key: "TECHNICAL", label: "技术" },
  { key: "BEHAVIORAL", label: "行为" },
  { key: "QA", label: "Q&A" },
];

function InterviewRoomInner({
  interviewId,
  onEnd,
}: {
  interviewId: string;
  onEnd: () => void;
}) {
  const { state, audioTrack } = useVoiceAssistant();
  const [isMuted, setIsMuted] = useState(false);
  const [currentPhase] = useState<InterviewPhase>("INTRO");
  const [messages] = useState<TranscriptMessage[]>([]);

  const phaseIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div className="flex flex-col h-screen bg-[#0f172a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-400"
          >
            {PHASES[phaseIndex]?.label ?? "面试中"}
          </Badge>
          <InterviewTimer />
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onEnd}
          className="gap-2"
        >
          <PhoneOff className="h-4 w-4" />
          结束面试
        </Button>
      </div>

      {/* Phase progress */}
      <div className="flex gap-1 px-6">
        {PHASES.map((phase, i) => (
          <div
            key={phase.key}
            className={`h-1 flex-1 rounded-full ${
              i <= phaseIndex ? "bg-blue-500" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Center area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* AI Avatar */}
        <div className="relative">
          <div
            className={`h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${
              state === "speaking" ? "animate-pulse" : ""
            }`}
          >
            <span className="text-3xl text-white font-bold">AI</span>
          </div>
          {state === "speaking" && (
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
          )}
        </div>

        {/* Visualizer */}
        <div className="h-16 w-64">
          {audioTrack ? (
            <BarVisualizer
              trackRef={audioTrack}
              className="h-full w-full"
              barCount={5}
            />
          ) : (
            <div className="flex items-end justify-center gap-1 h-full">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-blue-400/30"
                  style={{ height: `${20 + Math.random() * 30}%` }}
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-sm text-white/50">
          {state === "speaking"
            ? "AI 面试官正在说话..."
            : state === "listening"
              ? "请回答问题..."
              : "连接中..."}
        </p>

        {/* Mic control */}
        <Button
          variant={isMuted ? "destructive" : "default"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Transcript panel */}
      <div className="h-48 border-t border-white/10">
        <TranscriptPanel messages={messages} />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

interface InterviewRoomProps {
  interviewId: string;
}

export function InterviewRoom({ interviewId }: InterviewRoomProps) {
  const router = useRouter();
  const [connectionInfo, setConnectionInfo] = useState<{
    token: string;
    wsUrl: string;
  } | null>(null);
  const [startTime] = useState(Date.now());

  const tokenMutation = trpc.interview.getToken.useMutation({
    onSuccess: (data) => {
      setConnectionInfo({ token: data.token, wsUrl: data.wsUrl });
    },
  });

  const completeMutation = trpc.interview.complete.useMutation({
    onSuccess: () => {
      router.push(`/interview/${interviewId}/report`);
    },
  });

  useEffect(() => {
    tokenMutation.mutate({ interviewId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId]);

  const handleEnd = useCallback(() => {
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    completeMutation.mutate({ interviewId, durationSeconds });
  }, [interviewId, startTime, completeMutation]);

  if (!connectionInfo) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <div className="text-center text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p>正在连接面试室...</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={connectionInfo.wsUrl}
      token={connectionInfo.token}
      connect={true}
      audio={true}
      video={false}
    >
      <InterviewRoomInner interviewId={interviewId} onEnd={handleEnd} />
    </LiveKitRoom>
  );
}
