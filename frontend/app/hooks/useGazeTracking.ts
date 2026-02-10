"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Hook that tracks user's gaze using webcam face detection.
 * Shows a warning when the user looks away from the screen.
 */
export function useGazeTracking() {
  const [showWarning, setShowWarning] = useState(false);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFaceDetectedRef = useRef<boolean>(true);
  const lookAwayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize webcam
  const initWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      setWebcamStream(stream);
      setIsWebcamReady(true);
      setWebcamError(null);

      // Store that webcam is active for this session
      sessionStorage.setItem("webcam_active", "true");
    } catch (err: any) {
      console.error("Webcam access error:", err);
      setWebcamError(err.message || "Failed to access webcam");
      setIsWebcamReady(false);
    }
  }, []);

  // Simple brightness-based face detection heuristic
  // Detects if there's a face-like region in the center of the frame
  const detectFacePosition = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;

    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Analyze center region (where face should be)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const regionSize = Math.min(canvas.width, canvas.height) * 0.4;

    const centerRegion = ctx.getImageData(
      centerX - regionSize / 2,
      centerY - regionSize / 2,
      regionSize,
      regionSize
    );

    // Analyze left edge region
    const leftRegion = ctx.getImageData(0, 0, canvas.width * 0.2, canvas.height);

    // Analyze right edge region
    const rightRegion = ctx.getImageData(
      canvas.width * 0.8,
      0,
      canvas.width * 0.2,
      canvas.height
    );

    // Calculate average brightness for each region
    const getBrightness = (imageData: ImageData) => {
      let sum = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        sum += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      }
      return sum / (imageData.data.length / 4);
    };

    // Calculate skin-tone detection (simple heuristic)
    const getSkinTonePresence = (imageData: ImageData) => {
      let skinPixels = 0;
      const totalPixels = imageData.data.length / 4;

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        // Simple skin tone detection (works for various skin tones)
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinPixels++;
        }
      }

      return skinPixels / totalPixels;
    };

    const centerSkinPresence = getSkinTonePresence(centerRegion);
    const leftBrightness = getBrightness(leftRegion);
    const rightBrightness = getBrightness(rightRegion);
    const centerBrightness = getBrightness(centerRegion);

    // Face is likely present if there's significant skin-tone pixels in center
    const facePresent = centerSkinPresence > 0.1;

    // Face is likely looking away if brightness shifts significantly to edges
    // Relaxed threshold from 1.3 to 1.55 to reduce false positives
    const lookingLeft = leftBrightness > centerBrightness * 1.55;
    const lookingRight = rightBrightness > centerBrightness * 1.55;

    return {
      facePresent,
      lookingAway: !facePresent || lookingLeft || lookingRight,
      centerSkinPresence,
    };
  }, []);

  // Start face tracking loop
  const startTracking = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const track = () => {
      const result = detectFacePosition();

      if (result) {
        const isAway = result.lookingAway;

        if (isAway && !lastFaceDetectedRef.current) {
          // Already in "looking away" state
        } else if (isAway && lastFaceDetectedRef.current) {
          // Just started looking away - start timer
          lastFaceDetectedRef.current = false;

          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
          }

          // Wait 3.0 seconds before triggering warning (avoid false positives)
          // Increased from 1.5s to 3.0s as requested
          lookAwayTimerRef.current = setTimeout(() => {
            if (!lastFaceDetectedRef.current) {
              setIsLookingAway(true);
              setShowWarning(true);
              setViolationCount((prev) => {
                const newCount = prev + 1;
                sessionStorage.setItem("gaze_violations", String(newCount));
                return newCount;
              });
            }
          }, 3000);
        } else if (!isAway) {
          // Looking at screen
          lastFaceDetectedRef.current = true;
          setIsLookingAway(false);

          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
            lookAwayTimerRef.current = null;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(track);
    };

    animationFrameRef.current = requestAnimationFrame(track);
  }, [detectFacePosition]);

  // Setup video element when stream is ready
  useEffect(() => {
    if (!webcamStream) return;

    // Create hidden video and canvas elements for processing
    const video = document.createElement("video");
    video.srcObject = webcamStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    const canvas = document.createElement("canvas");

    videoRef.current = video;
    canvasRef.current = canvas;

    video.onloadedmetadata = () => {
      video.play();
      startTracking();
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lookAwayTimerRef.current) {
        clearTimeout(lookAwayTimerRef.current);
      }
    };
  }, [webcamStream, startTracking]);

  // Initialize webcam on mount
  useEffect(() => {
    if (sessionStorage.getItem("interview_active") === "true") {
      initWebcam();
    }

    return () => {
      // Cleanup webcam stream on unmount
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
    setIsLookingAway(false);
    lastFaceDetectedRef.current = true;
  }, []);

  const stopWebcam = useCallback(() => {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      setWebcamStream(null);
      setIsWebcamReady(false);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [webcamStream]);

  return {
    isLookingAway,
    showWarning,
    dismissWarning,
    webcamStream,
    isWebcamReady,
    webcamError,
    violationCount,
    initWebcam,
    stopWebcam,
  };
}
