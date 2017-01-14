window.addEventListener('load', init, false);

var url = "canvas.png";

var canvas, ctx, img;
var TOLERANCE = 0.001;

class Point {
  constructor(x, y) {
    this.x = x|0;
    this.y = y|0;
  }

  static distance(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return math.sqrt(dx*dx + dy*dy);
  }

  static distanceSq(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return (dx*dx + dy*dy);
  }

  static isEqual(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    dx = dx > 0 ? dx : -dx;
    dy = dy > 0 ? dy : -dy;
    return (dx < TOLERANCE) && (dy < TOLERANCE);
  }
}

class Edge {
  constructor(p1, p2) {
    this.vertex = [p1, p2];
    this.first = p1;
    this.second = p2;
  }

  static isEqual(e1, e2) {
    return (Point.isEqual(e1.first, e2.first) && Point.isEqual(e1.second, e2.second)) ||
      (Point.isEqual(e1.second, e2.first) && Point.isEqual(e1.first, e2.second));
  }
}

class Triangle {
  constructor(p1, p2, p3) {
    this.vertex = [p1, p2, p3];
    this.edge = [new Edge(p1, p2), new Edge(p2, p3), new Edge(p1, p3)];

    // Circumcircle center and radius
    /* Find the midpoints and slopes of two sides; Find the equation of their
       perpendicular bisector; Find the point of intersection of those
       bisectors. Then the radius is the distace from the center to any point
    */
    var circle = new Object();
    var mp1x = (p1.x + p2.x)/2;
    var mp1y = (p1.y + p2.y)/2;
    var slope1 = -1*(p2.x - p1.x)/(p2.y - p1.y);
    var mp2x = (p3.x + p2.x)/2;
    var mp2y = (p3.y + p2.y)/2;
    var slope2 = -1*(p2.x - p3.x)/(p2.y - p3.y);
    circle.x = (slope2*mp2x - slope1*mp1x + mp1y - mp2y)/(slope2 - slope1);
    circle.y = mp1y + slope1*(circle.x-mp1x);
    var dx = circle.x - p1.x;
    var dy = circle.y - p1.y;
    circle.radiusSq = (dx*dx + dy*dy);
    this.circle = circle;
  }

}

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  img = new Image();
  img.addEventListener("load", imgLoaded, false);
  img.src = url;
}

function imgLoaded() {
  // Statements to be executed after image is loaded but before it is drawn
  generateDelaunay();
}

function generateDelaunay() {
  var width = canvas.width = img.width;
  var height = canvas.height = img.height;
  ctx.drawImage(img, 0, 0, width, height);

  var imgData = ctx.getImageData(0, 0, width, height);
  var colData = ctx.getImageData(0, 0, width, height).data;


}
