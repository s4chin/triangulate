window.addEventListener('load', init, false);

var url = "canvas.png";

var canvas, ctx, img, image;
var TOLERANCE = 0.001;
var BLUR_SIZE = 5;
var EDGE_SIZE = 7;
var EDGE_THRESHOLD = 50;
var POINT_RATE = 0.0005;
var MAX_POINTS = 5000;

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

class Delaunay {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.triangles = [];
    this.init();
  }

  init() {
    var p1 = new Point(0, 0);
    var p2 = new Point(this.width, 0);
    var p3 = new Point(0, this.height);
    var p4 = new Point(this.width, this.height);
    this.triangles = [
      new Triangle(p1, p2, p3),
      new Triangle(p2, p3, p4)
    ]
  }

  // points is an array of Point objects
  insert(points) {
    var i, j, passtri, edges, edge, dup, x, y, shape;
    var triangles, triangle, circle, dx, dy, distSq;
    for(i = 0; i < points.length; i++) {
      x = points[i].x;
      y = points[i].y;

      triangles = this.triangles;
      passtri = [];
      edges = [];

      // Separate the existing triangles into those in which the point lies
      // within the circumcircle and those without
      for(j = 0; j < triangles.length; j++) {
        triangle = triangles[j];
        circle = triangle.circle;
        dx = x - circle.x;
        dy = y - circle.y;
        distSq = dx*dx + dy*dy;
        if(circle.radiusSq < distSq) {
          passtri.push(triangle);
        } else {
          Array.prototype.push.apply(edges, triangle.edge);
        }
      }

      // Remove common edges between the triangles
      shape = [];
      for(i = 0; i < edges.length; i++) {
        dup = false;
        edge = edges[i];
        for(j = 0; j < shape.length; j++) {
          if(Edge.isEqual(edge, shape[j])) {
            shape.splice(j, 1);
            dup = true;
            break;
          }
        }
        if(!dup) {
          shape.push(edge);
        }
      }

      // Add new triangles from the point to each edge
      for(i = 0; i < shape.length; i++) {
        edge = shape[i];
        passtri.push(new Triangle(edge.first, edge.second, new Point(x, y)));
      }
      this.triangles = passtri;
    }
    return this.triangles;
  }
}

var Filters = {
  // Replaces R with gray value
  grayFilterF: function(imageData) {
    var width = imageData.width;
    var height = imageData.height;
    var data = imageData.data;
    var gray;

    // data is a 1D array of RGBA values of pixels
    for(row = 0; row < height; row++) {

      jump = row*width;
      for(col = 0; col < width; col++) {
        i = (jump + col) << 2;
        r = data[i];
        g = data[i+1];
        b = data[i+2];
        gray = 0.299*r + 0.587*g + 0.114*b;
        data[i] = gray;
        // data[i+1] = gray;
        // data[i+2] = gray;
      }
    }
  },

  // Taken directly from here - http://jsdo.it/akm2/iMsL
  convFilterF: function(matrix, imageData, divisor) {
      matrix  = matrix.slice();
      divisor = divisor || 1;

      var divscalar = divisor ? 1 / divisor : 0;
      var k, len;
      if (divscalar !== 1) {
          for (k = 0, len = matrix.length; k < matrix.length; k++) {
              matrix[k] *= divscalar;
          }
      }

      var data = imageData.data;

      len = data.length >> 2;
      var copy = new Uint8Array(len);
      for (i = 0; i < len; i++) copy[i] = data[i << 2];

      var width  = imageData.width | 0;
      var height = imageData.height | 0;
      var size  = Math.sqrt(matrix.length);
      var range = size * 0.5 | 0;

      var x, y;
      var r, g, b, v;
      var col, row, sx, sy;
      var i, istep, jstep, kstep;

      for (y = 0; y < height; y++) {
          istep = y * width;

          for (x = 0; x < width; x++) {
              r = g = b = 0;

              for (row = -range; row <= range; row++) {
                  sy = y + row;
                  jstep = sy * width;
                  kstep = (row + range) * size;

                  if (sy >= 0 && sy < height) {
                      for (col = -range; col <= range; col++) {
                          sx = x + col;

                          if (
                              sx >= 0 && sx < width &&
                              (v = matrix[(col + range) + kstep])
                          ) {
                              r += copy[sx + jstep] * v;
                          }
                      }
                  }
              }

              if (r < 0) r = 0; else if (r > 255) r = 255;

              data[(x + istep) << 2] = r & 0xFF;
          }
      }

      return imageData;
  },
}

// Box blur
// TODO: Add Gaussian blur to see results
var blur = (function() {
  var i;
  var blur = [];
  for(i = 0; i < BLUR_SIZE*BLUR_SIZE; i++) {
    blur.push(1);
  }
  return blur;
})();

// Edge filter
var edge = (function() {
  var edge = [];
  var len = EDGE_SIZE*EDGE_SIZE;
  for(i = 0; i < len; i++) {
    edge.push(1);
  }
  edge[len >> 1] = 1 - len;
  return edge;
})();

function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  img = new Image();
  img.addEventListener("load", imgLoaded, false);
  img.src = url;
  generateDelaunay();
}

function imgLoaded() {
  // Statements to be executed after image is loaded but before it is drawn
}

function generateDelaunay() {
  var width = canvas.width = img.width;
  var height = canvas.height = img.height;
  ctx.drawImage(img, 0, 0, width, height);

  var imgData = ctx.getImageData(0, 0, width, height);
  var colData = ctx.getImageData(0, 0, width, height).data;

  Filters.grayFilterF(imgData);
  Filters.convFilterF(blur, imgData, blur.length);
  Filters.convFilterF(edge, imgData);

  var points = getPoints(imgData);
  /* We got ALL the points comprising the edge, to form traingles we need much
     lesser number of points, i.e. points.length*POINT_RATE. Also, we do not
     want the number of points to exceed MAX_POINTS as the triangulation will
     take more time */
  var limit = points.length*POINT_RATE;
  if(limit > MAX_POINTS) {
    limit = MAX_POINTS
  }
  // points = removePoints(points, limit);
  console.log(points.length);
  ctx.putImageData(imgData, 0, 0);

  var delaunay = new Delaunay(width, height);
  var triangles = delaunay.insert(points);
  console.log(triangles);
  ctx.fillRect(10, 10, 55, 50);
}

function removePoints(points, limit) {
  var len = points.length;
  while(len > limit) {
    points.splice(Math.floor(Math.random()*len), 1);
    len--;
  }
  return points;
}

function getPoints(imageData) {
  var row, col, i, j, sum, total, jump;
  var points = [];
  var width = imageData.width;
  var height = imageData.height;
  var data = imageData.data;
  for(row = 0; row < height; row++) {
    for(col = 0; col < width; col++) {
      sum = 0;
      for(i = -1; i <= 1; i++) {
        if(row + i < height && row + i > 0) {
          jump = (row + i)*width;
          for(j = -1; j <=1; j++) {
            if(col + j < width && col + j > 0) {
              x = (jump + (col + j)) << 2;
              sum += data[x];
              total = 0;
            }
          }
        }
      }
      if(sum/total > EDGE_THRESHOLD)
        points.push(new Point(col, row));
    }
  }
  return points;
}
