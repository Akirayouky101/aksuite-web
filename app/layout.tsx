import type { Metadata, Viewport } from 'next'
import './globals.css'
import './mac-theme.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'AK Suite',
  description: 'Il tuo spazio operativo: appuntamenti, attività, contatti e cassaforte password.',
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = { themeColor: '#030a17' }

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
