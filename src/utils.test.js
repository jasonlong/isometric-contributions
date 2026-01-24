import { describe, it, expect } from 'vitest'
import { precisionRound, rgbToHex, datesDayDifference, sameDay } from './utils.js'

describe('precisionRound', () => {
  it('rounds to 0 decimal places', () => {
    expect(precisionRound(3.141_59, 0)).toBe(3)
    expect(precisionRound(3.5, 0)).toBe(4)
  })

  it('rounds to 2 decimal places', () => {
    expect(precisionRound(3.141_59, 2)).toBe(3.14)
    expect(precisionRound(3.145, 2)).toBe(3.15)
    expect(precisionRound(3.144, 2)).toBe(3.14)
  })

  it('rounds to 4 decimal places', () => {
    expect(precisionRound(3.141_592_65, 4)).toBe(3.1416)
  })

  it('handles whole numbers', () => {
    expect(precisionRound(5, 2)).toBe(5)
    expect(precisionRound(100, 0)).toBe(100)
  })

  it('handles negative numbers', () => {
    expect(precisionRound(-3.141_59, 2)).toBe(-3.14)
    expect(precisionRound(-3.145, 2)).toBe(-3.14) // Note: JS rounds -3.145 to -3.14
  })
})

describe('rgbToHex', () => {
  it('converts comma-separated RGB to hex', () => {
    expect(rgbToHex('rgb(255, 255, 255)')).toBe('ffffff')
    expect(rgbToHex('rgb(0, 0, 0)')).toBe('000000')
    expect(rgbToHex('rgb(255, 128, 0)')).toBe('ff8000')
  })

  it('converts space-separated RGB to hex', () => {
    expect(rgbToHex('rgb(255 255 255)')).toBe('ffffff')
    expect(rgbToHex('rgb(0 0 0)')).toBe('000000')
    expect(rgbToHex('rgb(255 128 0)')).toBe('ff8000')
  })

  it('pads small values with leading zeros', () => {
    expect(rgbToHex('rgb(1, 2, 3)')).toBe('010203')
    expect(rgbToHex('rgb(0, 15, 16)')).toBe('000f10')
  })

  it('handles GitHub contribution colors', () => {
    // Typical GitHub contribution graph colors
    expect(rgbToHex('rgb(57, 211, 83)')).toBe('39d353')
    expect(rgbToHex('rgb(38, 166, 65)')).toBe('26a641')
    expect(rgbToHex('rgb(22, 27, 34)')).toBe('161b22')
  })
})

describe('datesDayDifference', () => {
  it('returns 0 for same day', () => {
    const date = new Date('2024-01-15')
    expect(datesDayDifference(date, date)).toBe(0)
  })

  it('calculates days between two dates', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2024-01-10')
    expect(datesDayDifference(date1, date2)).toBe(9)
  })

  it('returns positive value regardless of date order', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2024-01-10')
    expect(datesDayDifference(date2, date1)).toBe(9)
  })

  it('handles year boundaries', () => {
    const date1 = new Date('2023-12-31')
    const date2 = new Date('2024-01-01')
    expect(datesDayDifference(date1, date2)).toBe(1)
  })

  it('returns null if first date is null', () => {
    const date = new Date('2024-01-15')
    expect(datesDayDifference(null, date)).toBe(null)
  })

  it('returns null if second date is null', () => {
    const date = new Date('2024-01-15')
    expect(datesDayDifference(date, null)).toBe(null)
  })

  it('returns null if both dates are null', () => {
    expect(datesDayDifference(null, null)).toBe(null)
  })
})

describe('sameDay', () => {
  it('returns true for same day', () => {
    const d1 = new Date('2024-01-15T00:00:00')
    const d2 = new Date('2024-01-15T00:00:00')
    expect(sameDay(d1, d2)).toBe(true)
  })

  it('returns true for same day with different times', () => {
    const d1 = new Date('2024-01-15T09:30:00')
    const d2 = new Date('2024-01-15T23:59:59')
    expect(sameDay(d1, d2)).toBe(true)
  })

  it('returns false for different days', () => {
    const d1 = new Date('2024-01-15')
    const d2 = new Date('2024-01-16')
    expect(sameDay(d1, d2)).toBe(false)
  })

  it('returns false for same day in different months', () => {
    const d1 = new Date('2024-01-15')
    const d2 = new Date('2024-02-15')
    expect(sameDay(d1, d2)).toBe(false)
  })

  it('returns false for same day in different years', () => {
    const d1 = new Date('2023-01-15')
    const d2 = new Date('2024-01-15')
    expect(sameDay(d1, d2)).toBe(false)
  })
})
