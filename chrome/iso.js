//
// Inject into GitHub.com
//
function icRun() {
  var target = document.querySelector('.js-calendar-graph');

  if (target) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          var days     = $('#calendar-graph rect');
          var bestDay  = "";
          var maxCount = 0;
          d3.selectAll(days).attr("data-contrib-count", function(d, i) {
            if (d[1] > maxCount) {
              bestDay  = d[0];
              maxCount = d[1];
            }
            return d[1];
          });
          observer.disconnect();
          target.setAttribute("data-max-contributions", maxCount);
          target.setAttribute("data-best-day", bestDay);
        }
      });
    });

    observer.observe(target, { attributes: true, childList: true, characterData: true});
  }
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ icRun +')();'));
document.documentElement.appendChild(script);

//
// The actual extension
//

$(function() {
  var target = document.querySelector('.js-calendar-graph');

  if (target) {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'data-max-contributions') {
          // We're loaded and ready!
          observer.disconnect();
          renderIsometricChart();
          initUI();
        }
      });
    });

    if ($('.js-calendar-graph').data("max-contributions") !== undefined) {
      renderIsometricChart();
      initUI();
    }
    else {
      observer.observe(target, { attributes: true, childList: true, characterData: true});
    }
  }

});

function renderIsometricChart() {
  $('<div class="ic-contributions-wrapper"></div>').insertBefore('#contributions-calendar');
  $('<canvas id="isometric-contributions" width="728" height="470"></canvas>').appendTo('.ic-contributions-wrapper');

  var SIZE       = 12;
  var GH_OFFSET  = 13;
  var MAX_HEIGHT = 100;

  var canvas = document.getElementById('isometric-contributions');

  // create pixel view container in point
  var point = new obelisk.Point(87, 100);
  var pixelView = new obelisk.PixelView(canvas, point);

  var maxContributions = $('.js-calendar-graph').data("max-contributions");
  var contribCount;

  $('#calendar-graph g > g').each(function(g) {
    var x = parseInt($(this).attr('transform').match(/(\d+)/)[0] / GH_OFFSET);
    $(this).find('rect').each(function(r) {
      var r            = $(this).get(0);
      var y            = parseInt($(this).attr('y') / GH_OFFSET);
      var style        = $(this).attr('style');
      var contribCount = parseInt($(this).data("contrib-count"));
      var cubeHeight   = 3;

      if (maxContributions > 0) {
        cubeHeight += parseInt(MAX_HEIGHT/maxContributions * contribCount);
      }

      var dimension = new obelisk.CubeDimension(SIZE, SIZE, cubeHeight);
      var color     = getSquareColor(style);
      var cube      = new obelisk.Cube(dimension, color, false);
      var p3d       = new obelisk.Point3D(SIZE * x, SIZE * y, 0);
      pixelView.renderObject(cube, p3d);
    });
  });
}

function initUI() {
  var contributionsBox = $('#contributions-calendar').closest('.box').find('.box-body');
  var insertLocation   = $('#contributions-calendar').closest('.box').find('.box-header .box-title');

  var toggleClass = "";
  // Check for lock octicon
  if (contributionsBox.closest('.box').find('.box-header .octicon-lock').length) {
    toggleClass = "ic-with-lock";
  }

  // Inject toggle
  $('<span class="ic-toggle ' + toggleClass + '"><span class="tooltipped tooltipped-nw" aria-label="Normal chart view"><a href="#" class="ic-toggle-option squares" data-ic-option="squares"></a></span><span class="tooltipped tooltipped-nw" aria-label="Isometric chart view"><a href="#" class="ic-toggle-option cubes" data-ic-option="cubes"></a></span></span>').insertBefore(insertLocation);

  // Observe toggle
  $('.ic-toggle-option').click(function(e) {
    e.preventDefault();
    var option = $(this).data("ic-option");
    if (option === "squares") {
      contributionsBox.removeClass('ic-cubes').addClass('ic-squares');
    }
    else {
      contributionsBox.removeClass('ic-squares').addClass('ic-cubes');
    }
    $('.ic-toggle-option').removeClass('active');
    $(this).addClass('active');

    chrome.storage.local.set({'toggleSetting': option});
  });

  // Check for user preference
  chrome.storage.local.get('toggleSetting', function (result) {
    if (result.toggleSetting !== undefined) {
      $('.ic-toggle-option.'+result.toggleSetting).addClass('active');
      contributionsBox.addClass('ic-'+result.toggleSetting);
    }
    else {
      $('.ic-toggle-option.cubes').addClass('active');
      contributionsBox.removeClass('ic-squares').addClass('ic-cubes');
    }
  });

  // Inject footer w/ toggle for showing 2D chart
  $('<span class="ic-footer"><a href="#" class="ic-2d-toggle">Show normal chart below ▾</a></span>').appendTo($('.ic-contributions-wrapper'));

  $('.ic-2d-toggle').click(function(e) {
    e.preventDefault();
    if (contributionsBox.hasClass('show-2d')) {
      $(this).text('Show normal chart below ▾');
      contributionsBox.removeClass('show-2d');
    }
    else {
      $(this).text('Hide normal chart below ▴');
      contributionsBox.addClass('show-2d');
    }
  });

  loadStats();
}

function loadStats() {
  // Year total
  var str        = $('.contrib-day').html();
  var html       = $.parseHTML(str);
  var countTotal = html[1].innerText.match(/(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0];
  var datesTotal = $.trim(html[2].nodeValue);

  // Best day
  var countBest = $('.js-calendar-graph').data('max-contributions');
  var dateParts = $('.js-calendar-graph').data('best-day').split(" ");
  var dateBest  = "Not so busy after all.";
  if (dateParts[1] !== undefined) {
    dateBest  = dateParts[1] + " " + dateParts[2] + " " + dateParts[3];
  }

  $('<div class="ic-stats-block ic-stats-top"><span class="ic-stats-table"><span class="ic-stats-row"><span class="ic-stats-label">1 year total<span class="ic-stats-count">' + countTotal + '</span></span><span class="ic-stats-meta"><span class="ic-stats-unit">contributions</span><span class="ic-stats-date">' + datesTotal + '</span></span></span><span class="ic-stats-row"><span class="ic-stats-label">Busiest day<span class="ic-stats-count">' + countBest + '</span></span><span class="ic-stats-meta"><span class="ic-stats-unit">contributions</span><span class="ic-stats-date">' + dateBest + '</span></span></span></div>').appendTo($('.ic-contributions-wrapper'));

  // Longest streak
  var str          = $('.contrib-streak').html();
  var html         = $.parseHTML(str);
  var countLongest = html[1].innerText.match(/(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0];
  var datesLongest = $.trim(html[2].nodeValue);

  // Current streak
  var str          = $('.contrib-streak-current').html();
  var html         = $.parseHTML(str);
  var countCurrent = html[1].innerText.match(/(((\d{1,3})(,\d{3})*)|(\d+))(.\d+)?/)[0];
  var datesCurrent = $.trim(html[2].nodeValue);

  $('<div class="ic-stats-block ic-stats-bottom"><span class="ic-stats-table"><span class="ic-stats-row"><span class="ic-stats-label">Longest streak<span class="ic-stats-count">' + countLongest + '</span></span><span class="ic-stats-meta"><span class="ic-stats-unit">days</span><span class="ic-stats-date">' + datesLongest + '</span></span></span><span class="ic-stats-row"><span class="ic-stats-label">Current streak<span class="ic-stats-count">' + countCurrent + '</span></span><span class="ic-stats-meta"><span class="ic-stats-unit">days</span><span class="ic-stats-date">' + datesCurrent + '</span></span></span></div>').appendTo($('.ic-contributions-wrapper'));
}

function getSquareColor(style) {
  var color;
  var color0 = new obelisk.CubeColor().getByHorizontalColor(0xeeeeee);
  var color1 = new obelisk.CubeColor().getByHorizontalColor(0xd6e685);
  var color2 = new obelisk.CubeColor().getByHorizontalColor(0x8cc665);
  var color3 = new obelisk.CubeColor().getByHorizontalColor(0x44a340);
  var color4 = new obelisk.CubeColor().getByHorizontalColor(0x1e6823);

  if      (style == 'fill: rgb(238, 238, 238);' || style == 'fill: #eeeeee;') color = color0;
  else if (style == 'fill: rgb(214, 230, 133);' || style == 'fill: #d6e685;')  color = color1;
  else if (style == 'fill: rgb(140, 198, 101);' || style == 'fill: #8cc665;')  color = color2;
  else if (style == 'fill: rgb(68, 163, 64);'   || style == 'fill: #44a340;')  color = color3;
  else if (style == 'fill: rgb(30, 104, 35);'   || style == 'fill: #1e6823;')  color = color4;

  return color;
}
