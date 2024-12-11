import { toArray, groupBy, last } from 'lodash-es'

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const sameDay = (d1, d2) => d1.toDateString() === d2.toDateString()

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

const getSettings = () => {
  return new Promise((resolve) => {
    // Check for user preference, if chrome.storage is available.
    // The storage API is not supported in content scripts.
    // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['toggleSetting'], (settings) => {
        toggleSetting = settings.toggleSetting ?? 'cubes'
        resolve('Settings loaded')
      })
    } else {
      toggleSetting = localStorage.toggleSetting ?? 'cubes'
      resolve('Settings loaded')
    }
  })
}

const persistSetting = (key, value) => {
  if (chrome && chrome.storage) {
    const object = {}
    object[key] = value
    chrome.storage.local.set(object)
  } else {
    localStorage[key] = value
  }
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
  let insertLocation = contributionsBox.querySelector('h2')
  if (insertLocation.previousElementSibling && insertLocation.previousElementSibling.nodeName === 'DETAILS') {
    insertLocation = insertLocation.previousElementSibling
  }

  const buttonGroup = document.createElement('div')
  buttonGroup.className = 'BtnGroup mt-1 ml-3 position-relative top-0 float-right'

  const squaresButton = document.createElement('button')
  squaresButton.innerHTML = '2D'
  squaresButton.className = 'ic-toggle-option squares btn BtnGroup-item btn-sm py-0 px-1'
  squaresButton.dataset.icOption = 'squares'
  squaresButton.addEventListener('click', handleViewToggle)
  if (toggleSetting === 'squares') {
    squaresButton.classList.add('selected')
  }

  const cubesButton = document.createElement('button')
  cubesButton.innerHTML = '3D'
  cubesButton.className = 'ic-toggle-option cubes btn BtnGroup-item btn-sm py-0 px-1'
  cubesButton.dataset.icOption = 'cubes'
  cubesButton.addEventListener('click', handleViewToggle)
  if (toggleSetting === 'cubes') {
    cubesButton.classList.add('selected')
  }

  buttonGroup.append(squaresButton)
  buttonGroup.append(cubesButton)
  insertLocation.before(buttonGroup)

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

  // Apply user preference
  document.querySelector(`.ic-toggle-option.${toggleSetting}`).classList.add('selected')
  contributionsBox.classList.add(`ic-${toggleSetting}`)
}

const setContainerViewType = (type) => {
  if (type === 'squares') {
    contributionsBox.classList.remove('ic-cubes')
    contributionsBox.classList.add('ic-squares')
  } else {
    contributionsBox.classList.remove('ic-squares')
    contributionsBox.classList.add('ic-cubes')
  }
}

const getCountFromNode = (node) => {
  // Contribution label formats:
  // No contributions on January 9th
  // 1 contribution on January 10th.
  // 2 contributions on August 31st.
  const contributionMatches = node.innerHTML.match(/(\d*|No) contributions? on (.*)./)

  if (!contributionMatches) {
    return 0
  }

  const dataCount = contributionMatches[1]
  return dataCount === 'No' ? 0 : Number.parseInt(dataCount, 10)
}

const getSquareColor = (rect) => {
  return rgbToHex(getComputedStyle(rect).getPropertyValue('fill'))
}

const loadStats = () => {
  let temporaryStreak = 0
  let temporaryStreakStart = null
  let longestStreakStart = null
  let longestStreakEnd = null
  let currentStreakStart = null
  let currentStreakEnd = null

  const dayNodes = [...document.querySelectorAll('.js-calendar-graph-table tbody td.ContributionCalendar-day')].map(
    (d) => {
      return {
        date: new Date(d.dataset.date),
        week: d.dataset.ix,
        color: getSquareColor(d),
        tid: d.getAttribute('aria-labelledby')
      }
    }
  )

  const tooltipNodes = [...document.querySelectorAll('.js-calendar-graph tool-tip')].map((t) => {
    return {
      tid: t.id,
      count: getCountFromNode(t)
    }
  })

  const data = dayNodes.map((d) => {
    return {
      ...d,
      ...tooltipNodes.find((t) => t.tid === d.tid)
    }
  })

  days = data.sort((a, b) => a.date.getTime() - b.date.getTime())
  weeks = toArray(groupBy(days, 'week'))
  const currentWeekDays = last(weeks)

  for (const d of days) {
    const currentDayCount = d.count
    yearTotal += currentDayCount

    if (days[0] === d) {
      firstDay = d.date
    }

    if (sameDay(d.date, new Date())) {
      lastDay = d.date
    } else if (!lastDay && days.at(-1) === d) {
      lastDay = d.date
    }

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

  for (const d of currentWeekDays) {
    const currentDayCount = d.count
    weekTotal += currentDayCount

    if (currentWeekDays[0] === d) {
      weekStartDay = d.date
    }
  }

  // Check for current streak
  const reversedDays = days
  reversedDays.reverse()
  currentStreakEnd = reversedDays[0].date

  for (let i = 0; i < reversedDays.length; i++) {
    const currentDayCount = reversedDays[i].count
    // If there's no activity today, continue on to yesterday
    if (i === 0 && currentDayCount === 0) {
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

  if (streakCurrent > 0) {
    currentStreakStart = dateFormat.format(currentStreakStart)
    currentStreakEnd = dateFormat.format(currentStreakEnd)
    datesCurrent = `${currentStreakStart} → ${currentStreakEnd}`
  } else {
    datesCurrent = 'No current streak'
  }

  // Year total
  countTotal = yearTotal.toLocaleString()
  const dateFirst = dateFormat.format(firstDay)
  const dateLast = dateFormat.format(lastDay)
  datesTotal = `${dateFirst} → ${dateLast}`

  // Average contributions per day
  const dayDifference = datesDayDifference(firstDay, lastDay)
  averageCount = precisionRound(yearTotal / dayDifference, 2)

  // Best day
  dateBest = dateFormat.format(bestDay)
  dateBest ||= 'No activity found'

  // Longest streak
  if (streakLongest > 0) {
    longestStreakStart = dateFormat.format(longestStreakStart)
    longestStreakEnd = dateFormat.format(longestStreakEnd)
    datesLongest = `${longestStreakStart} → ${longestStreakEnd}`
  } else {
    datesLongest = 'No longest streak'
  }

  // Week total
  weekCountTotal = weekTotal.toLocaleString()
  const weekDateFirst = dateFormat.format(weekStartDay)
  weekDatesTotal = `${weekDateFirst} → ${dateLast}`
}

const rgbToHex = (rgb) => {
  const separator = rgb.includes(',') ? ',' : ' '
  rgb = rgb.slice(4).split(')')[0].split(separator)

  let r = Number(rgb[0]).toString(16)
  let g = Number(rgb[1]).toString(16)
  let b = Number(rgb[2]).toString(16)

  if (r.length === 1) {
    r = '0' + r
  }

  if (g.length === 1) {
    g = '0' + g
  }

  if (b.length === 1) {
    b = '0' + b
  }

  return r + g + b
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
        cubeHeight += Number.parseInt((MAX_HEIGHT / maxCount) * currentDayCount, 10)
      }

      const dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
      const color = new obelisk.CubeColor().getByHorizontalColor(Number.parseInt(d.color, 16))
      const cube = new obelisk.Cube(dimension, color, false)
      const p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
      pixelView.renderObject(cube, p3d)
    }
  }
}

const renderStats = () => {
  const graphHeaderText =
    document.querySelector('.ic-contributions-wrapper').parentNode.previousElementSibling.textContent
  const viewingYear = graphHeaderText.match(/in \d{4}/g) !== null

  let topMarkup = `
    <div class="position-absolute top-0 right-0 mt-3 mr-5">
      <h5 class="mb-1">Contributions</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold color-fg-success lh-condensed">${countTotal}</span>
          <span class="d-block text-small text-bold">Total</span>
          <span class="d-none d-sm-block text-small color-fg-muted">${datesTotal}</span>
        </div>
    `
  if (!viewingYear) {
    topMarkup += `
      <div class="p-2 d-none d-xl-block">
        <span class="d-block f2 text-bold color-fg-success lh-condensed">${weekCountTotal}</span>
        <span class="d-block text-small text-bold">This week</span>
        <span class="d-none d-sm-block text-small color-fg-muted">${weekDatesTotal}</span>
      </div>
    `
  }

  topMarkup += `
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

  let bottomMarkup = `
    <div class="position-absolute bottom-0 left-0 ml-5 mb-6">
      <h5 class="mb-1">Streaks</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold color-fg-success lh-condensed">${streakLongest} <span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Longest</span>
          <span class="d-none d-sm-block text-small color-fg-muted">${datesLongest}</span>
        </div>
    `
  if (!viewingYear) {
    bottomMarkup += `
          <div class="p-2">
            <span class="d-block f2 text-bold color-fg-success lh-condensed">${streakCurrent} <span class="f4">days</span></span>
            <span class="d-block text-small text-bold">Current</span>
            <span class="d-none d-sm-block text-small color-fg-muted">${datesCurrent}</span>
          </div>
        </div>
      </div>
    `
  }

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
}

const precisionRound = (number, precision) => {
  const factor = 10 ** precision
  return Math.round(number * factor) / factor
}

const datesDayDifference = (date1, date2) => {
  let diffDays = null

  if (date1 && date2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime())
    diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  return diffDays
}

;(async function () {
  // Are we on a profile page?
  if (document.querySelector('.vcard-names-container')) {
    await getSettings()

    const config = { attributes: true, childList: true, subtree: true }
    const callback = (mutationsList) => {
      for (const mutation of mutationsList) {
        if (
          mutation.type === 'childList' &&
          document.querySelector('.js-calendar-graph') &&
          !document.querySelector('.ic-contributions-wrapper')
        ) {
          generateIsometricChart()
        }
      }
    }

    globalThis.matchMedia('(prefers-color-scheme: dark)').addListener(() => {
      renderIsometricChart()
    })

    const observedContainer = document.querySelector('html')
    const observer = new MutationObserver(callback)
    observer.observe(observedContainer, config)
  }
})()
