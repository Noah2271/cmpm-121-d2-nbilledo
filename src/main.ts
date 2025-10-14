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
let drawing = false;

if (!context) {
  throw new Error("No Canvas Context");
}

canvas.addEventListener("mousedown", (event) => {
  drawing = true;
  context.beginPath();
  context.moveTo(event.offsetX, event.offsetY);
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
});

canvas.addEventListener("mousemove", (event) => {
  if (drawing) {
    context.lineWidth = 2; // might want to make it so size can change
    context.lineTo(event.offsetX, event.offsetY);
    context.lineCap = "square";
    context.stroke();
  }
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
});

const clear = document.getElementById("clear") as HTMLButtonElement;
clear.addEventListener("click", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
});
