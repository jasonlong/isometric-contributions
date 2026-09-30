import {
  applyViewType,
  calculateStreaks,
  datesDayDifference,
  generateContributionsMarkup,
  generateStreaksMarkup,
  getElementColor,
  loadSetting,
  parseCalendarGraph,
  parseContributionsHtml,
  precisionRound,
  sameDay,
  saveSetting
} from './utils.js'

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC'
})
const fullDateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC'
})

let days
let weeks
let calendarGraph
let contributionsBox
let yearTotal = 0
let weekTotal = 0
let averageCount = 0
let maxCount = 0
let countTotal = 0
let weekCountTotal = 0
let streakLongest = 0
let streakCurrent = 0
let bestDay = null
let firstDay = null
let lastDay = null
let datesTotal = null
let weekStartDay = null
let weekDatesTotal = null
let datesLongest = null
let datesCurrent = null
let dateBest = null
let toggleSetting = 'cubes'

const resetValues = () => {
  yearTotal = 0
  averageCount = 0
  maxCount = 0
  streakLongest = 0
  streakCurrent = 0
  weekTotal = 0
  bestDay = null
  firstDay = null
  lastDay = null
  datesLongest = null
  datesCurrent = null
  weekStartDay = null
}

const getStorage = () => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return chrome.storage.local
  }

  return localStorage
}

const getSettings = async () => {
  toggleSetting = await loadSetting(getStorage(), 'toggleSetting', 'cubes')
  return 'Settings loaded'
}

const persistSetting = (key, value) => {
  saveSetting(getStorage(), key, value)
}

// =============================================================================
// Historical contribution fetching (for multi-year streak accuracy)
// =============================================================================

/**
 * Extract the username from the current GitHub profile page URL.
 * @returns {string|null} The username, or null if not on a profile page
 */
const getProfileUsername = () => {
  const pathParts = window.location.pathname.split('/').filter(Boolean)
  // Profile pages have a single path segment (the username).
  // We're already guarded by .vcard-names-container / .js-calendar-graph.
  return pathParts.length >= 1 ? pathParts[0] : null
}

/**
 * Fetch contribution data for a date range from GitHub.
 * @param {string} username - GitHub username
 * @param {string} from - Start date (YYYY-MM-DD)
 * @param {string} to - End date (YYYY-MM-DD)
 * @returns {Promise<Array<{date: Date, count: number}>>}
 */
const fetchContributions = async (username, from, to) => {
  const url = `https://github.com/users/${username}/contributions?from=${from}&to=${to}`
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    const html = await response.text()
    return parseContributionsHtml(html)
  } catch {
    return []
  }
}

/**
 * Fetch extended contribution data in one bounded request.
 * @param {string} username - GitHub username
 * @param {Array<{date: Date, count: number}>} currentDays - DOM-sourced days
 * @param {number} [maxYearsBack=10] - Max years to look back
 * @returns {Promise<Array<{date: Date, count: number}>>} Combined historical + current data
 */
const fetchExtendedStreakData = async (
  username,
  currentDays,
  maxYearsBack = 10
) => {
  if (!username || !currentDays.length) return currentDays

  // Dates already in DOM data (these take priority for accuracy)
  const existingDates = new Set(
    currentDays.map((d) => d.date.toISOString().split('T')[0])
  )

  const earliestYear = currentDays[0].date.getFullYear()
  const firstYear = earliestYear - maxYearsBack + 1
  const historicalDays = await fetchContributions(
    username,
    `${firstYear}-01-01`,
    `${earliestYear}-12-31`
  )

  const allHistoricalDays = historicalDays.filter(
    (d) => !existingDates.has(d.date.toISOString().split('T')[0])
  )

  if (allHistoricalDays.length === 0) return currentDays

  return [...allHistoricalDays, ...currentDays].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}

/**
 * Asynchronously extend streak data with historical contributions
 * and update the streak display in-place.
 */
const extendStreakDataAndUpdate = async () => {
  const username = getProfileUsername()
  let extendedDays = days

  try {
    if (username) {
      extendedDays = await fetchExtendedStreakData(username, days)
    }
  } catch {
    // Fall back to the contribution data already rendered on the page.
  }

  const extendedStats = calculateStreaks(extendedDays)
  streakLongest = extendedStats.streakLongest
  streakCurrent = extendedStats.streakCurrent

  datesLongest =
    streakLongest > 0 && extendedStats.longestStreakStart
      ? `${fullDateFormat.format(extendedStats.longestStreakStart)} → ${fullDateFormat.format(extendedStats.longestStreakEnd)}`
      : 'No longest streak'
  datesCurrent =
    streakCurrent > 0 && extendedStats.currentStreakStart
      ? `${fullDateFormat.format(extendedStats.currentStreakStart)} → ${fullDateFormat.format(extendedStats.currentStreakEnd)}`
      : 'No current streak'

  const longestCountEl = document.getElementById('ic-streak-longest-count')
  const longestDatesEl = document.getElementById('ic-streak-longest-dates')
  const currentCountEl = document.getElementById('ic-streak-current-count')
  const currentDatesEl = document.getElementById('ic-streak-current-dates')

  if (longestCountEl)
    longestCountEl.innerHTML = `${streakLongest} <span class="f4">days</span>`
  if (longestDatesEl) longestDatesEl.textContent = datesLongest
  if (currentCountEl)
    currentCountEl.innerHTML = `${streakCurrent} <span class="f4">days</span>`
  if (currentDatesEl) currentDatesEl.textContent = datesCurrent
}

const initUI = () => {
  const contributionsWrapper = document.createElement('div')
  contributionsWrapper.className = 'ic-contributions-wrapper position-relative'
  calendarGraph.before(contributionsWrapper)

  const canvas = document.createElement('canvas')
  canvas.id = 'isometric-contributions'
  canvas.width = 1000
  canvas.height = 600
  canvas.style.width = '100%'
  contributionsWrapper.append(canvas)

  // Inject toggle
  const heading = contributionsBox.querySelector('h2')

  const settingsMenu = contributionsBox.querySelector(
    'focus-group, details.contrib-settings'
  )

  const wrapper = document.createElement('div')
  wrapper.className = 'd-flex flex-items-center gap-2 float-right'

  const buttonGroup = document.createElement('div')
  buttonGroup.className = 'BtnGroup'

  const squaresButton = document.createElement('button')
  squaresButton.textContent = '2D'
  squaresButton.className =
    'ic-toggle-option squares btn BtnGroup-item btn-sm py-0 px-1'
  squaresButton.dataset.icOption = 'squares'
  squaresButton.addEventListener('click', handleViewToggle)
  if (toggleSetting === 'squares') {
    squaresButton.classList.add('selected')
  }

  const cubesButton = document.createElement('button')
  cubesButton.textContent = '3D'
  cubesButton.className =
    'ic-toggle-option cubes btn BtnGroup-item btn-sm py-0 px-1'
  cubesButton.dataset.icOption = 'cubes'
  cubesButton.addEventListener('click', handleViewToggle)
  if (toggleSetting === 'cubes') {
    cubesButton.classList.add('selected')
  }

  const bothButton = document.createElement('button')
  bothButton.textContent = 'Both'
  bothButton.className =
    'ic-toggle-option both btn BtnGroup-item btn-sm py-0 px-1'
  bothButton.dataset.icOption = 'both'
  bothButton.addEventListener('click', handleViewToggle)
  if (toggleSetting === 'both') {
    bothButton.classList.add('selected')
  }

  buttonGroup.append(squaresButton)
  buttonGroup.append(cubesButton)
  buttonGroup.append(bothButton)

  if (settingsMenu) {
    settingsMenu.before(wrapper)
    wrapper.append(settingsMenu)
    wrapper.append(buttonGroup)
  } else {
    wrapper.append(buttonGroup)
    heading.before(wrapper)
  }

  setContainerViewType(toggleSetting)
}

const handleViewToggle = (event) => {
  setContainerViewType(event.target.dataset.icOption)

  for (const toggle of document.querySelectorAll('.ic-toggle-option')) {
    toggle.classList.remove('selected')
  }

  event.target.classList.add('selected')

  persistSetting('toggleSetting', event.target.dataset.icOption)
  toggleSetting = event.target.dataset.icOption
}

const setContainerViewType = (type) => {
  applyViewType(contributionsBox, type)
}

const getSquareColor = (rect) => getElementColor(rect)

const refreshColors = () => {
  const dayElements = document.querySelectorAll(
    '.js-calendar-graph-table tbody td.ContributionCalendar-day'
  )
  for (const d of days) {
    const element = [...dayElements].find(
      (node) => node.dataset.date === d.date.toISOString().split('T')[0]
    )
    if (element) {
      d.color = getSquareColor(element)
    }
  }
}

const loadStats = () => {
  const dayElements = document.querySelectorAll(
    '.js-calendar-graph-table tbody td.ContributionCalendar-day'
  )
  const tooltipElements = document.querySelectorAll(
    '.js-calendar-graph tool-tip'
  )

  days = parseCalendarGraph(dayElements, tooltipElements, getSquareColor)
  weeks = Object.values(
    days.reduce((acc, day) => {
      const key = day.week
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(day)
      return acc
    }, {})
  )
  const currentWeekDays = weeks.at(-1)

  firstDay = days[0].date
  lastDay =
    days.find((d) => sameDay(d.date, new Date()))?.date ?? days.at(-1).date

  // Calculate streaks using pure function
  const stats = calculateStreaks(days)
  yearTotal = stats.yearTotal
  maxCount = stats.maxCount
  bestDay = stats.bestDay
  streakLongest = stats.streakLongest
  streakCurrent = stats.streakCurrent

  // Week total
  weekStartDay = currentWeekDays[0].date
  for (const d of currentWeekDays) {
    weekTotal += d.count
  }

  // Format current streak dates
  if (streakCurrent > 0) {
    const currentStart = fullDateFormat.format(stats.currentStreakStart)
    const currentEnd = fullDateFormat.format(stats.currentStreakEnd)
    datesCurrent = `${currentStart} → ${currentEnd}`
  } else {
    datesCurrent = 'No current streak'
  }

  // Year total
  countTotal = yearTotal.toLocaleString()
  const dateLast = dateFormat.format(lastDay)
  datesTotal = `${fullDateFormat.format(firstDay)} → ${dateLast}`

  // Average contributions per day
  const dayDifference = datesDayDifference(firstDay, lastDay)
  averageCount = precisionRound(yearTotal / dayDifference, 2)

  // Best day
  dateBest = bestDay ? fullDateFormat.format(bestDay) : 'No activity found'

  // Longest streak
  if (streakLongest > 0) {
    const longestStart = fullDateFormat.format(stats.longestStreakStart)
    const longestEnd = fullDateFormat.format(stats.longestStreakEnd)
    datesLongest = `${longestStart} → ${longestEnd}`
  } else {
    datesLongest = 'No longest streak'
  }

  // Week total
  weekCountTotal = weekTotal.toLocaleString()
  const weekDateFirst = dateFormat.format(weekStartDay)
  weekDatesTotal = `${weekDateFirst} → ${dateLast}`
}

const renderIsometricChart = () => {
  const SIZE = 16
  const MAX_HEIGHT = 100
  const GH_OFFSET = 14
  const canvas = document.querySelector('#isometric-contributions')
  const point = new obelisk.Point(130, 90)
  const pixelView = new obelisk.PixelView(canvas, point)

  let transform = GH_OFFSET

  for (const w of weeks) {
    const x = transform / (GH_OFFSET + 1)
    transform += GH_OFFSET
    let offsetY = 0 // Hardcode the old y of rect value.
    for (const d of w) {
      const y = offsetY / GH_OFFSET
      offsetY += 13
      const currentDayCount = d.count
      let cubeHeight = 3

      if (maxCount > 0) {
        cubeHeight += Number.parseInt(
          (MAX_HEIGHT / maxCount) * currentDayCount,
          10
        )
      }

      const dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
      const color = new obelisk.CubeColor().getByHorizontalColor(
        Number.parseInt(d.color, 16)
      )
      const cube = new obelisk.Cube(dimension, color, false)
      const p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
      pixelView.renderObject(cube, p3d)
    }
  }
}

const renderStats = () => {
  const graphHeaderText = document.querySelector('.ic-contributions-wrapper')
    .parentNode.previousElementSibling.textContent
  const viewingYear = /in \d{4}/.test(graphHeaderText)

  const contributionsStats = {
    countTotal,
    datesTotal,
    weekCountTotal,
    weekDatesTotal,
    maxCount,
    dateBest,
    averageCount
  }

  const streaksStats = {
    streakLongest,
    datesLongest,
    streakCurrent,
    datesCurrent
  }

  const topMarkup = generateContributionsMarkup(contributionsStats, {
    showWeek: !viewingYear
  })
  const bottomMarkup = generateStreaksMarkup(streaksStats, {
    showCurrent: !viewingYear,
    loading: true
  })

  const icStatsBlockTop = document.createElement('div')
  icStatsBlockTop.innerHTML = topMarkup
  document.querySelector('.ic-contributions-wrapper').append(icStatsBlockTop)

  const icStatsBlockBottom = document.createElement('div')
  icStatsBlockBottom.innerHTML = bottomMarkup
  document.querySelector('.ic-contributions-wrapper').append(icStatsBlockBottom)
}

const generateIsometricChart = () => {
  calendarGraph = document.querySelector('.js-calendar-graph')
  contributionsBox = document.querySelector('.js-yearly-contributions')

  resetValues()
  initUI()
  loadStats()
  renderStats()
  renderIsometricChart()

  // Asynchronously extend streak data for multi-year accuracy
  extendStreakDataAndUpdate()
}

;(async () => {
  const initIfReady = () => {
    if (
      document.querySelector('.js-calendar-graph') &&
      !document.querySelector('.ic-contributions-wrapper')
    ) {
      generateIsometricChart()
    }
  }

  let observer = null

  const setupObserver = () => {
    if (!document.querySelector('.vcard-names-container')) {
      return
    }

    document.querySelector('.ic-contributions-wrapper')?.remove()
    document.querySelector('.ic-toggle-option')?.parentElement?.remove()

    initIfReady()

    observer?.disconnect()
    const target = document.querySelector('main') || document.body
    observer = new MutationObserver(() => initIfReady())
    observer.observe(target, { childList: true, subtree: true })
  }

  await getSettings()

  globalThis
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (document.querySelector('.ic-contributions-wrapper')) {
        refreshColors()
        renderIsometricChart()
      }
    })

  setupObserver()
  document.addEventListener('turbo:load', setupObserver)
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      document.querySelector('.ic-contributions-wrapper')
    ) {
      renderIsometricChart()
    }
  })
})()
