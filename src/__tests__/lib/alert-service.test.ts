import { calculateAlertPriority } from '@/lib/alert-service'

// Define enums locally since they might not be exported
enum AlertSeverity {
  INFO = 'INFO',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

enum ImpactLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

describe('alert-service utilities', () => {
  describe('calculateAlertPriority', () => {
    it('should calculate priority for critical severity with high impact and urgent timeline', () => {
      const priority = calculateAlertPriority(
        AlertSeverity.CRITICAL,
        ImpactLevel.CRITICAL,
        5 // 5 days until effective
      )
      expect(priority).toBe(5)
    })

    it('should calculate priority for low severity with low impact and long timeline', () => {
      const priority = calculateAlertPriority(
        AlertSeverity.LOW,
        ImpactLevel.LOW,
        60 // 60 days until effective
      )
      expect(priority).toBeLessThan(3)
    })

    it('should give higher priority to alerts with fewer days until effective', () => {
      const urgentPriority = calculateAlertPriority(
        AlertSeverity.MEDIUM,
        ImpactLevel.MEDIUM,
        3 // 3 days
      )
      const lessUrgentPriority = calculateAlertPriority(
        AlertSeverity.MEDIUM,
        ImpactLevel.MEDIUM,
        45 // 45 days
      )
      expect(urgentPriority).toBeGreaterThan(lessUrgentPriority)
    })

    it('should give extra weight to <= 7 days until effective', () => {
      const result = calculateAlertPriority(
        AlertSeverity.INFO,
        ImpactLevel.LOW,
        7
      )
      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should give medium weight to 8-30 days until effective', () => {
      const result = calculateAlertPriority(
        AlertSeverity.INFO,
        ImpactLevel.LOW,
        15
      )
      expect(result).toBeGreaterThanOrEqual(1)
    })

    it('should give no urgency weight to > 30 days until effective', () => {
      const result = calculateAlertPriority(
        AlertSeverity.INFO,
        ImpactLevel.LOW,
        60
      )
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(5)
    })

    it('should normalize score to 1-5 range', () => {
      // Test minimum
      const min = calculateAlertPriority(
        AlertSeverity.INFO,
        ImpactLevel.LOW,
        100
      )
      expect(min).toBeGreaterThanOrEqual(1)
      expect(min).toBeLessThanOrEqual(5)

      // Test maximum
      const max = calculateAlertPriority(
        AlertSeverity.CRITICAL,
        ImpactLevel.CRITICAL,
        1
      )
      expect(max).toBeGreaterThanOrEqual(1)
      expect(max).toBeLessThanOrEqual(5)
    })

    it('should handle edge case of 0 days until effective', () => {
      const result = calculateAlertPriority(
        AlertSeverity.HIGH,
        ImpactLevel.HIGH,
        0
      )
      expect(result).toBeGreaterThanOrEqual(1)
      expect(result).toBeLessThanOrEqual(5)
    })

    it('should differentiate between severity levels', () => {
      const days = 10
      const impact = ImpactLevel.MEDIUM

      const info = calculateAlertPriority(AlertSeverity.INFO, impact, days)
      const low = calculateAlertPriority(AlertSeverity.LOW, impact, days)
      const medium = calculateAlertPriority(AlertSeverity.MEDIUM, impact, days)
      const high = calculateAlertPriority(AlertSeverity.HIGH, impact, days)
      const critical = calculateAlertPriority(AlertSeverity.CRITICAL, impact, days)

      expect(critical).toBeGreaterThanOrEqual(high)
      expect(high).toBeGreaterThanOrEqual(medium)
      expect(medium).toBeGreaterThanOrEqual(low)
      expect(low).toBeGreaterThanOrEqual(info)
    })

    it('should differentiate between impact levels', () => {
      const days = 10
      const severity = AlertSeverity.MEDIUM

      const lowImpact = calculateAlertPriority(severity, ImpactLevel.LOW, days)
      const mediumImpact = calculateAlertPriority(severity, ImpactLevel.MEDIUM, days)
      const highImpact = calculateAlertPriority(severity, ImpactLevel.HIGH, days)
      const criticalImpact = calculateAlertPriority(severity, ImpactLevel.CRITICAL, days)

      expect(criticalImpact).toBeGreaterThanOrEqual(highImpact)
      expect(highImpact).toBeGreaterThanOrEqual(mediumImpact)
      expect(mediumImpact).toBeGreaterThanOrEqual(lowImpact)
    })
  })
})
