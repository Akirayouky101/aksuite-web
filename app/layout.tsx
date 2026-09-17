import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'AK Vault',
  description: 'Gestione password semplice e sicura',
}

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
