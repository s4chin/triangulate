window.addEventListener('load', init, false);

var url = "https://www.jotform.com/resources/assets/icon/min/jotform-icon-dark-400x400.png";

var canvas, ctx, img;

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
}