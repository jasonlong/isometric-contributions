import { describe, it, expect } from 'vitest'
import {
  precisionRound,
  rgbToHex,
  datesDayDifference,
  sameDay,
  getContributionCount,
  calculateStreaks
} from './utils.js'

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

describe('getContributionCount', () => {
  it('parses "No contributions" as 0', () => {
    expect(getContributionCount('No contributions on January 9th')).toBe(0)
  })

  it('parses single contribution', () => {
    expect(getContributionCount('1 contribution on January 10th.')).toBe(1)
  })

  it('parses multiple contributions', () => {
    expect(getContributionCount('2 contributions on August 31st.')).toBe(2)
    expect(getContributionCount('15 contributions on March 5th.')).toBe(15)
    expect(getContributionCount('100 contributions on December 25th.')).toBe(100)
  })

  it('returns 0 for non-matching text', () => {
    expect(getContributionCount('Some random text')).toBe(0)
    expect(getContributionCount('')).toBe(0)
  })

  it('handles text with extra content', () => {
    expect(getContributionCount('5 contributions on January 1st. More text here')).toBe(5)
  })
})

describe('calculateStreaks', () => {
  const makeDay = (dateString, count) => ({ date: new Date(dateString), count })

  it('calculates year total', () => {
    const days = [makeDay('2024-01-01', 5), makeDay('2024-01-02', 3), makeDay('2024-01-03', 2)]
    const result = calculateStreaks(days)
    expect(result.yearTotal).toBe(10)
  })

  it('finds best day with max contributions', () => {
    const days = [makeDay('2024-01-01', 5), makeDay('2024-01-02', 10), makeDay('2024-01-03', 3)]
    const result = calculateStreaks(days)
    expect(result.maxCount).toBe(10)
    expect(result.bestDay.toISOString()).toContain('2024-01-02')
  })

  it('calculates longest streak', () => {
    const days = [
      makeDay('2024-01-01', 1),
      makeDay('2024-01-02', 2),
      makeDay('2024-01-03', 3),
      makeDay('2024-01-04', 0),
      makeDay('2024-01-05', 1),
      makeDay('2024-01-06', 1)
    ]
    const result = calculateStreaks(days)
    expect(result.streakLongest).toBe(3)
    expect(result.longestStreakStart.toISOString()).toContain('2024-01-01')
    expect(result.longestStreakEnd.toISOString()).toContain('2024-01-03')
  })

  it('calculates current streak from end of array', () => {
    const days = [
      makeDay('2024-01-01', 0),
      makeDay('2024-01-02', 1),
      makeDay('2024-01-03', 2),
      makeDay('2024-01-04', 3)
    ]
    const result = calculateStreaks(days)
    expect(result.streakCurrent).toBe(3)
    expect(result.currentStreakStart.toISOString()).toContain('2024-01-02')
    expect(result.currentStreakEnd.toISOString()).toContain('2024-01-04')
  })

  it('handles current streak when last day has 0 contributions', () => {
    const days = [
      makeDay('2024-01-01', 1),
      makeDay('2024-01-02', 2),
      makeDay('2024-01-03', 3),
      makeDay('2024-01-04', 0)
    ]
    const result = calculateStreaks(days)
    expect(result.streakCurrent).toBe(3)
    expect(result.currentStreakEnd.toISOString()).toContain('2024-01-03')
  })

  it('returns 0 current streak when no recent activity', () => {
    const days = [makeDay('2024-01-01', 1), makeDay('2024-01-02', 0), makeDay('2024-01-03', 0)]
    const result = calculateStreaks(days)
    expect(result.streakCurrent).toBe(0)
  })

  it('handles empty array', () => {
    const result = calculateStreaks([])
    expect(result.yearTotal).toBe(0)
    expect(result.maxCount).toBe(0)
    expect(result.bestDay).toBe(null)
    expect(result.streakLongest).toBe(0)
    expect(result.streakCurrent).toBe(0)
  })

  it('handles single day with contributions', () => {
    const days = [makeDay('2024-01-01', 5)]
    const result = calculateStreaks(days)
    expect(result.yearTotal).toBe(5)
    expect(result.maxCount).toBe(5)
    expect(result.streakLongest).toBe(1)
    expect(result.streakCurrent).toBe(1)
  })

  it('handles all zero contributions', () => {
    const days = [makeDay('2024-01-01', 0), makeDay('2024-01-02', 0), makeDay('2024-01-03', 0)]
    const result = calculateStreaks(days)
    expect(result.yearTotal).toBe(0)
    expect(result.maxCount).toBe(0)
    expect(result.streakLongest).toBe(0)
    expect(result.streakCurrent).toBe(0)
  })

  it('handles multiple equal-length streaks (takes latest)', () => {
    const days = [
      makeDay('2024-01-01', 1),
      makeDay('2024-01-02', 1),
      makeDay('2024-01-03', 0),
      makeDay('2024-01-04', 1),
      makeDay('2024-01-05', 1)
    ]
    const result = calculateStreaks(days)
    expect(result.streakLongest).toBe(2)
    // Should take the later streak (Jan 4-5)
    expect(result.longestStreakEnd.toISOString()).toContain('2024-01-05')
  })
})
