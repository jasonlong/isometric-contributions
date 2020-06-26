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
let bestDay             = null
let firstDay            = null
let lastDay             = null

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
        console.log(`toggleSetting: ${toggleSetting}`)
        console.log(`show2DSetting: ${show2DSetting}`)
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
  const insertLocation = contributionsBox.querySelector("h2")

  const htmlToggle = document.createElement("span")
  htmlToggle.className = "ic-toggle"

  const squaresButton = document.createElement("a")
  squaresButton.className = "ic-toggle-option tooltipped tooltipped-nw squares"
  squaresButton.setAttribute("aria-label", "Standard chart view")
  squaresButton.setAttribute("data-ic-option", "squares")
  squaresButton.setAttribute("href", "#")
  squaresButton.addEventListener("click", handleViewToggle);
  if (toggleSetting === "squares") {
    squaresButton.classList.add("active")
  }

  const cubesButton = document.createElement("a")
  cubesButton.className = "ic-toggle-option tooltipped tooltipped-nw cubes"
  cubesButton.setAttribute("aria-label", "Isometric chart view")
  cubesButton.setAttribute("data-ic-option", "cubes")
  cubesButton.setAttribute("href", "#")
  cubesButton.addEventListener("click", handleViewToggle);
  if (toggleSetting === "cubes") {
    cubesButton.classList.add("active")
  }

  insertLocation.before(htmlToggle)
  htmlToggle.appendChild(squaresButton)
  htmlToggle.appendChild(cubesButton)

  // Inject footer w/ toggle for showing 2D chart
  const htmlFooter = document.createElement("span")
  htmlFooter.className = "ic-footer"

  const standardChartToggle = document.createElement("a")
  standardChartToggle.className = "ic-2d-toggle text-small muted-link"
  if (show2DSetting === "yes") {
    standardChartToggle.innerHTML = "Hide normal chart below"
  }
  else {
    standardChartToggle.innerHTML = "Show normal chart below"
  }
  standardChartToggle.setAttribute("href", "#")
  standardChartToggle.addEventListener("click", handle2DToggle);

  contributionsWrapper.append(htmlFooter)
  htmlFooter.append(standardChartToggle)
}

const handleViewToggle = (e) => {
  e.preventDefault()
  let option = e.target.dataset.icOption

  if (option === "squares") {
    contributionsBox.classList.remove("ic-cubes")
    contributionsBox.classList.add("ic-squares")
  }
  else {
    contributionsBox.classList.remove("ic-squares")
    contributionsBox.classList.add("ic-cubes")
  }

  document.querySelectorAll(".ic-toggle-option").forEach(toggle => { toggle.classList.remove("active") })
  e.target.classList.add("active")

  persistSetting("toggleSetting", option)
  toggleSetting = option

  // Apply user preference
  document.querySelector(`.ic-toggle-option.${toggleSetting}`).classList.add("active")
  contributionsBox.classList.add(`ic-${toggleSetting}`)
}

const handle2DToggle = (e) => {
  e.preventDefault()

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
  console.log("loadStats")
}

const renderIsometricChart = () => {
  console.log("renderIsometricChart")
}

const generateIsometricChart = () => {
  resetValues()
  initUI()
  loadStats()
  renderIsometricChart()
}

const precisionRound = (number, precision) => {
  let factor = Math.pow(10, precision)
  return Math.round(number * factor) / factor
}

if (calendarGraph) {
  const graphContainer = calendarGraph.parentElement

  if (graphContainer) {
    // Watch for changes to the activity overview section
    let config = { attributes: false, childList: true, subtree: true }
    observer = new MutationObserver(generateIsometricChart)
    observer.observe(observedContainer, config)
  }

  let settingsPromise = getSettings()
  settingsPromise.then(generateIsometricChart)
}

/*
class Iso
  observeToggle: ->
    self = this
    ($ '.ic-toggle-option').click (e) ->
      e.preventDefault()
      option = ($ this).data 'ic-option'
      if option is 'squares'
        (contributionsBox.removeClass 'ic-cubes').addClass 'ic-squares'
      else
        (contributionsBox.removeClass 'ic-squares').addClass 'ic-cubes'

      ($ '.ic-toggle-option').removeClass 'active'
      ($ this).addClass 'active'

      self.persistSetting "toggleSetting", option
      self.toggleSetting = option

    # Apply user preference
    ($ ".ic-toggle-option.#{this.toggleSetting}").addClass 'active'
    contributionsBox.addClass "ic-#{this.toggleSetting}"

    ($ '.ic-2d-toggle').click (e) ->
      e.preventDefault()
      if contributionsBox.hasClass 'show-2d'
        ($ this).text 'Show normal chart ▾'
        contributionsBox.removeClass 'show-2d'
        self.persistSetting "show2DSetting", 'no'
        self.show2DSetting = 'no'
      else
        ($ this).text 'Hide normal chart ▴'
        contributionsBox.addClass 'show-2d'
        self.persistSetting "show2DSetting", 'yes'
        self.show2DSetting = 'yes'

    # Apply user preference
    if (this.show2DSetting == "yes")
      contributionsBox.addClass 'show-2d'
      ($ '.ic-2d-toggle').text 'Hide normal chart ▴'
    else
      contributionsBox.removeClass 'show-2d'
      ($ '.ic-2d-toggle').text 'Show normal chart ▾'

  loadStats: ->
    streakLongest      = 0
    streakCurrent      = 0
    tempStreak         = 0
    tempStreakStart    = null
    longestStreakStart = null
    longestStreakEnd   = null
    currentStreakStart = null
    currentStreakEnd   = null
    datesCurrent       = null

    contribColumns = ($ '.contrib-column')

    days = ($ '.js-calendar-graph rect.day')
    days.each (d) ->
      currentDayCount = ($ this).data('count')
      yearTotal += currentDayCount

      firstDay = ($ this).data('date') if d == 0
      lastDay  = ($ this).data('date') if d == days.length - 1

      # Check for best day
      if currentDayCount > maxCount
        bestDay  = ($ this).data('date')
        maxCount = currentDayCount

      # Check for longest streak
      if currentDayCount > 0
        if tempStreak == 0
          tempStreakStart = ($ this).data('date')

        tempStreak++

        if tempStreak >= streakLongest
          longestStreakStart = tempStreakStart
          longestStreakEnd   = ($ this).data('date')
          streakLongest      = tempStreak

      else
        tempStreak         = 0
        tempStreakStart    = null
        tempStreakEnd      = null

    # Check for current streak
    # Have to iterate and access differently than above because
    # we end up with a regular JS Array after reversing
    days = ($ '.js-calendar-graph rect.day').get().reverse()
    currentStreakEnd = days[0].getAttribute('data-date')
    for d, i in days
      currentDayCount = parseInt(d.getAttribute('data-count'), 10)

      # If there's no activity today, continue on to yesterday
      if i == 0 && currentDayCount == 0
        currentStreakEnd = days[1].getAttribute('data-date')
        continue

      if currentDayCount > 0
        streakCurrent++
        currentStreakStart = d.getAttribute('data-date')
      else
        break

    if streakCurrent > 0
      currentStreakStart = this.formatDateString currentStreakStart, dateOptions
      currentStreakEnd   = this.formatDateString currentStreakEnd, dateOptions
      datesCurrent       = currentStreakStart + " — " + currentStreakEnd
    else
      datesCurrent = "No current streak"

    # Year total
    countTotal = yearTotal.toLocaleString()
    dateFirst  = this.formatDateString firstDay, dateWithYearOptions
    dateLast   = this.formatDateString lastDay, dateWithYearOptions
    datesTotal = dateFirst + " — " + dateLast

    # Average Contribution per Day
    dayDifference = this.datesDayDifference firstDay, lastDay
    averageCount = this.precisionRound((yearTotal / dayDifference), 2)

    # Best day
    dateBest  = this.formatDateString bestDay, dateOptions
    if !dateBest
      dateBest = 'No activity found'

    # Longest streak
    if streakLongest > 0
      longestStreakStart = this.formatDateString longestStreakStart, dateOptions
      longestStreakEnd   = this.formatDateString longestStreakEnd, dateOptions
      datesLongest       = longestStreakStart + " — " + longestStreakEnd
    else
      datesLongest = "No longest streak"

    this.renderTopStats(countTotal, averageCount, datesTotal, maxCount, dateBest)
    this.renderBottomStats(streakLongest, datesLongest, streakCurrent, datesCurrent)

  renderTopStats: (countTotal, averageCount, datesTotal, maxCount, dateBest) ->
    html = """
      <div class="ic-stats-block ic-stats-top">
        <span class="ic-stats-table">
          <span class="ic-stats-row">
            <span class="ic-stats-label">1 year total
              <span class="ic-stats-count">#{countTotal}</span>
              <span class="ic-stats-average">#{averageCount}</span> per day
            </span>
            <span class="ic-stats-meta ic-stats-total-meta">
              <span class="ic-stats-unit">contributions</span>
              <span class="ic-stats-date">#{datesTotal}</span>
            </span>
          </span>
          <span class="ic-stats-row">
            <span class="ic-stats-label">Busiest day
              <span class="ic-stats-count">#{maxCount}</span>
            </span>
            <span class="ic-stats-meta">
              <span class="ic-stats-unit">contributions</span>
                <span class="ic-stats-date">#{dateBest}</span>
              </span>
            </span>
          </span>
        </span>
      </div>
    """
    ($ html).appendTo $ '.ic-contributions-wrapper'

  renderBottomStats: (streakLongest, datesLongest, streakCurrent, datesCurrent) ->
    html = """
      <div class="ic-stats-block ic-stats-bottom">
        <span class="ic-stats-table">
          <span class="ic-stats-row">
            <span class="ic-stats-label">Longest streak
              <span class="ic-stats-count">#{streakLongest}</span>
            </span>
            <span class="ic-stats-meta">
              <span class="ic-stats-unit">days</span>
              <span class="ic-stats-date">#{datesLongest}</span>
            </span>
          </span>
          <span class="ic-stats-row">
            <span class="ic-stats-label">Current streak
              <span class="ic-stats-count">#{streakCurrent}</span>
            </span>
            <span class="ic-stats-meta">
              <span class="ic-stats-unit">days</span>
              <span class="ic-stats-date">#{datesCurrent}</span>
            </span>
          </span>
        </span>
      </div>
    """
    ($ html).appendTo $ '.ic-contributions-wrapper'

  renderIsometricChart: ->
    SIZE       = 10
    MAX_HEIGHT = 100
    GH_OFFSET  = parseInt (((($ '.js-calendar-graph-svg g > g')[1].getAttribute 'transform').match /(\d+)/)[0]) - 1

    canvas = document.getElementById 'isometric-contributions'

    # create pixel view container in point
    if GH_OFFSET == 10
      point = new obelisk.Point 70,70
    else
      point = new obelisk.Point 110,90

    pixelView = new obelisk.PixelView canvas, point

    contribCount = null

    self = this
    ($ '.js-calendar-graph-svg g > g').each (g) ->
      x = parseInt (((($ this).attr 'transform').match /(\d+)/)[0]) / (GH_OFFSET + 1)
      (($ this).find 'rect').each (r) ->
        r            = ($ this).get 0
        y            = parseInt (($ this).attr 'y') / GH_OFFSET
        fill         = ($ this).attr 'fill'
        contribCount = parseInt ($ this).data 'count'
        cubeHeight   = 3

        if maxCount > 0
          cubeHeight += parseInt MAX_HEIGHT / maxCount * contribCount

        dimension = new obelisk.CubeDimension SIZE, SIZE, cubeHeight
        color     = self.getSquareColor fill
        cube      = new obelisk.Cube dimension, color, false
        p3d       = new obelisk.Point3D SIZE * x, SIZE * y, 0
        pixelView.renderObject cube, p3d

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

  formatDateString: (dateStr, options) ->
    date = null

    if dateStr
      dateParts = dateStr.split '-'
      date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0).toLocaleDateString('en-US', options)

    return date

  datesDayDifference: (dateStr1, dateStr2) ->
    diffDays = null
    date1 = null
    date2 = null

    if dateStr1
      dateParts = dateStr1.split '-'
      date1 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
    if dateStr2
      dateParts = dateStr2.split '-'
      date2 = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)

    if dateStr1 && dateStr2
      timeDiff = Math.abs(date2.getTime() - date1.getTime())
      diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))

    return diffDays
  */
