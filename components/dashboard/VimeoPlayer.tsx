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
    let cleanInput = vimeoId.trim();

    // 1. Extract src from iframe
    if (cleanInput.includes("<iframe")) {
      const srcMatch = cleanInput.match(/src="([^"]+)"/);
      if (srcMatch && srcMatch[1]) {
        cleanInput = srcMatch[1];
      }
    }

    // 2. Resolve URL
    if (cleanInput.startsWith("http")) {
      url = cleanInput;
      
      // Ensure live event URLs have the /embed suffix as per Vimeo's standard
      if (url.includes("vimeo.com/event/") && !url.includes("/embed")) {
        const baseUrl = url.split("?")[0];
        const parts = baseUrl.split("/");
        const lastPart = parts[parts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          url = `${baseUrl}/embed`;
        }
      }
    }
    // Case 2: Just numeric ID or partial path
    else {
      let path = cleanInput;
      
      // If it's just a numeric ID, transform to standard live event embed URL
      if (/^\d+$/.test(path)) {
        url = `https://vimeo.com/event/${path}/embed`;
      } else {
        // It's a path like "5904371/embed" or similar
        if (!path.startsWith("event/") && !path.startsWith("/event/")) {
          path = `event/${path}`;
        }
        path = path.startsWith("/") ? path.slice(1) : path;
        
        // Ensure it ends with /embed
        if (!path.includes("/embed")) {
          const pathParts = path.split("/");
          if (/^\d+$/.test(pathParts[pathParts.length - 1])) {
            path = `${path}/embed`;
          }
        }
        
        url = `https://vimeo.com/${path}`;
      }
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
