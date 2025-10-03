// Service Worker for PWA offline support
const CACHE_NAME = 'scotcomply-v1'
const STATIC_CACHE = 'scotcomply-static-v1'
const DYNAMIC_CACHE = 'scotcomply-dynamic-v1'

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/dashboard/overview',
  '/manifest.json',
  '/offline.html', // Fallback page
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Caching static files')
      return cache.addAll(STATIC_FILES)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return
  }

  // API requests - network first, cache fallback
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Return cached version if offline
          return caches.match(request)
        })
    )
    return
  }

  // Other requests - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache if not successful
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          // Clone and cache the response
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // Fallback to offline page for navigation requests
          if (request.destination === 'document') {
            return caches.match('/offline.html')
          }
        })
    })
  )
})

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Implement data sync logic here
  console.log('Syncing offline data...')
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'New notification from ScotComply',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title || 'ScotComply', options))
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard')
  )
})
