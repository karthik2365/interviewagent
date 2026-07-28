"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Overview" },
  { href: "/interview", label: "Start Evaluation" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't show navbar during active interview rounds
  if (pathname.startsWith("/round/")) return null;

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(9, 10, 15, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--max-width)",
          margin: "0 auto",
          padding: "0 24px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            EVALIA
          </span>
          <span style={{ color: "var(--color-border)", fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: "var(--color-text-subtle)", fontFamily: "var(--font-mono)" }}>
            v2.0
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 24 }}>
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-text-heading)" : "var(--color-text-muted)",
                  textDecoration: "none",
                  transition: "color var(--transition-fast)",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            href="/interview"
            className="btn-primary"
            style={{
              padding: "6px 14px",
              fontSize: 12,
            }}
          >
            New Evaluation
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text)",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
          }}
        >
          {mobileOpen ? "CLOSE" : "MENU"}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: "var(--color-bg)",
            borderBottom: "1px solid var(--color-border)",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: 14,
                color: pathname === link.href ? "var(--color-primary)" : "var(--color-text)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
