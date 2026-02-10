import React from "react"
import type { Metadata } from 'next'
import { League_Spartan } from 'next/font/google'

import './globals.css'

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Interview Agent — Multi-Agent Interview Engine',
  description: 'Four specialized AI agents conduct a rigorous multi-round interview. Every decision is evidence-based, auditable, and transparent.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={leagueSpartan.variable}>
      <body className="font-sans antialiased bg-black text-white" style={{ fontFamily: 'var(--font-league-spartan), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
