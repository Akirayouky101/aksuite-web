'use client'

import { useEffect } from 'react'

export function usePwa() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error => console.error('Unable to register service worker:', error))
  }, [])
}