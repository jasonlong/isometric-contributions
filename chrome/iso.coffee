#
# Inject into GitHub.com
#
icRun = ->
  target = document.querySelector '.js-calendar-graph'

  if target?
    observer = new MutationObserver (mutations) ->
      mutations.forEach (mutation) ->
        if mutation.type is 'childList'
          days     = $('#calendar-graph rect')
          bestDay  = null
          maxCount = null
          (d3.selectAll days).attr 'data-contrib-count', (d, i) ->
            if d[1] > maxCount
              [bestDay, maxCount] = d
            d[1]
          observer.disconnect()
          target.setAttribute 'data-max-contributions', maxCount
          target.setAttribute 'data-best-day', bestDay

    observer.observe target,
      attributes: true
      childList: true
      characterData: true
script = document.createElement 'script'
script.appendChild document.createTextNode "(#{icRun})();"
document.documentElement.appendChild script

#
# The actual extension
#

renderIsometricChart = ->
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

  ($ '#calendar-graph g > g').each (g) ->
    x = parseInt (((($ this).attr 'transform').match /(\d+)/)[0]) / GH_OFFSET
    (($ this).find 'rect').each (r) ->
      r            = ($ this).get 0
      y            = parseInt (($ this).attr 'y') / GH_OFFSET
      style        = ($ this).attr 'style'
      contribCount = parseInt ($ this).data 'contrib-count'
      cubeHeight   = 3

      if maxContributions > 0
        cubeHeight += parseInt MAX_HEIGHT / maxContributions * contribCount

      dimension = new obelisk.CubeDimension SIZE, SIZE, cubeHeight
      color     = getSquareColor style
      cube      = new obelisk.Cube dimension, color, false
      p3d       = new obelisk.Point3D SIZE * x, SIZE * y, 0
      pixelView.renderObject cube, p3d

initUI = ->
  contributionsBox = (($ '#contributions-calendar').closest '.box').find '.box-body'
  insertLocation   = (($ '#contributions-calendar').closest '.box').find '.box-header .box-title'

  toggleClass = ''
  # Check for lock octicon
  if ((contributionsBox.closest '.box').find '.box-header .octicon-lock').length
    toggleClass = 'ic-with-lock'

  # Inject toggle
  html = """
    <span class="ic-toggle #{toggleClass}">
      <span class="tooltipped tooltipped-nw" aria-label="Normal chart view">
        <a href="#" class="ic-toggle-option squares" data-ic-option="squares"></a>
      </span>
      <span class="tooltipped tooltipped-nw" aria-label="Isometric chart view">
        <a href="#" class="ic-toggle-option cubes" data-ic-option="cubes"></a>
      </span>
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

  loadStats()

loadStats = ->
    # Year total
    str        = ($ '.contrib-day').html()
    html       = $.parseHTML str
    countTotal = (html[1].innerText.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
    datesTotal = $.trim html[2].nodeValue

    # Best day
    countBest = ($ '.js-calendar-graph').data 'max-contributions'
    dateParts = (($ '.js-calendar-graph').data 'best-day').split ' '
    dateBest  = 'Not so busy after all.'
    if dateParts[1]?
      dateBest  = "#{dateParts[1]} #{dateParts[2]} #{dateParts[3]}"

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
    str          = ($ '.contrib-streak').html()
    html         = $.parseHTML str
    countLongest = (html[1].innerText.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
    datesLongest = $.trim html[2].nodeValue

    # Current streak
    str          = ($ '.contrib-streak-current').html()
    html         = $.parseHTML str
    countCurrent = (html[1].innerText.match /(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0]
    datesCurrent = $.trim html[2].nodeValue

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

getSquareColor = (style) ->
  color0 = new obelisk.CubeColor().getByHorizontalColor 0xeeeeee
  color1 = new obelisk.CubeColor().getByHorizontalColor 0xd6e685
  color2 = new obelisk.CubeColor().getByHorizontalColor 0x8cc665
  color3 = new obelisk.CubeColor().getByHorizontalColor 0x44a340
  color4 = new obelisk.CubeColor().getByHorizontalColor 0x1e6823

  color = switch style
    when 'fill: rgb(238, 238, 238);', 'fill: #eeeeee;' then color0
    when 'fill: rgb(214, 230, 133);', 'fill: #d6e685;' then color1
    when 'fill: rgb(140, 198, 101);', 'fill: #8cc665;' then color2
    when 'fill: rgb(68,  163, 64 );', 'fill: #44a340;' then color3
    when 'fill: rgb(30,  104, 35 );', 'fill: #1e6823;' then color4

$ ->
  target = document.querySelector '.js-calendar-graph'

  if target
    observer = new MutationObserver (mutations) ->
      mutations.forEach (mutation) ->
        if mutation.attributeName is 'data-max-contributions'
          # We're loaded and ready!
          observer.disconnect()
          renderIsometricChart()
          initUI()

    if (($ '.js-calendar-graph').data 'max-contributions')?
      renderIsometricChart()
      initUI()
    else
      observer.observe target,
        attributes: true,
        childList: true,
        characterData: true
