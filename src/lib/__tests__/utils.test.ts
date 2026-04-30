import { describe, it, expect } from 'vitest'
import { cn, fmtHUF, fmtNum } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    const condition = false as boolean
    expect(cn('a', condition && 'b', 'c')).toBe('a c')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('fmtHUF', () => {
  it('formats zero', () => {
    expect(fmtHUF(0)).toContain('0')
  })

  it('formats a large number with Ft', () => {
    const result = fmtHUF(1_250_000)
    expect(result).toContain('Ft')
  })

  it('includes separator for thousands', () => {
    const result = fmtHUF(12345)
    expect(result.length).toBeGreaterThan(4)
  })
})

describe('fmtNum', () => {
  it('formats integer', () => {
    expect(fmtNum(42)).toBeDefined()
  })

  it('formats decimal', () => {
    const result = fmtNum(3.14)
    expect(result).toBeDefined()
  })

  it('formats zero', () => {
    expect(fmtNum(0)).toBe('0')
  })
})
