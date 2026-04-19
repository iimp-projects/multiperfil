"use client";

import React from "react";

const cn = (...classes: (string | undefined | boolean)[]) =>
  classes.filter(Boolean).join(" ");

interface PulseWavesProps {
  className?: string;
  color?: string; // Tailwind color class like "bg-green-500"
}

export function PulseWaves({
  className,
  color = "bg-green-500",
}: PulseWavesProps) {
  const isGreen = color.includes("green");

  // Set the CSS variable for the pulse color
  const pulseColor = isGreen
    ? "rgba(34, 197, 94, 0.6)"
    : "rgba(59, 130, 246, 0.6)";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center w-2 h-2 mx-1",
        className,
      )}
      style={{ "--pulse-color": pulseColor } as React.CSSProperties}
    >
      {/* Refined Pulse Rings - Larger than container for visibility */}
      <div className="absolute w-4 h-4 rounded-full border-2 border-transparent animate-pulse-refined" />
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-transparent animate-pulse-refined"
        style={{ animationDelay: "1.525s" }}
      />

      {/* Central Dot */}
      <div
        className={cn(
          "relative z-10 w-full h-full rounded-full animate-pulse-dot shadow-sm",
          color,
        )}
      />
    </div>
  );
}
