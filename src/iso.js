const COLORS = [
  new obelisk.CubeColor().getByHorizontalColor(0xEBEDF0),
  new obelisk.CubeColor().getByHorizontalColor(0x9BE9A8),
  new obelisk.CubeColor().getByHorizontalColor(0x40C463),
  new obelisk.CubeColor().getByHorizontalColor(0x30A14E),
  new obelisk.CubeColor().getByHorizontalColor(0x216E39)
]

const dateOptions = {month: 'short', day: 'numeric'}

let calendarGraph
let contributionsBox

let yearTotal = 0
let averageCount = 0
let maxCount = 0
let countTotal = 0
let streakLongest = 0
let streakCurrent = 0
let bestDay = null
let firstDay = null
let lastDay = null
let datesTotal = null
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
  bestDay = null
  firstDay = null
  lastDay = null
  datesLongest = null
  datesCurrent = null
}

const getSettings = () => {
  return new Promise(resolve => {
    // Check for user preference, if chrome.storage is available.
    // The storage API is not supported in content scripts.
    // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if (chrome && chrome.storage) {
      chrome.storage.local.get(['toggleSetting'], settings => {
        toggleSetting = settings.toggleSetting ? settings.toggleSetting : 'cubes'
        resolve('Settings loaded')
      })
    } else {
      toggleSetting = localStorage.toggleSetting ? localStorage.toggleSetting : 'cubes'
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
  const insertLocation = contributionsBox.querySelector('h2').parentElement

  const btnGroup = document.createElement('div')
  btnGroup.className = 'BtnGroup mt-1 ml-3 position-relative top-0 float-right'

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

  insertLocation.prepend(btnGroup)
  btnGroup.append(squaresButton)
  btnGroup.append(cubesButton)

  setContainerViewType(toggleSetting)
}

const handleViewToggle = event => {
  setContainerViewType(event.target.dataset.icOption)

  document.querySelectorAll('.ic-toggle-option').forEach(toggle => {
    toggle.classList.remove('selected')
  })
  event.target.classList.add('selected')

  persistSetting('toggleSetting', event.target.dataset.icOption)
  toggleSetting = event.target.dataset.icOption

  // Apply user preference
  document.querySelector(`.ic-toggle-option.${toggleSetting}`).classList.add('selected')
  contributionsBox.classList.add(`ic-${toggleSetting}`)
}

const setContainerViewType = type => {
  if (type === 'squares') {
    contributionsBox.classList.remove('ic-cubes')
    contributionsBox.classList.add('ic-squares')
  } else {
    contributionsBox.classList.remove('ic-squares')
    contributionsBox.classList.add('ic-cubes')
  }
}

const loadStats = () => {
  let temporaryStreak = 0
  let temporaryStreakStart = null
  let longestStreakStart = null
  let longestStreakEnd = null
  let currentStreakStart = null
  let currentStreakEnd = null

  const days = document.querySelectorAll('.js-calendar-graph rect.day')
  days.forEach(d => {
    const currentDayCount = Number.parseInt(d.dataset.count, 10)
    yearTotal += Number.parseInt(currentDayCount, 10)

    if (days[0] === d) {
      firstDay = d.dataset.date
    }

    if (days[days.length - 1] === d) {
      lastDay = d.dataset.date
    }

    // Check for best day
    if (currentDayCount > maxCount) {
      bestDay = d.dataset.date
      maxCount = currentDayCount
    }

    // Check for longest streak
    if (currentDayCount > 0) {
      if (temporaryStreak === 0) {
        temporaryStreakStart = d.dataset.date
      }

      temporaryStreak++

      if (temporaryStreak >= streakLongest) {
        longestStreakStart = temporaryStreakStart
        longestStreakEnd = d.dataset.date
        streakLongest = temporaryStreak
      }
    } else {
      temporaryStreak = 0
      temporaryStreakStart = null
    }
  })

  // Check for current streak
  // Convert days NodeList to Array so we can reverse it
  const daysArray = Array.prototype.slice.call(days)
  daysArray.reverse()

  currentStreakEnd = daysArray[0].dataset.date

  for (let i = 0; i < daysArray.length; i++) {
    const currentDayCount = Number.parseInt(daysArray[i].dataset.count, 10)
    // If there's no activity today, continue on to yesterday
    if (i === 0 && currentDayCount === 0) {
      currentStreakEnd = daysArray[1].dataset.date
      continue
    }

    if (currentDayCount > 0) {
      streakCurrent++
      currentStreakStart = daysArray[i].dataset.date
    } else {
      break
    }
  }

  if (streakCurrent > 0) {
    currentStreakStart = formatDateString(currentStreakStart, dateOptions)
    currentStreakEnd = formatDateString(currentStreakEnd, dateOptions)
    datesCurrent = `${currentStreakStart} → ${currentStreakEnd}`
  } else {
    datesCurrent = 'No current streak'
  }

  // Year total
  countTotal = yearTotal.toLocaleString()
  const dateFirst = formatDateString(firstDay, dateOptions)
  const dateLast = formatDateString(lastDay, dateOptions)
  datesTotal = `${dateFirst} → ${dateLast}`

  // Average contributions per day
  const dayDifference = datesDayDifference(firstDay, lastDay)
  averageCount = precisionRound((yearTotal / dayDifference), 2)

  // Best day
  dateBest = formatDateString(bestDay, dateOptions)
  if (!dateBest) {
    dateBest = 'No activity found'
  }

  // Longest streak
  if (streakLongest > 0) {
    longestStreakStart = formatDateString(longestStreakStart, dateOptions)
    longestStreakEnd = formatDateString(longestStreakEnd, dateOptions)
    datesLongest = `${longestStreakStart} → ${longestStreakEnd}`
  } else {
    datesLongest = 'No longest streak'
  }
}

const getSquareColor = fill => {
  switch (fill.toLowerCase()) {
    case '#ebedf0':
      return COLORS[0]
    case '#c6e48b':
      return COLORS[1]
    case '#7bc96f':
      return COLORS[2]
    case '#239a3b':
      return COLORS[3]
    case '#196127':
      return COLORS[4]
    default:
      if (fill.includes('#')) {
        return new obelisk.CubeColor().getByHorizontalColor(Number.parseInt('0x' + fill.replace('#', ''), 16))
      }
  }
}

const renderIsometricChart = () => {
  const SIZE = 16
  const MAX_HEIGHT = 100
  const firstRect = document.querySelectorAll('.js-calendar-graph-svg g > g')[1]
  const canvas = document.querySelector('#isometric-contributions')
  const GH_OFFSET = Number.parseInt(firstRect.getAttribute('transform').match(/(\d+)/)[0], 10) - 1
  const point = new obelisk.Point(130, 90)
  const pixelView = new obelisk.PixelView(canvas, point)
  const weeks = document.querySelectorAll('.js-calendar-graph-svg g > g')

  weeks.forEach(w => {
    const x = Number.parseInt(((w.getAttribute('transform')).match(/(\d+)/))[0], 10) / (GH_OFFSET + 1)
    w.querySelectorAll('rect').forEach(r => {
      const y = Number.parseInt(r.getAttribute('y'), 10) / GH_OFFSET
      const fill = r.getAttribute('fill')
      const contribCount = Number.parseInt(r.dataset.count, 10)
      let cubeHeight = 3

      if (maxCount > 0) {
        cubeHeight += Number.parseInt(MAX_HEIGHT / maxCount * contribCount, 10)
      }

      const dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
      const color = getSquareColor(fill)
      const cube = new obelisk.Cube(dimension, color, false)
      const p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
      pixelView.renderObject(cube, p3d)
    })
  })
}

const renderStats = () => {
  const topMarkup = `
    <div class="position-absolute top-0 right-0 mt-3 mr-5">
      <h5 class="mb-1">Contributions</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${countTotal}</span>
          <span class="d-block text-small text-bold">Total</span>
          <span class="d-none d-sm-block text-small text-gray-light">${datesTotal}</span>
        </div>
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${maxCount}</span>
          <span class="d-block text-small text-bold">Best day</span>
          <span class="d-none d-sm-block text-small text-gray-light">${dateBest}</span>
        </div>
      </div>
      <p class="mt-1 text-right text-small">
        Average: <span class="text-bold text-green">${averageCount}</span> <span class="text-gray-light">/ day</span>
        </p>
    </div>
  `

  const bottomMarkup = `
    <div class="position-absolute bottom-0 left-0 ml-5 mb-6">
      <h5 class="mb-1">Streaks</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2">
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${streakLongest}<span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Longest</span>
          <span class="d-none d-sm-block text-small text-gray-light">${datesLongest}</span>
        </div>
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${streakCurrent}<span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Current</span>
          <span class="d-none d-sm-block text-small text-gray-light">${datesCurrent}</span>
        </div>
      </div>
    </div>
  `
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

const datesDayDifference = (dateString1, dateString2) => {
  let diffDays = null
  let date1 = null
  let date2 = null

  if (dateString1) {
    const dateParts = dateString1.split('-')
    date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
  }

  if (dateString2) {
    const dateParts = dateString2.split('-')
    date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
  }

  if (dateString1 && dateString2) {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime())
    diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  return diffDays
}

const formatDateString = (dateString, options) => {
  let date = null

  if (dateString) {
    const dateParts = dateString.split('-')
    date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0).toLocaleDateString('en-US', options)
  }

  return date
}

if (document.querySelector('.js-calendar-graph')) {
  const settingsPromise = getSettings()
  settingsPromise.then(generateIsometricChart)

  const config = {attributes: false, childList: true, subtree: true}
  const callback = mutationsList => {
    mutationsList.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('js-yearly-contributions')) {
            generateIsometricChart()
          }
        })
      }
    })
  }

  const observedContainer = document.querySelector('#js-pjax-container')
  const observer = new MutationObserver(callback)
  observer.observe(observedContainer, config)
}
