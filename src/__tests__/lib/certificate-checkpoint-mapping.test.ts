import { formatCertificateType } from '@/lib/certificate-checkpoint-mapping'

describe('certificate-checkpoint-mapping utilities', () => {
  describe('formatCertificateType', () => {
    it('should format valid certificate types', () => {
      expect(formatCertificateType('eicr')).toBe('EICR')
      expect(formatCertificateType('EICR')).toBe('EICR')
      expect(formatCertificateType('gas_safety')).toBe('GAS_SAFETY')
      expect(formatCertificateType('GAS SAFETY')).toBe('GAS_SAFETY')
    })

    it('should handle mixed case inputs', () => {
      expect(formatCertificateType('EiCr')).toBe('EICR')
      expect(formatCertificateType('Gas Safety')).toBe('GAS_SAFETY')
    })

    it('should replace spaces with underscores', () => {
      expect(formatCertificateType('gas safety')).toBe('GAS_SAFETY')
      expect(formatCertificateType('pat')).toBe('PAT')
      expect(formatCertificateType('epc')).toBe('EPC')
    })

    it('should return null for invalid certificate types', () => {
      expect(formatCertificateType('invalid')).toBeNull()
      expect(formatCertificateType('unknown_type')).toBeNull()
      expect(formatCertificateType('')).toBeNull()
      expect(formatCertificateType('energy performance')).toBeNull()
    })

    it('should handle extra whitespace by collapsing to single underscore', () => {
      // The function uses \s+ which replaces one or more spaces with single underscore
      const result1 = formatCertificateType('gas  safety')
      expect(result1).toBe('GAS_SAFETY') // Multiple spaces collapsed to one underscore
      
      const result2 = formatCertificateType('  gas   safety  ')
      expect(result2).toBeNull() // Leading/trailing spaces create empty strings after toUpperCase
    })

    it('should handle all valid certificate types', () => {
      expect(formatCertificateType('gas_safety')).toBe('GAS_SAFETY')
      expect(formatCertificateType('eicr')).toBe('EICR')
      expect(formatCertificateType('epc')).toBe('EPC')
      expect(formatCertificateType('pat')).toBe('PAT')
      expect(formatCertificateType('legionella')).toBe('LEGIONELLA')
    })
  })
})
