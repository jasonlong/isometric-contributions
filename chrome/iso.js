const calendarGraph = document.querySelector('.js-calendar-graph')
const contributionsBox = document.querySelector('.js-yearly-contributions')
const observedContainer = document.getElementById('js-contribution-activity')

const COLORS = [
  new obelisk.CubeColor().getByHorizontalColor(0xebedf0),
  new obelisk.CubeColor().getByHorizontalColor(0x9be9a8),
  new obelisk.CubeColor().getByHorizontalColor(0x40c463),
  new obelisk.CubeColor().getByHorizontalColor(0x30a14e),
  new obelisk.CubeColor().getByHorizontalColor(0x216e39)
]

const dateOptions         = {month: "short", day: "numeric"}
const dateWithYearOptions = {month: "short", day: "numeric", year: "numeric"}

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
let show2DSetting = "no"

const resetValues = () => {
  yearTotal           = 0
  averageCount        = 0
  maxCount            = 0
  bestDay             = null
  firstDay            = null
  lastDay             = null
}

const getSettings = () => {
  return new Promise(function(resolve, reject) {
    // Check for user preference, if chrome.storage is available.
    // The storage API is not supported in content scripts.
    // https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if (chrome && chrome.storage) {
      chrome.storage.local.get(["toggleSetting", "show2DSetting"], (settings) => {
        toggleSetting = settings.toggleSetting ? settings.toggleSetting : "cubes"
        show2DSetting = settings.show2DSetting ? settings.show2DSetting : "no"
        resolve('Settings loaded')
      })
    }
    else {
      toggleSetting = localStorage.toggleSetting ? localStorage.toggleSetting : "cubes"
      show2DSetting = localStorage.show2DSetting ? localStorage.show2DSetting : "no"
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
  if (show2DSetting === "yes") {
    contributionsBox.classList.add("show-2d")
  }
  else {
    contributionsBox.classList.remove("show-2d")
  }

  const contributionsWrapper = document.createElement("div")
  contributionsWrapper.className = "ic-contributions-wrapper"
  calendarGraph.before(contributionsWrapper)

  const canvas = document.createElement("canvas")
  canvas.id = "isometric-contributions"
  canvas.width = 720
  canvas.height = 410
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

  // Inject footer w/ toggle for showing 2D chart
  const htmlFooter = document.createElement("span")
  htmlFooter.className = "ic-footer"

  const standardChartToggle = document.createElement("button")
  standardChartToggle.className = "ic-2d-toggle text-small btn-link muted-link"
  if (show2DSetting === "yes") {
    standardChartToggle.innerHTML = "Hide standard chart"
  }
  else {
    standardChartToggle.innerHTML = "Show standard chart"
  }
  standardChartToggle.addEventListener("click", handle2DToggle);

  contributionsWrapper.append(htmlFooter)
  htmlFooter.append(standardChartToggle)
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

const handle2DToggle = (e) => {
  if (contributionsBox.classList.contains("show-2d")) {
    e.target.innerHTML = "Show standard chart"
    contributionsBox.classList.remove("show-2d")
    persistSetting("show2DSetting", "no")
    show2DSetting = "no"
  }
  else {
    e.target.innerHTML = "Hide standard chart"
    contributionsBox.classList.add("show-2d")
    persistSetting("show2DSetting", "yes")
    show2DSetting = "yes"
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
    currentDayCount = d.dataset.count
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
    datesCurrent       = `${currentStreakStart} — ${currentStreakEnd}`
  }
  else {
    datesCurrent = "No current streak"
  }

  // Year total
  countTotal = yearTotal.toLocaleString()
  let dateFirst  = formatDateString(firstDay, dateWithYearOptions)
  let dateLast   = formatDateString(lastDay, dateWithYearOptions)
  datesTotal = `${dateFirst} — ${dateLast}`

  // Average contributions per day
  let dayDifference = datesDayDifference(firstDay, lastDay)
  let averageCount = precisionRound((yearTotal / dayDifference), 2)

  // Best day
  dateBest  = formatDateString(bestDay, dateOptions)
  if (!dateBest) {
    dateBest = 'No activity found'
  }

  // Longest streak
  if (streakLongest > 0) {
    longestStreakStart = formatDateString(longestStreakStart, dateOptions)
    longestStreakEnd   = formatDateString(longestStreakEnd, dateOptions)
    datesLongest       = `${longestStreakStart} — ${longestStreakEnd}`
  }
  else {
    datesLongest = "No longest streak"
  }
}

const renderIsometricChart = () => {
  const SIZE = 10
  const MAX_HEIGHT = 100
  const firstRect = document.querySelectorAll('.js-calendar-graph-svg g > g')[1]
  const canvas = document.getElementById('isometric-contributions')
  const GH_OFFSET = parseInt(firstRect.getAttribute('transform').match(/(\d+)/)[0]) - 1

  let point

  // create pixel view container in point
  if (GH_OFFSET === 10) {
    point = new obelisk.Point(70, 70)
  }
  else {
    point = new obelisk.Point(110,90)
  }

  let pixelView = new obelisk.PixelView(canvas, point)

  let contribCount = null

  let weeks = document.querySelectorAll(".js-calendar-graph-svg g > g")
  weeks.forEach(w => {
    let x = parseInt(((w.getAttribute('transform')).match(/(\d+)/))[0]) / (GH_OFFSET + 1)
    w.querySelectorAll('rect').forEach (r => {
      let r            = w.get(0)
      let y            = parseInt(w.getAttribute('y')) / GH_OFFSET
      let fill         = w.getAttribute('fill')
      let contribCount = parseInt(w.dataset.count)
      let cubeHeight   = 3

      if (maxCount > 0) {
        cubeHeight += parseInt(MAX_HEIGHT / maxCount * contribCount)
      }

      let dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight)
      let color     = self.getSquareColor(fill)
      let cube      = new obelisk.Cube(dimension, color, false)
      let p3d       = new obelisk.Point3D(SIZE * x, SIZE * y, 0)
      pixelView.renderObject(cube, p3d)
    })
  })
}

const renderStats = () => {
  const topMarkup = `
    <span class="ic-stats-table">
      <span class="ic-stats-row">
        <span class="ic-stats-label">1 year total
          <span class="ic-stats-count">${countTotal}</span>
          <span class="ic-stats-average">${averageCount}</span> per day
        </span>
        <span class="ic-stats-meta ic-stats-total-meta">
          <span class="ic-stats-unit">contributions</span>
          <span class="ic-stats-date">${datesTotal}</span>
        </span>
      </span>
      <span class="ic-stats-row">
        <span class="ic-stats-label">Busiest day
          <span class="ic-stats-count">${maxCount}</span>
        </span>
        <span class="ic-stats-meta">
          <span class="ic-stats-unit">contributions</span>
            <span class="ic-stats-date">${dateBest}</span>
          </span>
        </span>
      </span>
    </span>
  `

  const bottomMarkup = `
    <span class="ic-stats-table">
      <span class="ic-stats-row">
        <span class="ic-stats-label">Longest streak
          <span class="ic-stats-count">${streakLongest}</span>
        </span>
        <span class="ic-stats-meta">
          <span class="ic-stats-unit">days</span>
          <span class="ic-stats-date">${datesLongest}</span>
        </span>
      </span>
      <span class="ic-stats-row">
        <span class="ic-stats-label">Current streak
          <span class="ic-stats-count">${streakCurrent}</span>
        </span>
        <span class="ic-stats-meta">
          <span class="ic-stats-unit">days</span>
          <span class="ic-stats-date">${datesCurrent}</span>
        </span>
      </span>
    </span>
  `

  const icStatsBlockTop = document.createElement("div")
  icStatsBlockTop.className = "ic-stats-block ic-stats-top"
  icStatsBlockTop.innerHTML = topMarkup
  document.querySelector('.ic-contributions-wrapper').appendChild(icStatsBlockTop)

  const icStatsBlockBottom = document.createElement("div")
  icStatsBlockBottom.className = "ic-stats-block ic-stats-bottom"
  icStatsBlockBottom.innerHTML = bottomMarkup
  document.querySelector('.ic-contributions-wrapper').appendChild(icStatsBlockBottom)
}

const generateIsometricChart = () => {
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

if (calendarGraph) {
  const graphContainer = calendarGraph.parentElement

  if (graphContainer) {
    // Watch for changes to the activity overview section
    let config = { attributes: false, childList: true, subtree: true }
    observer = new MutationObserver(renderIsometricChart)
    observer.observe(observedContainer, config)
  }

  let settingsPromise = getSettings()
  settingsPromise.then(generateIsometricChart)
}

/*
class Iso
  renderIsometricChart: ->

  getSquareColor: (fill) ->
    color = switch fill.toLowerCase()
      when '#ebedf0' then COLORS[0]
      when '#c6e48b' then COLORS[1]
      when '#7bc96f' then COLORS[2]
      when '#239a3b' then COLORS[3]
      when '#196127' then COLORS[4]
      else
        if (fill.indexOf('#') != -1)
          new obelisk.CubeColor().getByHorizontalColor(parseInt('0x'+fill.replace("#", "")))


  */
