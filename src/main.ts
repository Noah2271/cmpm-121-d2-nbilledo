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
    <button id="export" style="background-color: #00b894;">EXPORT PNG</button>

  </br></br><div class = tool-text><p>TOOLS</p></div>
  <button id="toolOne" style="background-color: #8256faff;">THIN MARKER [5PX]</button>
  <button id="toolTwo" style="background-color: #a446fcff;">THICK MARKER [10PX]</button>
  <div class = sticker-button>
  <button id="sticker-1" style="background-color: #000000ff;">😀</button>
  <button id="sticker-2" style="background-color: #050505ff;">⭐</button>
  <button id="sticker-3" style="background-color: #080808ff;">🍀</button>
  <button id="custom-sticker" style="background-color: #50ac47ff;">Set String Sticker</button>
     <button id="import-sticker" style="background-color: #2081f0;">Import Image Sticker</button>
    <input type="file" id="sticker-upload" accept="image/*" style="display:none;" />
  </div>
</div>
`;

// -----------------------  Buttons -----------------------
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
  private points: [number, number][];
  private strokeWeight: number;
  constructor(firstPoint: [number, number], brushSize: number) {
    this.points = [firstPoint];
    this.strokeWeight = brushSize;
  }

  drag(x: number, y: number) {
    this.points.push([x, y]);
  }

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

class ToolCommand {
  private x: number;
  private y: number;
  private strokeWeight?: number;
  private sticker?: string;
  private stickerImage?: HTMLImageElement | undefined;
  private opacity: number;

  constructor(
    x: number,
    y: number,
    options: {
      strokeWeight?: number;
      sticker?: string;
      opacity?: number;
      stickerImage?: HTMLImageElement | undefined;
    } = {},
  ) {
    this.x = x;
    this.y = y;
    this.strokeWeight = options.strokeWeight ?? 0;
    this.stickerImage = options.stickerImage ?? undefined;
    this.sticker = options.sticker ?? "";
    this.opacity = options.opacity ?? 1;
  }

  updatePosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  set(options: { weight?: number; sticker?: string; opacity?: number }) {
    Object.assign(this, options);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.opacity;
    if (this.strokeWeight) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.strokeWeight / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (this.sticker) {
      ctx.font = "30px sans-serif";
      ctx.fillText(this.sticker, this.x, this.y);
    }
    if (this.stickerImage) {
      const scale = 0.15;
      const width = this.stickerImage.width * scale;
      const height = this.stickerImage.height * scale;
      ctx.drawImage(
        this.stickerImage,
        this.x - width / 2,
        this.y - height / 2,
        width,
        height,
      );
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
let selectedImage: HTMLImageElement | null = null;

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
  if (selectedSticker) {
    const sticker = new ToolCommand(event.offsetX, event.offsetY, {
      sticker: selectedSticker,
    });
    strokeArray.push(sticker);
    DrawingChanged();
    return;
  }

  if (selectedImage) {
    const sticker = new ToolCommand(event.offsetX, event.offsetY, {
      stickerImage: selectedImage,
    });
    strokeArray.push(sticker);
    DrawingChanged();
    return;
  }
  drawing = true;
  currentCommand = new LineCommand([event.offsetX, event.offsetY], markerSize);
  strokeArray.push(currentCommand);
  DrawingChanged();
});

canvas.addEventListener("mousemove", (event) => {
  const x = event.offsetX;
  const y = event.offsetY;

  // If an image sticker is selected, preview it semi-transparently
  if (selectedImage) {
    preview = new ToolCommand(x, y, {
      stickerImage: selectedImage,
      opacity: 0.5,
    });
    DrawingChanged();
    return;
  }

  if (!preview) {
    const options = selectedSticker
      ? { sticker: selectedSticker, opacity: 0.5 }
      : { strokeWeight: markerSize };
    preview = new ToolCommand(x, y, options);
  } else {
    preview.updatePosition(x, y);
    if (selectedSticker) {
      preview.set({ opacity: 0.5, sticker: selectedSticker });
    } else {
      preview.set({ opacity: 1, weight: markerSize });
    }
  }

  DrawingChanged();

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
  preview = null;
  DrawingChanged();
});

// ----------------------- Button Actions -----------------------
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
  selectedImage = null;
});

thickMarker.addEventListener("click", () => {
  markerSize = 10;
  selectedSticker = null;
  selectedImage = null;
});

stickerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.id == "custom-sticker") {
      const response = prompt("Enter sticker content:");
      selectedSticker = response;
      selectedImage = null;
    } else if (button.id === "import-sticker") {
      // handled below
    } else {
      selectedSticker = button.textContent || null;
      selectedImage = null;
      preview = null;
    }
  });
});

// ----------------------- Import Sticker -----------------------
const importButton = document.getElementById(
  "import-sticker",
) as HTMLButtonElement;
const fileInput = document.getElementById("sticker-upload") as HTMLInputElement;

importButton.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      selectedSticker = null;
      selectedImage = img;
      preview = null;
    };
  };
  reader.readAsDataURL(file);
});

// ----------------------- Export Image -----------------------
const exportButton = document.getElementById("export") as HTMLButtonElement;

exportButton.addEventListener("click", () => {
  const scale = 2;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * scale;
  exportCanvas.height = canvas.height * scale;
  const exportContext = exportCanvas.getContext("2d")!;
  exportContext.scale(scale, scale);
  strokeArray.forEach((command) => {
    if (command instanceof LineCommand) {
      command.display(exportContext);
    } else if (command instanceof ToolCommand) {
      command.draw(exportContext);
    }
  });

  const dataURL = exportCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "whiteboard.png";
  link.click();
});
