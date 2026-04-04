"use client";

import { useEffect, useRef } from "react";

export interface TranscriptMessage {
  role: "assistant" | "user";
  content: string;
  timestamp?: string;
}

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        对话将在这里显示...
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto space-y-3 p-4">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-white/10 text-white/90"
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
}
