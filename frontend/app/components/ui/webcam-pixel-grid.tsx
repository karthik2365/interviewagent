"use client";

import React, { useRef, useEffect, useState } from "react";

interface WebcamPixelGridProps {
  gridCols?: number;
  gridRows?: number;
  maxElevation?: number;
  motionSensitivity?: number;
  elevationSmoothing?: number;
  colorMode?: "webcam" | "scan" | "thermal";
  backgroundColor?: string;
  mirror?: boolean;
  gapRatio?: number;
  invertColors?: boolean;
  darken?: number;
  borderColor?: string;
  borderOpacity?: number;
  className?: string;
  onWebcamReady?: () => void;
  onWebcamError?: (err: any) => void;
  stream?: MediaStream | null;
}

export const WebcamPixelGrid: React.FC<WebcamPixelGridProps> = ({
  gridCols = 60,
  gridRows = 40,
  backgroundColor = "#030303",
  mirror = true,
  gapRatio = 0.1,
  className = "",
  onWebcamReady,
  onWebcamError,
  stream: externalStream,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [internalStream, setInternalStream] = useState<MediaStream | null>(null);
  
  const stream = externalStream || internalStream;

  // Initialize webcam if no external stream provided
  useEffect(() => {
    if (externalStream) return;

    let mounted = true;

    async function initWebcam() {
      try {
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (mounted) {
          setInternalStream(webcamStream);
          if (videoRef.current) {
            videoRef.current.srcObject = webcamStream;
            videoRef.current.play().catch((e) => console.error("Play error:", e));
          }
          onWebcamReady?.();
        }
      } catch (err) {
        if (mounted) {
          console.error("Webcam init error:", err);
          onWebcamError?.(err);
        }
      }
    }

    initWebcam();

    return () => {
      mounted = false;
      if (internalStream) {
        internalStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [externalStream]); // Run if externalStream changes (or on mount if null)

  // Sync external stream to video element
  useEffect(() => {
    if (externalStream && videoRef.current) {
      videoRef.current.srcObject = externalStream;
      videoRef.current.play().catch((e) => console.error("Play error:", e));
    }
  }, [externalStream]);

  // Render loop
  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Offscreen canvas for downsampling
    const offCanvas = document.createElement("canvas");
    offCanvas.width = gridCols;
    offCanvas.height = gridRows;
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    let animationId: number;

    const render = () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // Resize main canvas to fit container
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      // Draw video to small offscreen canvas (downsample)
      offCtx.save();
      if (mirror) {
        offCtx.translate(gridCols, 0);
        offCtx.scale(-1, 1);
      }
      offCtx.drawImage(video, 0, 0, gridCols, gridRows);
      offCtx.restore();

      // Get pixel data
      const imageData = offCtx.getImageData(0, 0, gridCols, gridRows);
      const data = imageData.data;

      // Clear main canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      const cellW = canvas.width / gridCols;
      const cellH = canvas.height / gridRows;

      // Draw each cell
      for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
          const i = (y * gridCols + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Simple brightness calc
          const brightness = (r + g + b) / 3;

          // Only draw visible pixels
          if (brightness > 20) {
            const gapX = cellW * gapRatio;
            const gapY = cellH * gapRatio;
            const w = cellW - gapX;
            const h = cellH - gapY;

            // Use pixel color but dimmed
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
            
            // Draw rectangle
            ctx.fillRect(
              x * cellW + gapX / 2,
              y * cellH + gapY / 2,
              w,
              h
            );
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [stream, gridCols, gridRows, mirror, gapRatio, backgroundColor]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
