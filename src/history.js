import { parseContributionsHtml } from './utils.js'

const dateKey = (date) => date.toISOString().slice(0, 10)
const DAY_MS = 24 * 60 * 60 * 1000

/** Extend the streak at the calendar's start, requesting one year at a time. */
export const fetchExtendedStreakData = async (
  username,
  currentDays,
  maxYearsBack = 10
) => {
  if (!username || !currentDays.length) return currentDays

  let combined = currentDays
  const earliestYear = currentDays[0].date.getUTCFullYear()

  for (let offset = 0; offset < maxYearsBack; offset++) {
    const year = earliestYear - offset
    // A calendar starting on January 1 already contains this whole year.
    if (combined[0].date.getTime() === Date.UTC(year, 0, 1)) continue

    const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${year}-01-01&to=${year}-12-31`
    let historicalDays
    try {
      const response = await fetch(url)
      if (!response.ok) break
      historicalDays = parseContributionsHtml(await response.text())
    } catch {
      break
    }

    const boundary = combined[0].date.getTime()
    const dates = new Map(historicalDays.map((day) => [dateKey(day.date), day]))
    const earlierDays = []
    // Require every preceding day: missing data must never bridge a gap.
    for (let time = Date.UTC(year, 0, 1); time < boundary; time += DAY_MS) {
      const day = dates.get(dateKey(new Date(time)))
      if (!day) return combined
      earlierDays.push(day)
    }

    combined = [...earlierDays, ...combined]
    // Once a zero breaks the boundary streak, older years cannot extend it.
    if (earlierDays.some((day) => day.count === 0)) break
  }

  return combined
}
