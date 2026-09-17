'use client'

import { AuthProvider } from '../platforms/Desktop/app/hooks/useAuth'
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ChunkErrorBoundary>
  )
}
