"use client";

import React, { useEffect, useState } from "react";

interface VimeoPlayerProps {
  vimeoId: string;
  title?: string;
  aspectRatio?: string;
}

/**
 * Robust Vimeo Player component that supports:
 * 1. Regular Video IDs (e.g., "123456789")
 * 2. Live Event codes (e.g., "5456685/embed/077726b259/interaction")
 * 3. Full URLs (fallback)
 */
export function VimeoPlayer({ vimeoId, title = "Vimeo Video", aspectRatio = "56.25%" }: VimeoPlayerProps) {
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!vimeoId) return;

    let url = "";

    // Case 1: Full URL provided
    if (vimeoId.startsWith("http")) {
      url = vimeoId;
    }
    // Case 2: Live Event Path (contains slashes)
    else if (vimeoId.includes("/")) {
      // Ensure it starts with event/ if it doesn't already
      let path = vimeoId;
      if (!path.startsWith("event/") && !path.startsWith("/event/")) {
        path = `event/${path}`;
      }
      // Remove leading slash if present for consistency
      path = path.startsWith("/") ? path.slice(1) : path;
      url = `https://vimeo.com/${path}`;
    }
    // Case 3: Regular Video ID
    else {
      url = `https://player.vimeo.com/video/${vimeoId}?h=0&badge=0&autopause=0&player_id=0&app_id=58479`;
    }

    // Small delay to ensure client-side hydration and smoother entry
    const timer = setTimeout(() => {
      setPlayerUrl(url);
    }, 100);

    return () => clearTimeout(timer);
  }, [vimeoId]);

  if (!playerUrl) {
    return (
      <div 
        className="w-full bg-slate-900 flex items-center justify-center animate-pulse rounded-2xl" 
        style={{ paddingBottom: aspectRatio }}
      >
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl bg-black"
      style={{ paddingBottom: aspectRatio }}
    >
      <iframe
        src={playerUrl}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 w-full h-full animate-in fade-in duration-700"
        title={title}
      />
    </div>
  );
}
