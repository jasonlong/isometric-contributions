class Iso
  COLORS = [
    new obelisk.CubeColor().getByHorizontalColor(0xeeeeee),
    new obelisk.CubeColor().getByHorizontalColor(0xd6e685),
    new obelisk.CubeColor().getByHorizontalColor(0x8cc665),
    new obelisk.CubeColor().getByHorizontalColor(0x44a340),
    new obelisk.CubeColor().getByHorizontalColor(0x1e6823)
  ]

  constructor: (target) ->
    if target
      days     = $('.js-calendar-graph rect.day')
      bestDay  = null
      maxCount = null

      days.each ->
        if $(this).data('count') > maxCount
          bestDay = ($ this).data('date')
          maxCount = ($ this).data('count')
      target.setAttribute 'data-max-contributions', maxCount
      target.setAttribute 'data-best-day', bestDay

      @renderIsometricChart()
      @initUI()

  renderIsometricChart: ->
    ($ '<div class="ic-contributions-wrapper"></div>')
      .insertBefore '#contributions-calendar'
    ($ '<canvas id="isometric-contributions" width="728" height="470"></canvas>')
      .appendTo '.ic-contributions-wrapper'

    SIZE       = 12
    GH_OFFSET  = 13
    MAX_HEIGHT = 100

    canvas = document.getElementById 'isometric-contributions'

    # create pixel view container in point
    point = new obelisk.Point 87, 100
    pixelView = new obelisk.PixelView canvas, point

    maxContributions = ($ '.js-calendar-graph').data 'max-contributions'
    contribCount = null

    self = this
    ($ '.js-calendar-graph g > g').each (g) ->
      x = parseInt (((($ this).attr 'transform').match /(\d+)/)[0]) / GH_OFFSET
      (($ this).find 'rect').each (r) ->
        r            = ($ this).get 0
        y            = parseInt (($ this).attr 'y') / GH_OFFSET
        fill         = ($ this).attr 'fill'
        contribCount = parseInt ($ this).data 'count'
        cubeHeight   = 3

        if maxContributions > 0
          cubeHeight += parseInt MAX_HEIGHT / maxContributions * contribCount

        dimension = new obelisk.CubeDimension SIZE, SIZE, cubeHeight
        color     = self.getSquareColor fill
        cube      = new obelisk.Cube dimension, color, false
        p3d       = new obelisk.Point3D SIZE * x, SIZE * y, 0
        pixelView.renderObject cube, p3d

  initUI: ->
    contributionsBox = (($ '#contributions-calendar').closest '.boxed-group')
    insertLocation   = (($ '#contributions-calendar').closest '.boxed-group').find 'h3'

    toggleClass = ''
    # Check for lock octicon
    if ((contributionsBox.closest '.box').find '.box-header .octicon-lock').length
      toggleClass = 'ic-with-lock'

    # Inject toggle
    html = """
      <span class="ic-toggle #{toggleClass}">
        <a href="#" class="ic-toggle-option tooltipped tooltipped-nw squares" data-ic-option="squares" aria-label="Normal chart view"></a>
        <a href="#" class="ic-toggle-option tooltipped tooltipped-nw cubes" data-ic-option="cubes" aria-label="Isometric chart view"></a>
      </span>
    """
    ($ html).insertBefore insertLocation

    # Observe toggle
    ($ '.ic-toggle-option').click (e) ->
      e.preventDefault()
      option = $(this).data 'ic-option'
      if option is 'squares'
        (contributionsBox.removeClass 'ic-cubes').addClass 'ic-squares'
      else
        (contributionsBox.removeClass 'ic-squares').addClass 'ic-cubes'

      ($ '.ic-toggle-option').removeClass 'active'
      ($ this).addClass 'active'

      chrome.storage.local.set toggleSetting: option

    # Check for user preference
    chrome.storage.local.get 'toggleSetting', (result) ->
      if result.toggleSetting?
        ($ ".ic-toggle-option.#{result.toggleSetting}").addClass 'active'
        contributionsBox.addClass "ic-#{result.toggleSetting}"
      else
        ($ '.ic-toggle-option.cubes').addClass 'active'
        (contributionsBox.removeClass 'ic-squares').addClass 'ic-cubes'

    # Inject footer w/ toggle for showing 2D chart
    html = """
      <span class="ic-footer">
        <a href="#" class="ic-2d-toggle">Show normal chart below ▾</a>
      </span>
    """
    ($ html).appendTo $ '.ic-contributions-wrapper'

    ($ '.ic-2d-toggle').click (e) ->
      e.preventDefault()
      if contributionsBox.hasClass 'show-2d'
        ($ this).text 'Show normal chart below ▾'
        contributionsBox.removeClass 'show-2d'
      else
        ($ this).text 'Hide normal chart below ▴'
        contributionsBox.addClass 'show-2d'

    @loadStats()

  loadStats: ->
      contribColumns = ($ '.contrib-column')

      # Year total
      str        = $(contribColumns[0]).find('.contrib-number').html()
      countTotal = (str.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
      datesTotal = $(contribColumns[0]).find('span:last-child').html()

      # Best day
      countBest = ($ '.js-calendar-graph').data 'max-contributions'
      dateParts = (($ '.js-calendar-graph').data 'best-day').split '-'
      dateBest  = 'Not so busy after all.'
      if dateParts[0]?
        options = {month: "long", day: "numeric"}
        date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0)
        dateBest = date.toLocaleDateString('en-US', options)

      html = """
        <div class="ic-stats-block ic-stats-top">
          <span class="ic-stats-table">
            <span class="ic-stats-row">
              <span class="ic-stats-label">1 year total
                <span class="ic-stats-count">#{countTotal}</span>
              </span>
              <span class="ic-stats-meta">
                <span class="ic-stats-unit">contributions</span>
                <span class="ic-stats-date">#{datesTotal}</span>
              </span>
            </span>
            <span class="ic-stats-row">
              <span class="ic-stats-label">Busiest day
                <span class="ic-stats-count">#{countBest}</span>
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

      # Longest streak
      str          = $(contribColumns[1]).find('.contrib-number').html()
      countLongest = (str.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
      datesLongest = $(contribColumns[1]).find('span:last-child').html()

      # Current streak
      str          = $(contribColumns[2]).find('.contrib-number').html()
      countCurrent = (str.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
      datesCurrent = $(contribColumns[2]).find('span:last-child').html()

      html = """
        <div class="ic-stats-block ic-stats-bottom">
          <span class="ic-stats-table">
            <span class="ic-stats-row">
              <span class="ic-stats-label">Longest streak
                <span class="ic-stats-count">#{countLongest}</span>
              </span>
              <span class="ic-stats-meta">
                <span class="ic-stats-unit">days</span>
                <span class="ic-stats-date">#{datesLongest}</span>
              </span>
            </span>
            <span class="ic-stats-row">
              <span class="ic-stats-label">Current streak
                <span class="ic-stats-count">#{countCurrent}</span>
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

  getSquareColor: (fill) ->
    color = switch fill
      when 'rgb(238, 238, 238)', '#eeeeee' then COLORS[0]
      when 'rgb(214, 230, 133)', '#d6e685' then COLORS[1]
      when 'rgb(140, 198, 101)', '#8cc665' then COLORS[2]
      when 'rgb(68, 163, 64)',   '#44a340' then COLORS[3]
      when 'rgb(30, 104, 35)',   '#1e6823' then COLORS[4]

$(window).load ->
  target = document.querySelector '.js-calendar-graph'
  iso = new Iso target
