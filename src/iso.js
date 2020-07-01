const COLORS = [
  new obelisk.CubeColor().getByHorizontalColor(0xebedf0),
  new obelisk.CubeColor().getByHorizontalColor(0x9be9a8),
  new obelisk.CubeColor().getByHorizontalColor(0x40c463),
  new obelisk.CubeColor().getByHorizontalColor(0x30a14e),
  new obelisk.CubeColor().getByHorizontalColor(0x216e39)
]

const dateOptions         = {month: "short", day: "numeric"}
const dateWithYearOptions = {month: "short", day: "numeric", year: "numeric"}

let calendarGraph
let contributionsBox

let yearTotal           = 0
let averageCount        = 0
let maxCount            = 0
let countTotal          = 0
let streakLongest       = 0
let streakCurrent       = 0
let bestDay             = null
let firstDay            = null
let lastDay             = null
let datesTotal          = null
let datesLongest        = null
let datesCurrent        = null
let dateBest            = null

let toggleSetting = "cubes"

const resetValues = () => {
  yearTotal           = 0
  averageCount        = 0
  maxCount            = 0
  streakLongest       = 0
  streakCurrent       = 0
  bestDay             = null
  firstDay            = null
  lastDay             = null
  datesLongest        = null
  datesCurrent        = null
}

const getSettings = () => {
  return new Promise(function(resolve, reject) {
    // Check for user preference, if chrome.storage is available.
    // The storage API is not supported in content scripts.
    // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if (chrome && chrome.storage) {
      chrome.storage.local.get(["toggleSetting"], (settings) => {
        toggleSetting = settings.toggleSetting ? settings.toggleSetting : "cubes"
        resolve('Settings loaded')
      })
    }
    else {
      toggleSetting = localStorage.toggleSetting ? localStorage.toggleSetting : "cubes"
      resolve('Settings loaded')
    }
  })
}

const persistSetting = (key, value) => {
  if (chrome && chrome.storage) {
    let obj = {}
    obj[key] = value
    chrome.storage.local.set(obj)
  }
  else {
    localStorage[key] = value
  }
}

const initUI = () => {
  const contributionsWrapper = document.createElement("div")
  contributionsWrapper.className = "ic-contributions-wrapper position-relative"
  calendarGraph.before(contributionsWrapper)

  const canvas = document.createElement("canvas")
  canvas.id = "isometric-contributions"
  canvas.width = 1000
  canvas.height = 600
  canvas.style.width = "100%"
  contributionsWrapper.appendChild(canvas)

  // Inject toggle
  const insertLocation = contributionsBox.querySelector("h2").parentElement

  const btnGroup = document.createElement("div")
  btnGroup.className = "BtnGroup mt-1 ml-3 position-relative top-0 float-right"

  const squaresButton = document.createElement("button")
  squaresButton.innerHTML = "2D"
  squaresButton.className = "ic-toggle-option squares btn BtnGroup-item btn-sm py-0 px-1"
  squaresButton.setAttribute("data-ic-option", "squares")
  squaresButton.addEventListener("click", handleViewToggle);
  if (toggleSetting === "squares") {
    squaresButton.classList.add("selected")
  }

  const cubesButton = document.createElement("button")
  cubesButton.innerHTML = "3D"
  cubesButton.className = "ic-toggle-option cubes btn BtnGroup-item btn-sm py-0 px-1"
  cubesButton.setAttribute("data-ic-option", "cubes")
  cubesButton.addEventListener("click", handleViewToggle);
  if (toggleSetting === "cubes") {
    cubesButton.classList.add("selected")
  }

  insertLocation.prepend(btnGroup)
  btnGroup.appendChild(squaresButton)
  btnGroup.appendChild(cubesButton)

  setContainerViewType(toggleSetting)
}

const handleViewToggle = (e) => {
  setContainerViewType(e.target.dataset.icOption)

  document.querySelectorAll(".ic-toggle-option").forEach(toggle => { toggle.classList.remove("selected") })
  e.target.classList.add("selected")

  persistSetting("toggleSetting", e.target.dataset.icOption)
  toggleSetting = e.target.dataset.icOption

  // Apply user preference
  document.querySelector(`.ic-toggle-option.${toggleSetting}`).classList.add("selected")
  contributionsBox.classList.add(`ic-${toggleSetting}`)
}

const setContainerViewType = (type) => {
  if (type === "squares") {
    contributionsBox.classList.remove("ic-cubes")
    contributionsBox.classList.add("ic-squares")
  }
  else {
    contributionsBox.classList.remove("ic-squares")
    contributionsBox.classList.add("ic-cubes")
  }
}

const loadStats = () => {
  let tempStreak         = 0
  let tempStreakStart    = null
  let longestStreakStart = null
  let longestStreakEnd   = null
  let currentStreakStart = null
  let currentStreakEnd   = null

  let days = document.querySelectorAll(".js-calendar-graph rect.day")
  days.forEach(d => {
    currentDayCount = parseInt(d.dataset.count)
    yearTotal += parseInt(currentDayCount)

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
      if (tempStreak == 0) {
        tempStreakStart = d.dataset.date
      }

      tempStreak++

      if (tempStreak >= streakLongest) {
        longestStreakStart = tempStreakStart
        longestStreakEnd   = d.dataset.date
        streakLongest      = tempStreak
      }
    }
    else {
      tempStreak         = 0
      tempStreakStart    = null
      tempStreakEnd      = null
    }
  })

  // Check for current streak
  // Convert days NodeList to Array so we can reverse it
  let daysArray = Array.prototype.slice.call(days);
  daysArray.reverse()

  currentStreakEnd = daysArray[0].dataset.date

  for (let i=0; i < daysArray.length; i++) {

    currentDayCount = parseInt(daysArray[i].dataset.count, 10)
    // If there's no activity today, continue on to yesterday
    if (i === 0 && currentDayCount === 0) {
      currentStreakEnd = daysArray[1].dataset.date
      continue
    }

    if (currentDayCount > 0) {
      streakCurrent++
      currentStreakStart = daysArray[i].dataset.date
    }
    else {
      break
    }
  }

  if (streakCurrent > 0) {
    currentStreakStart = formatDateString(currentStreakStart, dateOptions)
    currentStreakEnd   = formatDateString(currentStreakEnd, dateOptions)
    datesCurrent       = `${currentStreakStart} → ${currentStreakEnd}`
  }
  else {
    datesCurrent = "No current streak"
  }

  // Year total
  countTotal = yearTotal.toLocaleString()
  let dateFirst  = formatDateString(firstDay, dateOptions)
  let dateLast   = formatDateString(lastDay, dateOptions)
  datesTotal = `${dateFirst} → ${dateLast}`

  // Average contributions per day
  let dayDifference = datesDayDifference(firstDay, lastDay)
  averageCount = precisionRound((yearTotal / dayDifference), 2)

  // Best day
  dateBest  = formatDateString(bestDay, dateOptions)
  if (!dateBest) {
    dateBest = 'No activity found'
  }

  // Longest streak
  if (streakLongest > 0) {
    longestStreakStart = formatDateString(longestStreakStart, dateOptions)
    longestStreakEnd   = formatDateString(longestStreakEnd, dateOptions)
    datesLongest       = `${longestStreakStart} → ${longestStreakEnd}`
  }
  else {
    datesLongest = "No longest streak"
  }
}

const getSquareColor = (fill) => {
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
      if (fill.indexOf('#') != -1)
        return new obelisk.CubeColor().getByHorizontalColor(parseInt('0x'+fill.replace("#", "")))
  }
}

const renderIsometricChart = () => {
  const SIZE = 16
  const MAX_HEIGHT = 100
  const firstRect = document.querySelectorAll('.js-calendar-graph-svg g > g')[1]
  const canvas = document.getElementById('isometric-contributions')
  const GH_OFFSET = parseInt(firstRect.getAttribute('transform').match(/(\d+)/)[0]) - 1

  let point= new obelisk.Point(130,90)
  let pixelView = new obelisk.PixelView(canvas, point)
  let contribCount = null
  let weeks = document.querySelectorAll(".js-calendar-graph-svg g > g")

  weeks.forEach(w => {
    let x = parseInt(((w.getAttribute('transform')).match(/(\d+)/))[0]) / (GH_OFFSET + 1)
    w.querySelectorAll('rect').forEach (r => {
      let y = parseInt(r.getAttribute('y')) / GH_OFFSET
      let fill = r.getAttribute('fill')
      let contribCount = parseInt(r.dataset.count)
      let cubeHeight = 3

      if (maxCount > 0) {
        cubeHeight += parseInt(MAX_HEIGHT / maxCount * contribCount)
      }

      let dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
      let color = getSquareColor(fill)
      let cube = new obelisk.Cube(dimension, color, false)
      let p3d = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
      pixelView.renderObject(cube, p3d)
    })
  })
}

const renderStats = () => {
  const topMarkup = `
    <div class="position-absolute top-0 right-0 mt-3 mr-5">
      <h5 class="mb-1">Contributions</h5>
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2" style="background-color:rgba(255, 255, 255, 0.8);">
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
      <div class="d-flex flex-justify-between rounded-2 border px-1 px-md-2" style="background-color:rgba(255, 255, 255, 0.8);">
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${streakLongest} <span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Longest</span>
          <span class="d-none d-sm-block text-small text-gray-light">${datesLongest}</span>
        </div>
        <div class="p-2">
          <span class="d-block f2 text-bold text-green lh-condensed">${streakCurrent} <span class="f4">days</span></span>
          <span class="d-block text-small text-bold">Current</span>
          <span class="d-none d-sm-block text-small text-gray-light">${datesCurrent}</span>
        </div>
      </div>
    </div>
  `
  const icStatsBlockTop = document.createElement("div")
  icStatsBlockTop.innerHTML = topMarkup
  document.querySelector('.ic-contributions-wrapper').appendChild(icStatsBlockTop)

  const icStatsBlockBottom = document.createElement("div")
  icStatsBlockBottom.innerHTML = bottomMarkup
  document.querySelector('.ic-contributions-wrapper').appendChild(icStatsBlockBottom)
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
  let factor = Math.pow(10, precision)
  return Math.round(number * factor) / factor
}

const datesDayDifference = (dateStr1, dateStr2) => {
  let diffDays = null
  let date1 = null
  let date2 = null

  if (dateStr1) {
    dateParts = dateStr1.split('-')
    date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
  }
  if (dateStr2) {
    dateParts = dateStr2.split('-')
    date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
  }
  if (dateStr1 && dateStr2) {
    timeDiff = Math.abs(date2.getTime() - date1.getTime())
    diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  return diffDays
}

const formatDateString = (dateStr, options) => {
  let date = null

  if (dateStr) {
    let dateParts = dateStr.split('-')
    date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0).toLocaleDateString('en-US', options)
  }

  return date
}

if (document.querySelector('.js-calendar-graph')) {
  let settingsPromise = getSettings()
  settingsPromise.then(generateIsometricChart)

  let config = { attributes: false, childList: true, subtree: true }
  let callback = (mutationsList) => {
    mutationsList.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('js-yearly-contributions'))
            generateIsometricChart()
        })
      }
    })
  }
  observedContainer = document.getElementById('js-pjax-container')
  observer = new MutationObserver(callback)
  observer.observe(observedContainer, config)
}
