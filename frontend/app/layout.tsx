import React from "react"
import type { Metadata } from 'next'
import { League_Spartan } from 'next/font/google'

import './globals.css'
import AuroraBackground from '@/component/AuroraBackground'

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI Interview Agent System',
  description: 'Multi-round AI interview pipeline with specialized agents making pass/fail decisions at each stage.',
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
        <AuroraBackground />
        <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">{children}</main>
      </body>
    </html>
  )
}
