'use client'

import React from 'react'

interface State {
  hasError: boolean
  reloading: boolean
}

export class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, reloading: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Intercetta solo ChunkLoadError
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      return { hasError: true }
    }
    // Rilancia altri errori
    throw error
  }

  componentDidCatch(error: Error) {
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      // Auto-reload dopo 1.5s per dare tempo al messaggio di comparire
      this.setState({ reloading: true })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-3 z-[9999]">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Aggiornamento in corso...</p>
          <p className="text-xs text-slate-400">Nuova versione disponibile</p>
        </div>
      )
    }

    return this.props.children
  }
}
