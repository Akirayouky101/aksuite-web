self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  const payload = event.data?.json() ?? {}
  event.waitUntil(self.registration.showNotification(payload.title || 'AK Suite', {
    body: payload.body || '',
    icon: '/favicon.ico',
    data: payload.url || '/'
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(self.clients.openWindow(event.notification.data || '/'))
})