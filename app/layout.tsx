import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AK Suite - Your Digital Vault',
  description: 'Secure password manager and productivity suite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
