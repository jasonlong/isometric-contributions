// =============================================================================
// Pure utility functions
// =============================================================================

/**
 * Round a number to a specified precision.
 * @param {number} number - The number to round
 * @param {number} precision - Number of decimal places
 * @returns {number} Rounded number
 */
export const precisionRound = (number, precision) => {
  const factor = 10 ** precision
  return Math.round(number * factor) / factor
}

/**
 * Convert an RGB string to hex format.
 * @param {string} rgb - RGB string like "rgb(255, 128, 0)" or "rgb(255 128 0)"
 * @returns {string} Hex string without # prefix, e.g., "ff8000"
 */
export const rgbToHex = (rgb) => {
  const separator = rgb.includes(',') ? ',' : ' '
  return rgb
    .slice(4, -1)
    .split(separator)
    .map((n) => Number(n).toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Calculate the difference in days between two dates.
 * @param {Date|null} date1 - First date
 * @param {Date|null} date2 - Second date
 * @returns {number|null} Number of days between the dates, or null if either date is null
 */
export const datesDayDifference = (date1, date2) => {
  let diffDays = null

  if (date1 && date2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime())
    diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  return diffDays
}

/**
 * Check if two dates represent the same calendar day.
 * @param {Date} d1 - First date
 * @param {Date} d2 - Second date
 * @returns {boolean} True if both dates are the same day
 */
export const sameDay = (d1, d2) => d1.toDateString() === d2.toDateString()

/**
 * Parse contribution count from GitHub tooltip text.
 * Handles formats like:
 * - "No contributions on January 9th"
 * - "1 contribution on January 10th."
 * - "2 contributions on August 31st."
 * @param {string} text - The tooltip text content
 * @returns {number} The contribution count (0 if no match or "No contributions")
 */
export const getContributionCount = (text) => {
  const contributionMatches = text.match(/(\d+|No) contributions? on/)
  if (!contributionMatches) {
    return 0
  }

  return contributionMatches[1] === 'No'
    ? 0
    : Number.parseInt(contributionMatches[1], 10)
}

/**
 * Calculate streak statistics from an array of daily contribution data.
 * @param {Array<{date: Date, count: number}>} days - Array of day objects sorted by date ascending
 * @returns {{
 *   yearTotal: number,
 *   maxCount: number,
 *   bestDay: Date|null,
 *   streakLongest: number,
 *   longestStreakStart: Date|null,
 *   longestStreakEnd: Date|null,
 *   streakCurrent: number,
 *   currentStreakStart: Date|null,
 *   currentStreakEnd: Date|null
 * }}
 */
export const calculateStreaks = (days) => {
  let yearTotal = 0
  let maxCount = 0
  let bestDay = null
  let streakLongest = 0
  let longestStreakStart = null
  let longestStreakEnd = null
  let temporaryStreak = 0
  let temporaryStreakStart = null

  for (const d of days) {
    const currentDayCount = d.count
    yearTotal += currentDayCount

    // Check for best day
    if (currentDayCount > maxCount) {
      bestDay = d.date
      maxCount = currentDayCount
    }

    // Check for longest streak
    if (currentDayCount > 0) {
      if (temporaryStreak === 0) {
        temporaryStreakStart = d.date
      }

      temporaryStreak++

      if (temporaryStreak >= streakLongest) {
        longestStreakStart = temporaryStreakStart
        longestStreakEnd = d.date
        streakLongest = temporaryStreak
      }
    } else {
      temporaryStreak = 0
      temporaryStreakStart = null
    }
  }

  // Calculate current streak (from most recent day backwards)
  let streakCurrent = 0
  let currentStreakStart = null
  let currentStreakEnd = null
  const reversedDays = [...days].reverse()

  if (reversedDays.length > 0) {
    currentStreakEnd = reversedDays[0].date

    for (let i = 0; i < reversedDays.length; i++) {
      const currentDayCount = reversedDays[i].count
      // If there's no activity today, continue on to yesterday
      if (i === 0 && currentDayCount === 0 && reversedDays.length > 1) {
        currentStreakEnd = reversedDays[1].date
        continue
      }

      if (currentDayCount > 0) {
        streakCurrent++
        currentStreakStart = reversedDays[i].date
      } else {
        break
      }
    }
  }

  return {
    yearTotal,
    maxCount,
    bestDay,
    streakLongest,
    longestStreakStart,
    longestStreakEnd,
    streakCurrent,
    currentStreakStart,
    currentStreakEnd
  }
}

// =============================================================================
// DOM-related functions (testable with jsdom)
// =============================================================================

/**
 * Apply view type classes to a container element.
 * @param {Element} element - The container element
 * @param {string} type - View type ('squares', 'cubes', or 'both')
 */
export const applyViewType = (element, type) => {
  element.classList.toggle('ic-squares', type === 'squares')
  element.classList.toggle('ic-cubes', type === 'cubes')
  element.classList.toggle('ic-both', type === 'both')
}

/**
 * Get the fill color of an element as a hex string.
 * @param {Element} element - The DOM element
 * @param {Function} getComputedStyleFn - The getComputedStyle function (for testing)
 * @returns {string} Hex color string without # prefix
 */
export const getElementColor = (
  element,
  getComputedStyleFn = globalThis.getComputedStyle
) => {
  return rgbToHex(getComputedStyleFn(element).getPropertyValue('fill'))
}

/**
 * Parse contribution data from GitHub calendar DOM elements.
 * @param {NodeList|Array} dayElements - The calendar day TD elements
 * @param {NodeList|Array} tooltipElements - The tooltip elements
 * @param {Function} getColorFn - Function to get color from element
 * @returns {Array<{date: Date, week: string, color: string, count: number}>}
 */
export const parseCalendarGraph = (
  dayElements,
  tooltipElements,
  getColorFn
) => {
  const dayNodes = [...dayElements].map((d) => ({
    date: new Date(d.dataset.date),
    week: d.dataset.ix,
    color: getColorFn(d),
    tid: d.getAttribute('aria-labelledby')
  }))

  const tooltipNodes = [...tooltipElements].map((t) => ({
    tid: t.id,
    count: getContributionCount(t.textContent)
  }))

  const data = dayNodes.map((d) => ({
    ...d,
    ...tooltipNodes.find((t) => t.tid === d.tid)
  }))

  return data.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// =============================================================================
// Settings functions
// =============================================================================

/**
 * Load a setting from storage.
 * @param {Object} storage - Storage object with get method (chrome.storage.local or localStorage-like)
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if not found
 * @returns {Promise<*>} The setting value
 */
export const loadSetting = (storage, key, defaultValue) => {
  return new Promise((resolve) => {
    if (storage && typeof storage.get === 'function') {
      // Chrome storage API
      storage.get([key], (result) => {
        resolve(result[key] ?? defaultValue)
      })
    } else if (storage) {
      // LocalStorage-like API
      resolve(storage[key] ?? defaultValue)
    } else {
      resolve(defaultValue)
    }
  })
}

/**
 * Save a setting to storage.
 * @param {Object} storage - Storage object (chrome.storage.local or localStorage-like)
 * @param {string} key - Setting key
 * @param {*} value - Value to save
 */
export const saveSetting = (storage, key, value) => {
  if (storage && typeof storage.set === 'function') {
    // Chrome storage API
    storage.set({ [key]: value })
  } else if (storage) {
    // LocalStorage-like API
    storage[key] = value
  }
}

// =============================================================================
// Markup generation functions
// =============================================================================

/**
 * Generate the contributions stats markup.
 * @param {Object} stats - Stats object
 * @param {string} stats.countTotal - Formatted total count
 * @param {string} stats.datesTotal - Date range string
 * @param {string} stats.weekCountTotal - Formatted week count
 * @param {string} stats.weekDatesTotal - Week date range string
 * @param {number} stats.maxCount - Best day count
 * @param {string} stats.dateBest - Best day date string
 * @param {number} stats.averageCount - Average per day
 * @param {Object} options - Options
 * @param {boolean} options.showWeek - Whether to show week stats
 * @returns {string} HTML markup
 */
export const generateContributionsMarkup = (stats, options = {}) => {
  const {
    countTotal,
    datesTotal,
    weekCountTotal,
    weekDatesTotal,
    maxCount,
    dateBest,
    averageCount
  } = stats
  const { showWeek = true } = options

  let markup = `
    <div class="position-absolute top-0 right-0 mt-3 mr-5">
      <h5 class="mb-1">Contributions</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold color-fg-success lh-condensed">${countTotal}</span>
          <span class="d-block text-small text-bold">Total</span>
          <span class="d-none d-sm-block text-small color-fg-muted">${datesTotal}</span>
        </div>
    `

  if (showWeek) {
    markup += `
      <div class="p-2 d-none d-xl-block">
        <span class="d-block f2 text-bold color-fg-success lh-condensed">${weekCountTotal}</span>
        <span class="d-block text-small text-bold">This week</span>
        <span class="d-none d-sm-block text-small color-fg-muted">${weekDatesTotal}</span>
      </div>
    `
  }

  markup += `
      <div class="p-2">
        <span class="d-block f2 text-bold color-fg-success lh-condensed">${maxCount}</span>
        <span class="d-block text-small text-bold">Best day</span>
        <span class="d-none d-sm-block text-small color-fg-muted">${dateBest}</span>
      </div>
    </div>
    <p class="mt-1 text-right text-small">
      Average: <span class="text-bold color-fg-success">${averageCount}</span> <span class="color-fg-muted">/ day</span>
      </p>
    </div>
  `

  return markup
}

/**
 * Generate the streaks stats markup.
 * @param {Object} stats - Stats object
 * @param {number} stats.streakLongest - Longest streak days
 * @param {string} stats.datesLongest - Longest streak date range
 * @param {number} stats.streakCurrent - Current streak days
 * @param {string} stats.datesCurrent - Current streak date range
 * @param {Object} options - Options
 * @param {boolean} options.showCurrent - Whether to show current streak
 * @returns {string} HTML markup
 */
export const generateStreaksMarkup = (stats, options = {}) => {
  const { streakLongest, datesLongest, streakCurrent, datesCurrent } = stats
  const { showCurrent = true } = options

  let markup = `
    <div class="position-absolute bottom-0 left-0 ml-5 mb-6">
      <h5 class="mb-1">Streaks</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold color-fg-success lh-condensed">${streakLongest} <span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Longest</span>
          <span class="d-none d-sm-block text-small color-fg-muted">${datesLongest}</span>
        </div>
    `

  if (showCurrent) {
    markup += `
          <div class="p-2">
            <span class="d-block f2 text-bold color-fg-success lh-condensed">${streakCurrent} <span class="f4">days</span></span>
            <span class="d-block text-small text-bold">Current</span>
            <span class="d-none d-sm-block text-small color-fg-muted">${datesCurrent}</span>
          </div>
        </div>
      </div>
    `
  }

  return markup
}
