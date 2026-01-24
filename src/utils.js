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
