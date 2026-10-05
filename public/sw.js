self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  let payload = {}
  try { payload = event.data?.json() ?? {} }
  catch (error) { console.error('Invalid push payload', error) }
  event.waitUntil(self.registration.showNotification(payload.title || 'AK Suite', {
    body: payload.body || '',
    icon: '/favicon.ico',
    data: payload.url || '/',
    tag: payload.tag,
    actions: Array.isArray(payload.actions) ? payload.actions.slice(0, 2) : []
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = new URL(event.notification.data || '/', self.location.origin)
  if (url.origin !== self.location.origin) return
  if (event.action === 'complete' || event.action === 'reschedule') url.searchParams.set('event-action', event.action)
  event.waitUntil(self.clients.openWindow(url.href))
})