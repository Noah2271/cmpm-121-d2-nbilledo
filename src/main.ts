import "./style.css";

// -----------------------  HTML -----------------------
document.body.innerHTML = `
<div class="main-container">
  <h1>WHITEBOARD<h1>
  <canvas id="canvas" width = "1024" height="512"></canvas>
  </br>
  <button id="clear">CLEAR</button>
  <button id="redo" style="background-color: #f8921eff;">REDO</button>
  <button id="undo" style="background-color: #f72314ff;">UNDO</button>
  </br></br><div class = tool-text><p>TOOLS</p></div>
  <button id="toolOne" style="background-color: #8256faff;">THIN MARKER [5PX]</button>
  <button id="toolTwo" style="background-color: #a446fcff;">THICK MARKER [10PX]</button>
  <div class = sticker-button>
  <button id="sticker-1" style="background-color: #000000ff;">😀</button>
  <button id="sticker-2" style="background-color: #050505ff;">⭐</button>
  <button id="sticker-3" style="background-color: #080808ff;">🍀</button>
  </div
  </div>
`;

const undoButton = document.getElementById("undo") as HTMLButtonElement;
const redoButton = document.getElementById("redo") as HTMLButtonElement;
const clearButton = document.getElementById("clear") as HTMLButtonElement;
const thinMarker = document.getElementById("toolOne") as HTMLButtonElement;
const thickMarker = document.getElementById("toolTwo") as HTMLButtonElement;
const stickerButtons = document.querySelectorAll(
  ".sticker-button button",
) as NodeListOf<HTMLButtonElement>;
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d");
if (!context) throw new Error("Canvas not supported");

// ----------------------- Tool Classes -----------------------
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

class ToolCommand { // Consolidated Tool preview, Sticker Preview Class
  private x: number;
  private y: number;
  private strokeWeight?: number;
  private sticker?: string;
  private opacity: number;

  constructor(
    x: number,
    y: number,
    options: { strokeWeight?: number; sticker?: string; opacity?: number } = {},
  ) {
    this.x = x;
    this.y = y;
    this.strokeWeight = options.strokeWeight ?? 0;
    this.sticker = options.sticker ?? "";
    this.opacity = options.opacity ?? 1;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setStrokeWeight(weight: number) {
    this.strokeWeight = weight;
  }

  setSticker(sticker: string) {
    this.sticker = sticker;
  }

  setOpacity(opacity: number) {
    this.opacity = opacity;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.opacity;
    if (this.strokeWeight) { // If strokeweight, brush preview, draw circle at cursor position
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.strokeWeight / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (this.sticker) { // If sticker, sticker preview, draw sticker with low opacity at cursor position
      ctx.font = "30px sans-serif";
      ctx.fillText(this.sticker, this.x, this.y);
    }
    ctx.globalAlpha = 1;
  }
}

// ----------------------- State -----------------------
const strokeArray: (LineCommand | ToolCommand)[] = [];
const redoArray: (LineCommand | ToolCommand)[] = [];
let currentCommand: LineCommand | null = null;
let preview: ToolCommand | null = null;
let markerSize: number = 5;
let drawing = false;
let selectedSticker: string | null = null;

// ----------------------- Redraw Helper -----------------------
function DrawingChanged() {
  canvas.dispatchEvent(new Event("drawing-changed"));
}

canvas.addEventListener("drawing-changed", () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "square";
  context.strokeStyle = "black";

  strokeArray.forEach((command) => {
    if (command instanceof LineCommand) {
      command.display(context);
    } else if (command instanceof ToolCommand) {
      command.draw(context);
    }
  });

  if (!drawing && preview) {
    preview.draw(context);
  }
});

// ----------------------- Mouse Events -----------------------
canvas.addEventListener("mousedown", (event) => {
  if (selectedSticker) { // If sticker, place sticker on mousedown and push to strokeArray for undo
    const sticker = new ToolCommand(event.offsetX, event.offsetY, {
      sticker: selectedSticker,
    });
    strokeArray.push(sticker);
    DrawingChanged();
    return;
  }

  drawing = true; // Else draw stroke and push onto strokeArray for undo
  currentCommand = new LineCommand([event.offsetX, event.offsetY], markerSize);
  strokeArray.push(currentCommand);
  DrawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;

  // Create preview if it doesn't exist yet
  if (!preview) {
    const options = selectedSticker
      ? { sticker: selectedSticker, opacity: 0.5 }
      : { strokeWeight: markerSize };

    preview = new ToolCommand(x, y, options);
  } // Otherwise, just update the preview
  else {
    preview.updatePosition(x, y);

    if (selectedSticker) {
      preview.setSticker(selectedSticker);
      preview.setOpacity(0.5);
    } else {
      preview.setStrokeWeight(markerSize);
      preview.setOpacity(1);
    }
  }

  DrawingChanged();

  // If currently drawing, drag the stroke
  if (drawing && currentCommand) {
    currentCommand.drag(x, y);
    DrawingChanged();
  }
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  currentCommand = null;
});

canvas.addEventListener("mouseleave", () => {
  drawing = false;
  currentCommand = null;
  preview = null; // Hide preview if mouse off canvas
  DrawingChanged();
});

// ----------------------- Buttons -----------------------
clearButton.addEventListener("click", () => {
  strokeArray.length = 0;
  redoArray.length = 0;
  DrawingChanged();
});

undoButton.addEventListener("click", () => {
  const last = strokeArray.pop();
  if (last) redoArray.push(last);
  DrawingChanged();
});

redoButton.addEventListener("click", () => {
  const prev = redoArray.pop();
  if (prev) strokeArray.push(prev);
  DrawingChanged();
});

thinMarker.addEventListener("click", () => {
  markerSize = 5;
  selectedSticker = null;
});

thickMarker.addEventListener("click", () => {
  markerSize = 10;
  selectedSticker = null;
});

stickerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedSticker = button.textContent || null;
    preview = null;
  });
});
