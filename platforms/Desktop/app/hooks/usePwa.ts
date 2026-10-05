'use client'

import { useEffect } from 'react'
import { useAuth } from './useAuth'

export function usePwa() {
  const { user, authLoading } = useAuth()
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(error => console.error('Unable to register service worker:', error))
  }, [])
  useEffect(() => {
    if (authLoading || user || !('serviceWorker' in navigator)) return
    void navigator.serviceWorker.getRegistration().then(async registration => {
      const subscription = await registration?.pushManager?.getSubscription()
      if (subscription && !await subscription.unsubscribe()) throw new Error('Unable to unsubscribe after logout')
    }).catch(error => console.error('Web Push logout cleanup failed:', error))
  }, [user?.id, authLoading])
}