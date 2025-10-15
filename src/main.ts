import "./style.css";

// html
document.body.innerHTML = `
<div class="main-container">
  <h1>WHITEBOARD<h1>
  <canvas id="canvas" width = "1024" height="512"></canvas>
  </br>
  <button id="clear">CLEAR</button>
  <button id="redo" style="background-color: #f8921eff;">REDO</button>
  <button id="undo" style="background-color: #f72314ff;">UNDO</button>
  </br></br>
  <div class = tool-text>
  <p>TOOLS</p>
  </div>
  <button id="toolOne" style="background-color: #8256faff;">THIN MARKER [5PX]</button>
  <button id="toolTwo" style="background-color: #a446fcff;">THICK MARKER [10PX]</button>
  </div>
`;

// get html elements and context
const undoButton = document.getElementById("undo") as HTMLButtonElement;
const redoButton = document.getElementById("redo") as HTMLButtonElement;
const clearButton = document.getElementById("clear") as HTMLButtonElement;
const thinMarker = document.getElementById("toolOne") as HTMLButtonElement;
const thickMarker = document.getElementById("toolTwo") as HTMLButtonElement;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas not supported");

// LineCommand class
class LineCommand {
  private points: [number, number][]; // Create points array to store points in the stroke
  private strokeWeight: number;
  constructor(firstPoint: [number, number], brushSize: number) { // Point of contact
    this.points = [firstPoint];
    this.strokeWeight = brushSize;
  }

  // Appends more points to the stroke as you move the cursor with mousedown
  drag(x: number, y: number) {
    this.points.push([x, y]);
  }

  //
  display(ctx: CanvasRenderingContext2D) {
    if (this.points.length === 0) return;
    ctx.beginPath();
    ctx.lineWidth = this.strokeWeight;
    ctx.moveTo(...(this.points[0] as [number, number]));
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(...(this.points[i] as [number, number]));
    }
    ctx.stroke();
  }
}

const strokeArray: LineCommand[] = [];
const redoArray: LineCommand[] = [];
let currentCommand: LineCommand | null = null;
let markerSize: number = 5;
let drawing = false;

function DrawingChanged() {
  canvas.dispatchEvent(new Event("drawing-changed"));
}

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "square";
  context.strokeStyle = "black";

  strokeArray.forEach((command) => command.display(context)); // Calls display() method for every lineCommand object
});

canvas.addEventListener("mousedown", (event) => {
  console.log(markerSize);
  drawing = true;
  currentCommand = new LineCommand([event.offsetX, event.offsetY], markerSize); // For every new stroke, new LineCommand object to handle said stroke
  strokeArray.push(currentCommand); // Push it for undo
  DrawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  if (!drawing || !currentCommand) return;
  currentCommand.drag(event.offsetX, event.offsetY);
  DrawingChanged();
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
  currentCommand = null;
});

clearButton.addEventListener("click", () => {
  strokeArray.length = 0;
  redoArray.length = 0;
  DrawingChanged();
});

undoButton.addEventListener("click", () => {
  const lastCommand = strokeArray.pop();
  if (lastCommand) {
    redoArray.push(lastCommand);
  }
  DrawingChanged();
});

redoButton.addEventListener("click", () => {
  const previousCommand = redoArray.pop();
  if (previousCommand) {
    strokeArray.push(previousCommand);
  }
  DrawingChanged();
});

thinMarker.addEventListener("click", () => {
  markerSize = 5;
});

thickMarker.addEventListener("click", () => {
  markerSize = 10;
});
