"use client";

export function AudioVisualizerPlaceholder() {
  return (
    <div className="flex items-end justify-center gap-1 h-16">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-blue-400"
          style={{
            animation: `pulse-bar 1.2s ease-in-out ${i * 0.15}s infinite`,
            height: "20%",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes pulse-bar {
          0%,
          100% {
            height: 20%;
            opacity: 0.4;
          }
          50% {
            height: 80%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
