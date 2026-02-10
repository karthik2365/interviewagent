"use client";

import { useEffect, useRef } from "react";

interface WebcamPreviewProps {
  stream: MediaStream | null;
  isLookingAway: boolean;
  isReady: boolean;
  error: string | null;
}

export default function WebcamPreview({
  stream,
  isLookingAway,
  isReady,
  error,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-40 h-28 rounded-xl bg-gray-900 border border-red-500/30 flex items-center justify-center p-2">
        <div className="text-center">
          <div className="text-red-400 text-xs mb-1">📷 Camera Error</div>
          <div className="text-gray-500 text-[10px]">Check permissions</div>
        </div>
      </div>
    );
  }

  if (!isReady || !stream) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-40 h-28 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-2" />
          <div className="text-gray-400 text-xs">Starting camera...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-40 h-28 rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${
        isLookingAway
          ? "border-2 border-red-500 shadow-red-500/30"
          : "border-2 border-green-500 shadow-green-500/20"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover scale-x-[-1]"
      />
      
      {/* Status indicator */}
      <div
        className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
          isLookingAway
            ? "bg-red-500/80 text-white"
            : "bg-green-500/80 text-white"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLookingAway ? "bg-white animate-pulse" : "bg-white"
          }`}
        />
        {isLookingAway ? "Look here" : "OK"}
      </div>

      {/* Recording indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[10px] text-white font-medium">REC</span>
      </div>
    </div>
  );
}
