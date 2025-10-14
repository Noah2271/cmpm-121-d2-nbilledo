import "./style.css";

document.body.innerHTML = `
<div class="main-container">
  <h1>WHITEBOARD<h1>
  <canvas id="canvas" width = "256" height="256"></canvas>
  </br>
  <button id="clear">CLEAR</button>
  <button id="redo" style="background-color: #f8921eff;">REDO</button>
  <button id="undo" style="background-color: #f72314ff;">UNDO</button>
  </div>
`;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas not supported");

type Point = { x: number; y: number };
const strokeArray: Point[][] = []; // Store array of arrays full of points
let currentStroke: Point[] = []; // Store points of current stroke
let drawing = false;

function DrawingChanged() { // Function for dispatching specified drawing-changed event
  canvas.dispatchEvent(new Event("drawing-changed"));
}

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

  context.lineWidth = 5; // might want to make it so user can change this
  context.lineCap = "square";
  context.strokeStyle = "black";

  strokeArray.forEach((stroke) => { // redraw it
    if (stroke.length < 2) return;

    context.beginPath();
    context.moveTo(stroke[0]!.x, stroke[0]!.y);

    for (let i = 1; i < stroke.length; i++) {
      context.lineTo(stroke[i]!.x, stroke[i]!.y);
    }

    context.stroke();
  });
});

// ======= Mouse events =======
canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  currentStroke = [{ x: event.offsetX, y: event.offsetY }];
  strokeArray.push(currentStroke);
  DrawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  if (!drawing) return;
  currentStroke.push({ x: event.offsetX, y: event.offsetY });
  DrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
});

const clearButton = document.getElementById("clear") as HTMLButtonElement;
clearButton.addEventListener("click", () => {
  strokeArray.length = 0; // clear all strokes
  DrawingChanged();
});
