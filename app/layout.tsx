import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { headers } from 'next/headers'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: {
    default: 'Fronteira Geek - Sua Dose Diaria de Noticias Geek',
    template: '%s | Fronteira Geek',
  },
  description: 'A melhor fonte de noticias geek sobre anime, games, Marvel, DC, Star Wars, RPG e tecnologia.',
  openGraph: {
    title: 'Fronteira Geek',
    description: 'A melhor fonte de noticias geek.',
    siteName: 'Fronteira Geek',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1318',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Request-specific rendering lets Next attach the CSP nonce to its scripts.
  await headers()
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  )
}
