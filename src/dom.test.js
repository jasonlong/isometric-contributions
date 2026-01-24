/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  applyViewType,
  getElementColor,
  parseCalendarGraph,
  loadSetting,
  saveSetting,
  generateContributionsMarkup,
  generateStreaksMarkup
} from './utils.js'

// =============================================================================
// 1. applyViewType - CSS class toggling
// =============================================================================

describe('applyViewType', () => {
  let element

  beforeEach(() => {
    element = document.createElement('div')
  })

  it('adds ic-squares class and removes ic-cubes for squares type', () => {
    element.classList.add('ic-cubes')
    applyViewType(element, 'squares')
    expect(element.classList.contains('ic-squares')).toBe(true)
    expect(element.classList.contains('ic-cubes')).toBe(false)
  })

  it('adds ic-cubes class and removes ic-squares for cubes type', () => {
    element.classList.add('ic-squares')
    applyViewType(element, 'cubes')
    expect(element.classList.contains('ic-cubes')).toBe(true)
    expect(element.classList.contains('ic-squares')).toBe(false)
  })

  it('adds ic-cubes for any non-squares type', () => {
    applyViewType(element, 'anything')
    expect(element.classList.contains('ic-cubes')).toBe(true)
    expect(element.classList.contains('ic-squares')).toBe(false)
  })

  it('handles toggling from cubes to squares', () => {
    applyViewType(element, 'cubes')
    expect(element.classList.contains('ic-cubes')).toBe(true)

    applyViewType(element, 'squares')
    expect(element.classList.contains('ic-squares')).toBe(true)
    expect(element.classList.contains('ic-cubes')).toBe(false)
  })
})

// =============================================================================
// 2. Settings functions (loadSetting, saveSetting)
// =============================================================================

describe('loadSetting', () => {
  it('loads from chrome storage API', async () => {
    const mockStorage = {
      get: vi.fn((keys, callback) => {
        callback({ toggleSetting: 'squares' })
      })
    }
    const result = await loadSetting(mockStorage, 'toggleSetting', 'cubes')
    expect(result).toBe('squares')
    expect(mockStorage.get).toHaveBeenCalledWith(['toggleSetting'], expect.any(Function))
  })

  it('returns default value when chrome storage key is missing', async () => {
    const mockStorage = {
      get: vi.fn((keys, callback) => {
        callback({})
      })
    }
    const result = await loadSetting(mockStorage, 'toggleSetting', 'cubes')
    expect(result).toBe('cubes')
  })

  it('loads from localStorage-like API', async () => {
    const mockStorage = { toggleSetting: 'squares' }
    const result = await loadSetting(mockStorage, 'toggleSetting', 'cubes')
    expect(result).toBe('squares')
  })

  it('returns default value when localStorage key is missing', async () => {
    const mockStorage = {}
    const result = await loadSetting(mockStorage, 'toggleSetting', 'cubes')
    expect(result).toBe('cubes')
  })

  it('returns default value when storage is null', async () => {
    const result = await loadSetting(null, 'toggleSetting', 'cubes')
    expect(result).toBe('cubes')
  })
})

describe('saveSetting', () => {
  it('saves to chrome storage API', () => {
    const mockStorage = {
      set: vi.fn()
    }
    saveSetting(mockStorage, 'toggleSetting', 'squares')
    expect(mockStorage.set).toHaveBeenCalledWith({ toggleSetting: 'squares' })
  })

  it('saves to localStorage-like API', () => {
    const mockStorage = {}
    saveSetting(mockStorage, 'toggleSetting', 'squares')
    expect(mockStorage.toggleSetting).toBe('squares')
  })

  it('handles null storage gracefully', () => {
    expect(() => saveSetting(null, 'toggleSetting', 'squares')).not.toThrow()
  })
})

// =============================================================================
// 3. Markup generation (generateContributionsMarkup, generateStreaksMarkup)
// =============================================================================

describe('generateContributionsMarkup', () => {
  const baseStats = {
    countTotal: '1,234',
    datesTotal: 'Jan 1 → Dec 31',
    weekCountTotal: '42',
    weekDatesTotal: 'Dec 25 → Dec 31',
    maxCount: 15,
    dateBest: 'Mar 15',
    averageCount: 3.38
  }

  it('includes total contributions', () => {
    const markup = generateContributionsMarkup(baseStats)
    expect(markup).toContain('1,234')
    expect(markup).toContain('Total')
    expect(markup).toContain('Jan 1 → Dec 31')
  })

  it('includes best day stats', () => {
    const markup = generateContributionsMarkup(baseStats)
    expect(markup).toContain('15')
    expect(markup).toContain('Best day')
    expect(markup).toContain('Mar 15')
  })

  it('includes average count', () => {
    const markup = generateContributionsMarkup(baseStats)
    expect(markup).toContain('3.38')
    expect(markup).toContain('Average')
  })

  it('includes week stats when showWeek is true', () => {
    const markup = generateContributionsMarkup(baseStats, { showWeek: true })
    expect(markup).toContain('42')
    expect(markup).toContain('This week')
    expect(markup).toContain('Dec 25 → Dec 31')
  })

  it('excludes week stats when showWeek is false', () => {
    const markup = generateContributionsMarkup(baseStats, { showWeek: false })
    expect(markup).not.toContain('This week')
  })

  it('defaults to showing week stats', () => {
    const markup = generateContributionsMarkup(baseStats)
    expect(markup).toContain('This week')
  })
})

describe('generateStreaksMarkup', () => {
  const baseStats = {
    streakLongest: 30,
    datesLongest: 'Feb 1 → Mar 2',
    streakCurrent: 5,
    datesCurrent: 'Dec 27 → Dec 31'
  }

  it('includes longest streak stats', () => {
    const markup = generateStreaksMarkup(baseStats)
    expect(markup).toContain('30')
    expect(markup).toContain('Longest')
    expect(markup).toContain('Feb 1 → Mar 2')
  })

  it('includes current streak when showCurrent is true', () => {
    const markup = generateStreaksMarkup(baseStats, { showCurrent: true })
    expect(markup).toContain('5')
    expect(markup).toContain('Current')
    expect(markup).toContain('Dec 27 → Dec 31')
  })

  it('excludes current streak when showCurrent is false', () => {
    const markup = generateStreaksMarkup(baseStats, { showCurrent: false })
    expect(markup).not.toContain('Current')
  })

  it('defaults to showing current streak', () => {
    const markup = generateStreaksMarkup(baseStats)
    expect(markup).toContain('Current')
  })

  it('includes days unit label', () => {
    const markup = generateStreaksMarkup(baseStats)
    expect(markup).toContain('days')
  })
})

// =============================================================================
// 4. getElementColor - computed style extraction
// =============================================================================

describe('getElementColor', () => {
  it('extracts fill color and converts to hex', () => {
    const element = document.createElement('div')
    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => 'rgb(57, 211, 83)')
    }))

    const result = getElementColor(element, mockGetComputedStyle)
    expect(result).toBe('39d353')
    expect(mockGetComputedStyle).toHaveBeenCalledWith(element)
  })

  it('handles different RGB formats', () => {
    const element = document.createElement('div')
    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => 'rgb(0 0 0)')
    }))

    const result = getElementColor(element, mockGetComputedStyle)
    expect(result).toBe('000000')
  })

  it('pads small values correctly', () => {
    const element = document.createElement('div')
    const mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => 'rgb(1, 2, 3)')
    }))

    const result = getElementColor(element, mockGetComputedStyle)
    expect(result).toBe('010203')
  })
})

// =============================================================================
// 5. parseCalendarGraph - DOM scraping
// =============================================================================

describe('parseCalendarGraph', () => {
  const createDayElement = (date, week, tid) => {
    const element = document.createElement('td')
    element.dataset.date = date
    element.dataset.ix = week
    element.setAttribute('aria-labelledby', tid)
    return element
  }

  const createTooltipElement = (id, text) => {
    const element = document.createElement('tool-tip')
    element.id = id
    element.textContent = text
    return element
  }

  it('parses day elements and tooltips into structured data', () => {
    const dayElements = [createDayElement('2024-01-01', '0', 'tip-1'), createDayElement('2024-01-02', '0', 'tip-2')]
    const tooltipElements = [
      createTooltipElement('tip-1', '5 contributions on January 1st.'),
      createTooltipElement('tip-2', 'No contributions on January 2nd')
    ]
    const getColorFn = vi.fn(() => 'ffffff')

    const result = parseCalendarGraph(dayElements, tooltipElements, getColorFn)

    expect(result).toHaveLength(2)
    expect(result[0].date.toISOString()).toContain('2024-01-01')
    expect(result[0].week).toBe('0')
    expect(result[0].color).toBe('ffffff')
    expect(result[0].count).toBe(5)
    expect(result[1].count).toBe(0)
  })

  it('sorts results by date ascending', () => {
    const dayElements = [
      createDayElement('2024-01-03', '0', 'tip-3'),
      createDayElement('2024-01-01', '0', 'tip-1'),
      createDayElement('2024-01-02', '0', 'tip-2')
    ]
    const tooltipElements = [
      createTooltipElement('tip-1', '1 contribution on January 1st.'),
      createTooltipElement('tip-2', '2 contributions on January 2nd.'),
      createTooltipElement('tip-3', '3 contributions on January 3rd.')
    ]
    const getColorFn = vi.fn(() => 'ffffff')

    const result = parseCalendarGraph(dayElements, tooltipElements, getColorFn)

    expect(result[0].count).toBe(1)
    expect(result[1].count).toBe(2)
    expect(result[2].count).toBe(3)
  })

  it('calls getColorFn for each day element', () => {
    const dayElements = [createDayElement('2024-01-01', '0', 'tip-1'), createDayElement('2024-01-02', '0', 'tip-2')]
    const tooltipElements = [
      createTooltipElement('tip-1', '1 contribution on January 1st.'),
      createTooltipElement('tip-2', '2 contributions on January 2nd.')
    ]
    const getColorFn = vi.fn(() => 'aabbcc')

    parseCalendarGraph(dayElements, tooltipElements, getColorFn)

    expect(getColorFn).toHaveBeenCalledTimes(2)
    expect(getColorFn).toHaveBeenCalledWith(dayElements[0])
    expect(getColorFn).toHaveBeenCalledWith(dayElements[1])
  })

  it('handles empty arrays', () => {
    const result = parseCalendarGraph([], [], vi.fn())
    expect(result).toEqual([])
  })

  it('handles missing tooltip for a day', () => {
    const dayElements = [createDayElement('2024-01-01', '0', 'tip-missing')]
    const tooltipElements = []
    const getColorFn = vi.fn(() => 'ffffff')

    const result = parseCalendarGraph(dayElements, tooltipElements, getColorFn)

    expect(result).toHaveLength(1)
    expect(result[0].count).toBeUndefined()
  })
})
