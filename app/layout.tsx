import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: {
    default: 'Fronteira Geek - Your Daily Dose of Geek News',
    template: '%s | Fronteira Geek',
  },
  description: 'The ultimate source for geek news covering anime, games, Marvel, DC, Star Wars, RPG, and tech.',
  openGraph: {
    title: 'Fronteira Geek',
    description: 'The ultimate source for geek news.',
    siteName: 'Fronteira Geek',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1318',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  )
}
