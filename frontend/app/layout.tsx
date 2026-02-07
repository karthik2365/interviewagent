import type { Metadata } from "next";
import "./globals.css";
import ReactLenis from "lenis/react";

export const metadata: Metadata = {
  title: "AI Interview Agent System",
  description:
    "Multi-round AI interview pipeline with specialized agents making pass/fail decisions at each stage.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis root>
      <html lang="en">
        <body className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                AI
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Interview Agent System
              </h1>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-10">{children}</main>
        </body>
      </html>
    </ReactLenis>
  );
}
