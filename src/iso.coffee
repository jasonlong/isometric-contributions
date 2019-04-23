class Iso
  COLORS = [
    new obelisk.CubeColor().getByHorizontalColor(0xebedf0),
    new obelisk.CubeColor().getByHorizontalColor(0xc6e48b),
    new obelisk.CubeColor().getByHorizontalColor(0x7bc96f),
    new obelisk.CubeColor().getByHorizontalColor(0x239a3b),
    new obelisk.CubeColor().getByHorizontalColor(0x196127)
  ]

  yearTotal           = 0
  averageCount        = 0
  maxCount            = 0
  bestDay             = null
  firstDay            = null
  lastDay             = null
  contributionsBox    = null
  dateOptions         = {month: "short", day: "numeric"}
  dateWithYearOptions = {month: "short", day: "numeric", year: "numeric"}

  constructor: (target) ->
    if target
      graphContainer = ($ '.js-contribution-graph').parent()[0]
      if graphContainer
        observer = new MutationObserver (mutations) =>
          isGraphAdded = mutations.find (mutation) ->
            [].find.call mutation.addedNodes, (node) ->
              node.className == "js-contribution-graph"
          if isGraphAdded
            this.generateIsometricChart()

        observer.observe(graphContainer, { childList: true })

      this.getSettings =>
        this.generateIsometricChart()

  getSettings: (callback) ->
    # Check for user preference, if chrome.storage is available.
    # The storage API is not supported in content scripts.
    # https://developer.mozilla.org/Add-ons/WebExtensions/Chrome_incompatibilities#storage
    if chrome?.storage?
      chrome.storage.local.get ['toggleSetting', 'show2DSetting'], ({toggleSetting, show2DSetting}) =>
        this.toggleSetting = toggleSetting ? 'cubes'
        this.show2DSetting = show2DSetting ? 'no'
        callback()
    else
      this.toggleSetting = localStorage.toggleSetting ? 'cubes'
      this.show2DSetting = localStorage.show2DSetting ? 'no'
      callback()

  persistSetting: (key, value, callback = ->) ->
    if chrome?.storage?
      obj = {}
      obj[key] = value
      chrome.storage.local.set obj, callback
    else
      localStorage[key] = value
      callback()

  generateIsometricChart: ->
    this.resetValues()
    this.initUI()
    this.loadStats()
    this.renderIsometricChart()

  resetValues: ->
    yearTotal           = 0
    averageCount        = 0
    maxCount            = 0
    bestDay             = null
    firstDay            = null
    lastDay             = null
    contributionsBox    = null

  initUI: ->
    ($ '<div class="ic-contributions-wrapper"></div>')
      .insertBefore ($ '.js-calendar-graph')
    ($ '<canvas id="isometric-contributions" width="720" height="410"></canvas>')
      .appendTo '.ic-contributions-wrapper'

    contributionsBox = ($ '.js-yearly-contributions')
    insertLocation = ($ '.js-yearly-contributions').find 'h2'

    # Inject toggle
    htmlToggle = """
      <span class="ic-toggle">
        <a href="#" class="ic-toggle-option tooltipped tooltipped-nw squares" data-ic-option="squares" aria-label="Normal chart view"></a>
        <a href="#" class="ic-toggle-option tooltipped tooltipped-nw cubes" data-ic-option="cubes" aria-label="Isometric chart view"></a>
      </span>
    """
    ($ htmlToggle).insertBefore insertLocation

    # Inject footer w/ toggle for showing 2D chart
    htmlFooter = """
      <span class="ic-footer">
        <a href="#" class="ic-2d-toggle">Show normal chart below ▾</a>
      </span>
    """
    ($ htmlFooter).appendTo $ '.ic-contributions-wrapper'

    this.observeToggle()

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
      when 'rgb(235, 237, 240)', '#ebedf0' then COLORS[0]
      when 'rgb(198, 228, 139)', '#c6e48b' then COLORS[1]
      when 'rgb(123, 201, 111)', '#7bc96f' then COLORS[2]
      when 'rgb(35, 154, 59)',   '#239a3b' then COLORS[3]
      when 'rgb(25, 97, 39)',    '#196127' then COLORS[4]
      else
        if (fill.indexOf('#') != -1)
          new obelisk.CubeColor().getByHorizontalColor(parseInt('0x'+fill.replace("#", "")));

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

  precisionRound: (number, precision) ->
    factor = Math.pow(10, precision)
    return Math.round(number * factor) / factor

if document.querySelector '.js-calendar-graph'
  loadIso = () ->
    if !($ '.js-contribution-graph').hasClass 'ic-cubes'
      $ ->
        target = document.querySelector '.js-calendar-graph'
        iso = new Iso target

  # load iso graph when the page first load
  loadIso()

  # load iso graph when contribution graph upload (change time)
  targetNode = document.getElementById 'js-pjax-container'
  config = { attributes: false, childList: true, subtree: true }
  callback = (mutationsList) ->
    for mutation in mutationsList
      if mutation.type == 'childList'
        for node in mutation.addedNodes
          if ($ node).hasClass 'js-yearly-contributions'
            loadIso()
  observer = new MutationObserver(callback)
  observer.observe(targetNode, config)
