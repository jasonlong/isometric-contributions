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

  return contributionMatches[1] === 'No' ? 0 : Number.parseInt(contributionMatches[1], 10)
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
