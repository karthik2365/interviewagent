"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import * as faceapi from "face-api.js";

/**
 * Hook that tracks user's gaze using webcam face detection with face-api.js.
 * Shows a warning when the user looks away from the screen.
 */
export function useGazeTracking() {
  const [showWarning, setShowWarning] = useState(false);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastFaceDetectedRef = useRef<boolean>(true);
  const lookAwayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    try {
      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      setIsLoadingModels(false);
    } catch (err) {
      console.error("Failed to load face-api models:", err);
      setWebcamError("Failed to load face detection models");
      setIsLoadingModels(false);
    }
  }, []);

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
      setWebcamError(null);

      // Store that webcam is active for this session
      sessionStorage.setItem("webcam_active", "true");
    } catch (err: any) {
      console.error("Webcam access error:", err);
      setWebcamError(err.message || "Failed to access webcam");
    }
  }, []);

  // Calculate gaze direction from eye landmarks
  const calculateGaze = useCallback(
    (landmarks: faceapi.FaceLandmarks68) => {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      // Get eye aspect ratio or pupil position
      // For simple gaze detection, we'll compare the relative positions
      // of the eyes to determine if looking left, right, or center

      // Calculate average positions
      const leftEyeCenter = {
        x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
      };

      const rightEyeCenter = {
        x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
      };

      // Calculate the distance between eyes
      const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

      // Get the outer and inner points of each eye
      const leftEyeOuter = leftEye[0]; // Leftmost point
      const leftEyeInner = leftEye[3]; // Rightmost point
      const rightEyeInner = rightEye[0]; // Leftmost point
      const rightEyeOuter = rightEye[3]; // Rightmost point

      // Calculate relative positions
      // If the ratio between inner/outer distances changes, user is looking away
      const leftRatio = (leftEyeInner.x - leftEyeOuter.x) / eyeDistance;
      const rightRatio = (rightEyeOuter.x - rightEyeInner.x) / eyeDistance;

      // Threshold for detecting looking away
      // When looking straight, both ratios should be roughly equal
      // When looking left/right, one ratio becomes much smaller
      const ratioDiff = Math.abs(leftRatio - rightRatio);

      // Also check vertical position - if eyes are significantly higher or lower
      const avgEyeY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const face = landmarks.positions;
      const faceCenterY =
        face.reduce((sum, p) => sum + p.y, 0) / face.length;

      // If ratio difference is too high, user is looking sideways
      // If eyes are significantly above/below center, user might be looking up/down
      const lookingAway = ratioDiff > 0.25 || Math.abs(avgEyeY - faceCenterY) > 15;

      return {
        lookingAway,
        leftRatio,
        rightRatio,
        ratioDiff,
      };
    },
    []
  );

  // Detect face and gaze
  const detectFace = useCallback(async () => {
    if (
      !videoRef.current ||
      !modelsLoaded ||
      isProcessingRef.current ||
      !webcamStream
    ) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const video = videoRef.current;

      // Skip if video is not ready
      if (video.readyState !== 4) {
        isProcessingRef.current = false;
        return;
      }

      // Detect face with landmarks
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections) {
        const landmarks = detections.landmarks;
        const { lookingAway } = calculateGaze(landmarks);

        // Also check if face is centered in frame
        const nose = landmarks.getNose();
        const noseX = nose.reduce((sum, p) => sum + p.x, 0) / nose.length;
        const noseY = nose.reduce((sum, p) => sum + p.y, 0) / nose.length;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        // Check if face is too far to the sides or too close/far
        const isCentered =
          noseX > videoWidth * 0.3 &&
          noseX < videoWidth * 0.7 &&
          noseY > videoHeight * 0.25 &&
          noseY < videoHeight * 0.75;

        const finalLookingAway = lookingAway || !isCentered;

        if (finalLookingAway && lastFaceDetectedRef.current) {
          // Just started looking away - start timer
          lastFaceDetectedRef.current = false;

          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
          }

          // Wait 2.0 seconds before triggering warning
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
          }, 2000);
        } else if (!finalLookingAway) {
          // Looking at screen
          lastFaceDetectedRef.current = true;
          setIsLookingAway(false);

          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
            lookAwayTimerRef.current = null;
          }
        }
      } else {
        // No face detected
        if (lastFaceDetectedRef.current) {
          lastFaceDetectedRef.current = false;

          if (lookAwayTimerRef.current) {
            clearTimeout(lookAwayTimerRef.current);
          }

          // Wait 2.0 seconds before triggering warning when no face
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
          }, 2000);
        }
      }
    } catch (err) {
      // Silently handle detection errors to avoid console spam
    } finally {
      isProcessingRef.current = false;
    }
  }, [modelsLoaded, webcamStream, calculateGaze]);

  // Start face tracking loop
  const startTracking = useCallback(() => {
    if (!videoRef.current || !modelsLoaded) return;

    const track = () => {
      detectFace();
      animationFrameRef.current = requestAnimationFrame(track);
    };

    animationFrameRef.current = requestAnimationFrame(track);
  }, [modelsLoaded, detectFace]);

  // Setup video element when stream is ready
  useEffect(() => {
    if (!webcamStream) return;

    // Create hidden video element for processing
    const video = document.createElement("video");
    video.srcObject = webcamStream;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    videoRef.current = video;

    video.onloadedmetadata = () => {
      video.play();
      setIsWebcamReady(true);
      if (modelsLoaded) {
        startTracking();
      }
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (lookAwayTimerRef.current) {
        clearTimeout(lookAwayTimerRef.current);
      }
    };
  }, [webcamStream, modelsLoaded, startTracking]);

  // Initialize on mount
  useEffect(() => {
    loadModels();
    initWebcam();

    return () => {
      // Cleanup webcam stream on unmount
      if (webcamStream) {
        webcamStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start tracking when models are loaded
  useEffect(() => {
    if (modelsLoaded && isWebcamReady && videoRef.current) {
      startTracking();
    }
  }, [modelsLoaded, isWebcamReady, startTracking]);

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
    isLoadingModels,
    modelsLoaded,
  };
}
