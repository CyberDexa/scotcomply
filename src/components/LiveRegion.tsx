'use client'

import { useEffect, useState } from 'react'

interface LiveRegionProps {
  message?: string
  politeness?: 'polite' | 'assertive' | 'off'
  clearDelay?: number
}

/**
 * LiveRegion component for screen reader announcements
 * 
 * @example
 * // Success message
 * <LiveRegion message="Property saved successfully" politeness="polite" />
 * 
 * // Error message
 * <LiveRegion message="Failed to save property" politeness="assertive" />
 * 
 * // Loading state
 * <LiveRegion message="Loading properties..." politeness="polite" />
 */
export function LiveRegion({ 
  message = '', 
  politeness = 'polite',
  clearDelay = 5000 
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message)

  useEffect(() => {
    if (message) {
      setAnnouncement(message)
      
      // Clear message after delay to allow for new announcements
      if (clearDelay > 0) {
        const timer = setTimeout(() => {
          setAnnouncement('')
        }, clearDelay)
        
        return () => clearTimeout(timer)
      }
    }
  }, [message, clearDelay])

  if (!announcement) return null

  return (
    <div
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  )
}

/**
 * Hook for managing screen reader announcements
 * 
 * @example
 * const { announce } = useAnnounce()
 * 
 * const handleSave = async () => {
 *   await saveProperty()
 *   announce('Property saved successfully')
 * }
 */
export function useAnnounce() {
  const [message, setMessage] = useState('')
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>('polite')

  const announce = (text: string, priority: 'polite' | 'assertive' = 'polite') => {
    setPoliteness(priority)
    setMessage(text)
  }

  const clearAnnouncement = () => {
    setMessage('')
  }

  return {
    announce,
    clearAnnouncement,
    message,
    politeness,
    LiveRegionComponent: () => (
      <LiveRegion message={message} politeness={politeness} />
    ),
  }
}
