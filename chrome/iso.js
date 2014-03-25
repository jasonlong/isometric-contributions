$(function() {

  $('<canvas id="isometric-contributions" width="721" height="500"></canvas>').insertBefore('#contributions-calendar');

  console.log($('#calendar-graph g').length);

  var SIZE      = 10;
  var GH_OFFSET = 13;

  var canvas = document.getElementById('isometric-contributions');

  // create pixel view container in point
  var point = new obelisk.Point(100, 50);
  var pixelView = new obelisk.PixelView(canvas, point);

  var color;
  var color0 = new obelisk.CubeColor().getByHorizontalColor(0xeeeeee);
  var color1 = new obelisk.CubeColor().getByHorizontalColor(0xd6e685);
  var color2 = new obelisk.CubeColor().getByHorizontalColor(0x8cc665);
  var color3 = new obelisk.CubeColor().getByHorizontalColor(0x44a340);
  var color4 = new obelisk.CubeColor().getByHorizontalColor(0x1e6823);

  $('#calendar-graph g').each(function(g) {
    $(this).find('rect').each(function(r) {
      console.log($(this).attr('style'));
      var y = $(this).attr('y') / GH_OFFSET;

      var contribCount;
      var weightedCount = Math.random();

      if      (weightedCount < 0.4) contribCount = Math.floor(weightedCount * 12);
      else if (weightedCount < 0.5) contribCount = Math.floor(weightedCount * 15);
      else if (weightedCount < 0.6) contribCount = Math.floor(weightedCount * 20);
      else if (weightedCount < 0.7) contribCount = Math.floor(weightedCount * 25);

      if (contribCount <= 3) contribCount = 3;
      var dimension = new obelisk.CubeDimension(SIZE, SIZE, contribCount);

      if (contribCount == 3)  color = color0;
      if (contribCount > 10)  color = color1;
      if (contribCount > 20)  color = color2;
      if (contribCount > 30)  color = color3;
      if (contribCount > 50)  color = color4;

      var cube = new obelisk.Cube(dimension, color, false);
      var p3d = new obelisk.Point3D(SIZE * g, SIZE * y, 0);
      pixelView.renderObject(cube, p3d);
    });
  });

});
