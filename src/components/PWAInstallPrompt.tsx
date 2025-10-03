'use client'

import { useEffect } from 'react'

export function PWAInstallPrompt() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })

      // Handle install prompt
      let deferredPrompt: any

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e
        
        // Show custom install UI (optional)
        const shouldShowPrompt = localStorage.getItem('pwa-install-dismissed') !== 'true'
        
        if (shouldShowPrompt) {
          // Could show a custom banner here
          console.log('PWA install prompt available')
        }
      })

      window.addEventListener('appinstalled', () => {
        console.log('PWA installed successfully')
        deferredPrompt = null
      })
    }
  }, [])

  return null
}
