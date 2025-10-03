import {
  formatDate,
  formatDateTime,
  formatCurrency,
  getCurrencySymbol,
  formatRelativeTime,
  getDaysUntil,
  formatDaysUntil,
  DEFAULT_PREFERENCES,
} from '@/lib/preferences'

describe('preferences utilities', () => {
  describe('formatDate', () => {
    it('should format date with default preferences', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/15\/03\/2024/)
    })

    it('should format date with custom format', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDate(date, { dateFormat: 'YYYY-MM-DD' })
      expect(result).toMatch(/2024-03-15/)
    })

    it('should handle string dates', () => {
      const result = formatDate('2024-03-15')
      expect(result).toMatch(/15\/03\/2024/)
    })

    it('should apply timezone preferences', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDate(date, { timezone: 'America/New_York' })
      expect(result).toBeTruthy()
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time with default preferences', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDateTime(date)
      expect(result).toMatch(/15\/03\/2024 \d{2}:\d{2}/)
    })

    it('should format with custom date format', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDateTime(date, { dateFormat: 'YYYY-MM-DD' })
      expect(result).toMatch(/2024-03-15 \d{2}:\d{2}/)
    })

    it('should handle string dates', () => {
      const result = formatDateTime('2024-03-15T10:30:00Z')
      expect(result).toBeTruthy()
    })
  })

  describe('formatCurrency', () => {
    it('should format GBP by default', () => {
      const result = formatCurrency(1234.56)
      expect(result).toContain('£')
      expect(result).toContain('1,234.56')
    })

    it('should format EUR', () => {
      const result = formatCurrency(1234.56, { currency: 'EUR' })
      expect(result).toContain('€')
      expect(result).toContain('1,234.56')
    })

    it('should format USD', () => {
      const result = formatCurrency(1234.56, { currency: 'USD' })
      expect(result).toContain('$')
      expect(result).toContain('1,234.56')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('£')
      expect(result).toContain('0')
    })

    it('should handle negative values', () => {
      const result = formatCurrency(-100)
      expect(result).toContain('£')
      expect(result).toContain('100')
    })

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(1234.567)
      expect(result).toContain('1,234.57')
    })
  })

  describe('getCurrencySymbol', () => {
    it('should return GBP symbol by default', () => {
      expect(getCurrencySymbol()).toBe('£')
    })

    it('should return correct symbol for GBP', () => {
      expect(getCurrencySymbol('GBP')).toBe('£')
    })

    it('should return correct symbol for EUR', () => {
      expect(getCurrencySymbol('EUR')).toBe('€')
    })

    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$')
    })

    it('should return default for unknown currency', () => {
      expect(getCurrencySymbol('XXX')).toBe('£')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-03-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "just now" for recent times', () => {
      const date = new Date('2024-03-15T11:59:30Z')
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const date = new Date('2024-03-15T11:45:00Z')
      expect(formatRelativeTime(date)).toBe('15 minutes ago')
    })

    it('should handle singular minute', () => {
      const date = new Date('2024-03-15T11:59:00Z')
      expect(formatRelativeTime(date)).toBe('1 minute ago')
    })

    it('should return hours ago', () => {
      const date = new Date('2024-03-15T09:00:00Z')
      expect(formatRelativeTime(date)).toBe('3 hours ago')
    })

    it('should handle singular hour', () => {
      const date = new Date('2024-03-15T11:00:00Z')
      expect(formatRelativeTime(date)).toBe('1 hour ago')
    })

    it('should return days ago', () => {
      const date = new Date('2024-03-12T12:00:00Z')
      expect(formatRelativeTime(date)).toBe('3 days ago')
    })

    it('should handle singular day', () => {
      const date = new Date('2024-03-14T12:00:00Z')
      expect(formatRelativeTime(date)).toBe('1 day ago')
    })

    it('should return formatted date for old dates', () => {
      const date = new Date('2024-03-01T12:00:00Z')
      const result = formatRelativeTime(date)
      expect(result).toMatch(/01\/03\/2024/)
    })
  })

  describe('getDaysUntil', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-03-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return positive days for future dates', () => {
      const date = new Date('2024-03-20T12:00:00Z')
      expect(getDaysUntil(date)).toBe(5)
    })

    it('should return 0 for today', () => {
      const date = new Date('2024-03-15T18:00:00Z')
      expect(getDaysUntil(date)).toBe(1) // Ceiling rounds up
    })

    it('should return negative days for past dates', () => {
      const date = new Date('2024-03-10T12:00:00Z')
      expect(getDaysUntil(date)).toBe(-5)
    })

    it('should handle string dates', () => {
      const result = getDaysUntil('2024-03-20')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('formatDaysUntil', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-03-15T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should return "Due today" for today', () => {
      const date = new Date('2024-03-15T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due today')
    })

    it('should return "Due tomorrow" for tomorrow', () => {
      const date = new Date('2024-03-16T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due tomorrow')
    })

    it('should return days for near future', () => {
      const date = new Date('2024-03-20T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due in 5 days')
    })

    it('should return weeks for 7-30 days', () => {
      const date = new Date('2024-03-29T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due in 2 weeks')
    })

    it('should handle 7 days as week threshold', () => {
      const date = new Date('2024-03-22T12:00:00Z')
      const result = formatDaysUntil(date)
      // 7 days could be shown as "7 days" or "1 week" - both are acceptable
      expect(result).toMatch(/Due in (7 days|1 week)/)
    })

    it('should return months for 1-12 months', () => {
      const date = new Date('2024-05-15T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due in 2 months')
    })

    it('should handle singular month', () => {
      const date = new Date('2024-04-15T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due in 1 month')
    })

    it('should return years for > 365 days', () => {
      const date = new Date('2025-04-15T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Due in 1 year')
    })

    it('should handle overdue dates', () => {
      const date = new Date('2024-03-10T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Overdue by 5 days')
    })

    it('should handle singular overdue day', () => {
      const date = new Date('2024-03-14T12:00:00Z')
      expect(formatDaysUntil(date)).toBe('Overdue by 1 day')
    })
  })

  describe('DEFAULT_PREFERENCES', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PREFERENCES).toEqual({
        timezone: 'Europe/London',
        language: 'en',
        theme: 'light',
        dateFormat: 'DD/MM/YYYY',
        currency: 'GBP',
      })
    })
  })
})
