import {
  validateFile,
  formatFileSize,
} from '@/lib/storage'

describe('storage utilities', () => {
  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate a valid JPEG file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })

    it('should validate a valid PNG file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject file that is too large', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size must be less than')
    })

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' })
      const result = validateFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('File type')
      expect(result.error).toContain('not allowed')
    })

    it('should accept custom max size', () => {
      const content = new Array(2 * 1024 * 1024).fill('a').join('')
      const file = new File([content], 'test.pdf', { type: 'application/pdf' })
      
      // Should fail with 1MB limit
      const result1 = validateFile(file, { maxSize: 1 * 1024 * 1024 })
      expect(result1.valid).toBe(false)
      
      // Should pass with 5MB limit
      const result2 = validateFile(file, { maxSize: 5 * 1024 * 1024 })
      expect(result2.valid).toBe(true)
    })

    it('should accept custom allowed types', () => {
      const file = new File(['content'], 'test.doc', { type: 'application/msword' })
      
      // Should fail with default types
      const result1 = validateFile(file)
      expect(result1.valid).toBe(false)
      
      // Should pass with custom types
      const result2 = validateFile(file, { allowedTypes: ['application/msword'] })
      expect(result2.valid).toBe(true)
    })

    it('should handle edge case of 0 byte file', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' })
      const result = validateFile(file)
      expect(result.valid).toBe(true)
    })
  })

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
      expect(formatFileSize(1023)).toBe('1023 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatFileSize(2.5 * 1024 * 1024 * 1024)).toBe('2.5 GB')
    })

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB')
    })

    it('should handle large numbers', () => {
      const result = formatFileSize(999 * 1024 * 1024 * 1024)
      expect(result).toContain('GB')
    })
  })
})
