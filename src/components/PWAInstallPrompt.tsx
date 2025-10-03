'use client'

import { useEffect } from 'react'

export function PWAInstallPrompt() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Service Worker registered:', registration)
          }
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('Service Worker registration failed:', error)
          }
        })

      // Handle install prompt
      let deferredPrompt: any

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e
        
        // Show custom install UI (optional)
        const shouldShowPrompt = localStorage.getItem('pwa-install-dismissed') !== 'true'
        
        if (shouldShowPrompt && process.env.NODE_ENV === 'development') {
          console.log('PWA install prompt available')
        }
      })

      window.addEventListener('appinstalled', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('PWA installed successfully')
        }
        deferredPrompt = null
      })
    }
  }, [])

  return null
}
