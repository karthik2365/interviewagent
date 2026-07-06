"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════
   Shared scroll progress — piped into Three.js via context
   ═══════════════════════════════════════════════════════ */
const ScrollProgressCtx = createContext<React.MutableRefObject<number>>(
  { current: 0 } as React.MutableRefObject<number>
);

const SCROLL_PAGES = 5;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function curve(scroll: number, centre: number, halfWidth: number) {
  const dist = Math.abs(scroll - centre);
  return clamp(1 - dist / halfWidth, 0, 1);
}

/* ═══════════════════════════════════════════════════════
   Procedural MacBook
   ═══════════════════════════════════════════════════════ */
function CodedMacbook() {
  const group = useRef<THREE.Group>(null);
  const screenGlow = useRef<THREE.PointLight>(null);
  const progress = useContext(ScrollProgressCtx);

  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color: "#2a2a2e",
        metalness: 0.85,
        roughness: 0.2,
      }),
      bezel: new THREE.MeshStandardMaterial({
        color: "#1a1a1e",
        metalness: 0.6,
        roughness: 0.3,
      }),
      screen: new THREE.MeshBasicMaterial({
        color: "#f97316",
        toneMapped: false,
      }),
      key: new THREE.MeshStandardMaterial({
        color: "#1e1e22",
        metalness: 0.4,
        roughness: 0.5,
      }),
      trackpad: new THREE.MeshStandardMaterial({
        color: "#252528",
        metalness: 0.5,
        roughness: 0.35,
      }),
    }),
    []
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const p = progress.current;

    const r1 = clamp(p * 3, 0, 1);
    const r2 = clamp(p * 3 - 1, 0, 1);
    const r3 = clamp(p * 3 - 2, 0, 1);

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      Math.PI -
        (r1 * Math.PI) / 4 +
        (r2 * Math.PI) / 2 -
        (r3 * Math.PI) / 4,
      4,
      delta
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      0.2 - r2 * 0.1 + r3 * 0.2,
      4,
      delta
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      -1 - r3 * 0.5 + Math.sin(state.clock.elapsedTime) * 0.1,
      4,
      delta
    );
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      r1 * 2 - r2 * 4 + r3 * 2,
      4,
      delta
    );

    if (screenGlow.current) {
      screenGlow.current.intensity =
        1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]} rotation={[0, Math.PI, 0]}>
      <Float floatIntensity={1} rotationIntensity={0.2} speed={2}>
        <group>
          {/* ── Base ── */}
          <RoundedBox
            args={[4.2, 0.12, 2.8]}
            radius={0.04}
            smoothness={4}
            position={[0, 0, 0]}
            material={mats.body}
          />
          {/* ── Keyboard area ── */}
          <mesh position={[0, 0.07, -0.15]}>
            <boxGeometry args={[3.4, 0.02, 1.6]} />
            <primitive object={mats.key} attach="material" />
          </mesh>
          {/* ── Keys ── */}
          {[...Array(5)].map((_, row) =>
            [...Array(12)].map((_, col) => (
              <mesh
                key={`key-${row}-${col}`}
                position={[-1.5 + col * 0.27, 0.085, -0.75 + row * 0.3]}
              >
                <boxGeometry args={[0.22, 0.015, 0.22]} />
                <primitive object={mats.key} attach="material" />
              </mesh>
            ))
          )}
          {/* ── Trackpad ── */}
          <RoundedBox
            args={[1.4, 0.01, 0.9]}
            radius={0.03}
            smoothness={4}
            position={[0, 0.075, 1.05]}
            material={mats.trackpad}
          />
          {/* ── Hinge ── */}
          <mesh position={[0, 0.1, -1.4]}>
            <boxGeometry args={[4.0, 0.1, 0.08]} />
            <primitive object={mats.body} attach="material" />
          </mesh>
          {/* ── Screen lid ── */}
          <group position={[0, 0.15, -1.4]} rotation={[-0.15, 0, 0]}>
            <RoundedBox
              args={[4.2, 2.8, 0.1]}
              radius={0.04}
              smoothness={4}
              position={[0, 1.4, 0]}
              material={mats.bezel}
            />
            <mesh position={[0, 1.4, 0.051]}>
              <planeGeometry args={[3.8, 2.45]} />
              <primitive object={mats.screen} attach="material" />
            </mesh>
            <pointLight
              ref={screenGlow}
              position={[0, 1.4, 1]}
              color="#f97316"
              intensity={1.5}
              distance={6}
              decay={2}
            />
          </group>
        </group>
      </Float>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════
   Main export — gradient video bg + MacBook + overlays
   ═══════════════════════════════════════════════════════ */
export default function MacbookScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<number>(0);
  const rafId = useRef<number>(0);

  const screen1 = useRef<HTMLDivElement>(null);
  const screen2 = useRef<HTMLDivElement>(null);
  const screen3 = useRef<HTMLDivElement>(null);
  const screen4 = useRef<HTMLDivElement>(null);

  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const vid = videoRef.current;
    if (!container || !vid) return;

    const onScroll = () => {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const scrollHeight = container.scrollHeight - window.innerHeight;
        const scrollTop = -rect.top;
        const p = clamp(scrollTop / scrollHeight, 0, 1);

        // Share with Three.js
        progressRef.current = p;

        // Scrub gradient video
        const duration = vid.duration;
        if (duration && !isNaN(duration)) {
          vid.currentTime = p * duration;
        }

        // ── Overlay animations ──
        if (screen1.current) {
          const fadeOut = clamp(1 - p * 6, 0, 1);
          screen1.current.style.opacity = `${fadeOut}`;
          screen1.current.style.transform = `translateX(-50%) translateY(${-p * 200}px)`;
        }
        if (screen2.current) {
          const vis = curve(p, 0.25, 0.15);
          screen2.current.style.opacity = `${vis}`;
          screen2.current.style.transform = `translateY(${(1 - vis) * 50}px)`;
        }
        if (screen3.current) {
          const vis = curve(p, 0.5, 0.15);
          screen3.current.style.opacity = `${vis}`;
          screen3.current.style.transform = `translateY(${(1 - vis) * 50}px)`;
        }
        if (screen4.current) {
          const vis = curve(p, 0.8, 0.15);
          screen4.current.style.opacity = `${vis}`;
          screen4.current.style.transform = `translateX(-50%) translateY(${(1 - vis) * 50}px)`;
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [videoReady]);

  return (
    <section
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${SCROLL_PAGES * 100}vh`,
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* L1 — Gradient video background */}
        <video
          ref={videoRef}
          src="/hero-bg.mp4"
          muted
          playsInline
          preload="auto"
          onLoadedMetadata={() => {
            const vid = videoRef.current;
            if (vid) {
              vid.pause();
              vid.currentTime = 0;
              setVideoReady(true);
            }
          }}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* L2 — Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(5,8,15,0.55) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* Top fade — blends from previous section */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "12vh",
            background: "linear-gradient(to bottom, #05080f, transparent)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        {/* L3 — Three.js Canvas (transparent) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <ScrollProgressCtx.Provider value={progressRef}>
            <Canvas
              camera={{ position: [0, 0, 8], fov: 35 }}
              style={{ background: "transparent", pointerEvents: "none" }}
              gl={{ alpha: true }}
            >
              <Environment preset="city" />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <CodedMacbook />
            </Canvas>
          </ScrollProgressCtx.Provider>
        </div>

        {/* L4 — HTML overlays */}

        {/* Screen 1: Section title */}
        <div
          ref={screen1}
          style={{
            position: "absolute",
            top: "20vh",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            width: "100%",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 60px)",
                fontWeight: 800,
                background:
                  "linear-gradient(135deg, #fff 0%, #f97316 50%, #fb923c 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                lineHeight: 1.1,
                margin: "0 0 16px",
              }}
            >
              How It Works
            </h2>
            <p
              style={{
                color: "rgba(224,232,240,0.6)",
                fontSize: "18px",
              }}
            >
              Four specialized agents, one seamless pipeline.
            </p>
          </motion.div>
        </div>

        {/* Screen 2: Round 1 */}
        <div
          ref={screen2}
          style={{
            position: "absolute",
            top: "30vh",
            left: "10vw",
            maxWidth: "400px",
            opacity: 0,
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.3)",
              padding: "4px 12px",
              borderRadius: "20px",
              display: "inline-block",
              color: "#f97316",
              marginBottom: "16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              backdropFilter: "blur(8px)",
            }}
          >
            ROUND 1
          </div>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 700,
              margin: "0 0 16px",
              color: "white",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            AI Resume Screening
          </h2>
          <p
            style={{
              color: "rgba(224,232,240,0.75)",
              fontSize: "16px",
              lineHeight: 1.6,
              textShadow: "0 1px 10px rgba(0,0,0,0.4)",
            }}
          >
            Intelligent ATS agent evaluates role fit, skills alignment, and
            experience depth in seconds. Say goodbye to manual parsing.
          </p>
        </div>

        {/* Screen 3: Round 2 & 3 */}
        <div
          ref={screen3}
          style={{
            position: "absolute",
            top: "30vh",
            right: "10vw",
            maxWidth: "400px",
            opacity: 0,
            textAlign: "right",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(249,115,22,0.15)",
              border: "1px solid rgba(249,115,22,0.3)",
              padding: "4px 12px",
              borderRadius: "20px",
              display: "inline-block",
              color: "#fb923c",
              marginBottom: "16px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              backdropFilter: "blur(8px)",
            }}
          >
            ROUND 2 &amp; 3
          </div>
          <h2
            style={{
              fontSize: "40px",
              fontWeight: 700,
              margin: "0 0 16px",
              color: "white",
              textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            }}
          >
            Technical Deep-Dive
          </h2>
          <p
            style={{
              color: "rgba(224,232,240,0.75)",
              fontSize: "16px",
              lineHeight: 1.6,
              textShadow: "0 1px 10px rgba(0,0,0,0.4)",
            }}
          >
            Specialized technical agents probe system design, coding ability,
            and architectural thinking through rigorous, context-aware
            challenges.
          </p>
        </div>

        {/* Screen 4: Hiring Committee CTA */}
        <div
          ref={screen4}
          style={{
            position: "absolute",
            top: "25vh",
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            width: "100%",
            opacity: 0,
            zIndex: 3,
          }}
        >
          <img
            src="/logo.webp"
            alt="Logo"
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 24px",
              borderRadius: 12,
            }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <h2
            style={{
              fontSize: "48px",
              fontWeight: 800,
              margin: "0 0 24px",
              color: "white",
              textShadow: "0 2px 30px rgba(0,0,0,0.5)",
            }}
          >
            Hiring Committee
          </h2>
          <p
            style={{
              color: "rgba(224,232,240,0.75)",
              fontSize: "18px",
              maxWidth: "600px",
              margin: "0 auto 40px",
              textShadow: "0 1px 10px rgba(0,0,0,0.4)",
            }}
          >
            Multi-agent deliberation synthesizes all evidence into a
            transparent, auditable final decision. Eliminate bias, hire with
            confidence.
          </p>
          <a
            href="/interview"
            style={{
              padding: "16px 48px",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: "#05080f",
              background: "linear-gradient(135deg, #f97316, #ea580c)",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(249,115,22,0.3)",
              textDecoration: "none",
              display: "inline-block",
              pointerEvents: "auto",
            }}
          >
            Start Your Interview →
          </a>
        </div>
      </div>
    </section>
  );
}
