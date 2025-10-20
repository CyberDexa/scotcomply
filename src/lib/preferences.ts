/**
 * User Preferences Utilities
 * Apply user settings throughout the application
 */

import { format } from 'date-fns'

export interface UserPreferences {
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'system'
  dateFormat: string
  currency: string
}

/**
 * Format a date according to user preferences
 */
export function formatDate(
  date: Date | string,
  preferences?: Partial<UserPreferences>
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFormatStr = preferences?.dateFormat || 'DD/MM/YYYY'

  // Convert our format string to date-fns format
  const fnsFormat = dateFormatStr
    .replace('DD', 'dd')
    .replace('MM', 'MM')
    .replace('YYYY', 'yyyy')

  return format(dateObj, fnsFormat)
}

/**
 * Format a date and time according to user preferences
 */
export function formatDateTime(
  date: Date | string,
  preferences?: Partial<UserPreferences>
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const dateFormatStr = preferences?.dateFormat || 'DD/MM/YYYY'

  // Convert our format string to date-fns format
  let fnsFormat = dateFormatStr
    .replace('DD', 'dd')
    .replace('MM', 'MM')
    .replace('YYYY', 'yyyy')

  // Add time to format
  fnsFormat += ' HH:mm'

  return format(dateObj, fnsFormat)
}

/**
 * Format a currency value according to user preferences
 */
export function formatCurrency(
  amount: number,
  preferences?: Partial<UserPreferences>
): string {
  const currency = preferences?.currency || 'GBP'
  const locale = getLocaleFromCurrency(currency)

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

/**
 * Get locale from currency code
 */
function getLocaleFromCurrency(currency: string): string {
  const localeMap: Record<string, string> = {
    GBP: 'en-GB',
    EUR: 'en-IE',
    USD: 'en-US',
  }
  return localeMap[currency] || 'en-GB'
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string = 'GBP'): string {
  const symbols: Record<string, string> = {
    GBP: '£',
    EUR: '€',
    USD: '$',
  }
  return symbols[currency] || '£'
}

/**
 * Format a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
  date: Date | string,
  preferences?: Partial<UserPreferences>
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) {
    return 'just now'
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
  } else {
    // For older dates, show full date
    return formatDate(dateObj, preferences)
  }
}

/**
 * Get days until a future date
 */
export function getDaysUntil(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Format days until with text
 */
export function formatDaysUntil(date: Date | string): string {
  const days = getDaysUntil(date)
  
  if (days < 0) {
    return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
  } else if (days === 0) {
    return 'Due today'
  } else if (days === 1) {
    return 'Due tomorrow'
  } else if (days <= 7) {
    return `Due in ${days} days`
  } else if (days <= 30) {
    const weeks = Math.floor(days / 7)
    return `Due in ${weeks} week${weeks !== 1 ? 's' : ''}`
  } else if (days <= 365) {
    const months = Math.floor(days / 30)
    return `Due in ${months} month${months !== 1 ? 's' : ''}`
  } else {
    const years = Math.floor(days / 365)
    return `Due in ${years} year${years !== 1 ? 's' : ''}`
  }
}

/**
 * Apply theme preference
 */
export function applyTheme(theme: 'light' | 'dark' | 'system') {
  if (typeof window === 'undefined') return

  const root = window.document.documentElement

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    root.classList.remove('light', 'dark')
    root.classList.add(systemTheme)
  } else {
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }
}

/**
 * Get current theme
 */
export function getCurrentTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Default preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  timezone: 'Europe/London',
  language: 'en',
  theme: 'light',
  dateFormat: 'DD/MM/YYYY',
  currency: 'GBP',
}
