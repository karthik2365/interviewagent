"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Section 1 — Hero intro video.
 * Autoplays once on load, stops on the last frame. No looping, no scroll control.
 */
export default function TextExtrusionSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    // Attempt autoplay once metadata is ready
    const play = () => {
      vid.play().catch(() => {
        // Autoplay blocked — video stays on first frame, which is fine
      });
    };

    vid.addEventListener("loadeddata", play);
    return () => vid.removeEventListener("loadeddata", play);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#05080f",
      }}
    >
      <video
        ref={videoRef}
        src="/hero-intro.mp4"
        muted
        playsInline
        preload="auto"
        onEnded={() => setEnded(true)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Bottom fade for smooth transition into next section */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20vh",
          background: "linear-gradient(to bottom, transparent, #05080f)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* Scroll prompt — appears after video ends */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ended ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          position: "absolute",
          bottom: "8vh",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: "rgba(224,232,240,0.35)",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut",
            }}
            style={{
              width: 20,
              height: 32,
              borderRadius: 10,
              border: "1.5px solid rgba(224,232,240,0.2)",
              display: "flex",
              justifyContent: "center",
              paddingTop: 6,
            }}
          >
            <div
              style={{
                width: 3,
                height: 6,
                borderRadius: 2,
                background: "rgba(249,115,22,0.6)",
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
