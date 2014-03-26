//
// Inject into GitHub.com
//
function icRun() {
  var target = document.querySelector('.js-calendar-graph');

  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        var maxCount = 0;
        var days = $('#calendar-graph rect');
        d3.selectAll(days).attr("data-contrib-count", function(d, i) {
          if (d[1] > maxCount) maxCount = d[1];
          return d[1];
        });
        target.setAttribute("data-max-contributions", maxCount);
      }
    });
  });

  observer.observe(target, { attributes: true, childList: true, characterData: true});
}
var script = document.createElement('script');
script.appendChild(document.createTextNode('('+ icRun +')();'));
document.documentElement.appendChild(script);

//
// The actual extension
//

$(function() {

  $('<canvas id="isometric-contributions" width="721" height="500"></canvas>').insertBefore('#contributions-calendar');

  var SIZE       = 10;
  var GH_OFFSET  = 13;
  var MAX_HEIGHT = 100;

  var canvas = document.getElementById('isometric-contributions');

  console.log($('#calendar-graph').length);

  // create pixel view container in point
  var point = new obelisk.Point(100, 50);
  var pixelView = new obelisk.PixelView(canvas, point);

  var color;
  var color0 = new obelisk.CubeColor().getByHorizontalColor(0xeeeeee);
  var color1 = new obelisk.CubeColor().getByHorizontalColor(0xd6e685);
  var color2 = new obelisk.CubeColor().getByHorizontalColor(0x8cc665);
  var color3 = new obelisk.CubeColor().getByHorizontalColor(0x44a340);
  var color4 = new obelisk.CubeColor().getByHorizontalColor(0x1e6823);

  var maxContributions = $('.js-calendar-graph').data("max-contributions");
  var contribCount;

  $('#calendar-graph g > g').each(function(g) {
    $(this).find('rect').each(function(r) {
      var r            = $(this).get(0);
      var y            = $(this).attr('y') / GH_OFFSET;
      var style        = $(this).attr('style');
      var contribCount = parseInt($(this).data("contrib-count"));

      var dimension = new obelisk.CubeDimension(SIZE, SIZE, MAX_HEIGHT/maxContributions * contribCount + 3);

      if      (style == 'fill: rgb(238, 238, 238);') color = color0;
      else if (style == 'fill: rgb(214, 230, 133);') color = color1;
      else if (style == 'fill: rgb(140, 198, 101);') color = color2;
      else if (style == 'fill: rgb(68, 163, 64);')   color = color3;
      else if (style == 'fill: rgb(30, 104, 35);')   color = color4;

      var cube = new obelisk.Cube(dimension, color, false);
      var p3d = new obelisk.Point3D(SIZE * g, SIZE * y, 0);
      pixelView.renderObject(cube, p3d);
    });
  });

});

