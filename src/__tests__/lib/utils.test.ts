import { cn } from '@/lib/utils'

describe('cn utility', () => {
  it('should merge classes', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
  })

  it('should handle arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle objects', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle null and undefined', () => {
    expect(cn(null, undefined, 'class1')).toBe('class1')
  })

  it('should merge conflicting Tailwind utilities', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('should preserve non-conflicting classes', () => {
    expect(cn('text-white bg-red-500', 'bg-blue-500')).toBe('text-white bg-blue-500')
  })
})
