'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { applyTheme, DEFAULT_PREFERENCES, UserPreferences } from '@/lib/preferences'

interface PreferencesContextType {
  preferences: UserPreferences
  isLoading: boolean
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
)

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user settings
  const { data: settings, isLoading: isLoadingSettings } =
    trpc.settings.getSettings.useQuery()

  // Initialize preferences from settings
  useEffect(() => {
    if (settings) {
      const userPreferences: UserPreferences = {
        timezone: settings.timezone || DEFAULT_PREFERENCES.timezone,
        language: settings.language || DEFAULT_PREFERENCES.language,
        theme: (settings.theme as 'light' | 'dark' | 'system') || DEFAULT_PREFERENCES.theme,
        dateFormat: settings.dateFormat || DEFAULT_PREFERENCES.dateFormat,
        currency: settings.currency || DEFAULT_PREFERENCES.currency,
      }
      setPreferences(userPreferences)
      
      // Apply theme on load
      applyTheme(userPreferences.theme)
      
      setIsLoading(false)
    } else if (!isLoadingSettings) {
      setIsLoading(false)
    }
  }, [settings, isLoadingSettings])

  // Listen for system theme changes when theme is 'system'
  useEffect(() => {
    if (preferences.theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      applyTheme('system')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [preferences.theme])

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)

    // Apply theme immediately
    if (newPreferences.theme) {
      applyTheme(newPreferences.theme)
    }
  }

  return (
    <PreferencesContext.Provider
      value={{ preferences, isLoading, updatePreferences }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider')
  }
  return context
}
