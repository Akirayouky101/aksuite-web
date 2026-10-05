import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'AK Vault',
  description: 'Gestione password semplice e sicura',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = { themeColor: '#2d2754' }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
