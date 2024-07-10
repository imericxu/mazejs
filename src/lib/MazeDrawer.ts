import colors from "tailwindcss/colors";
import { match } from "ts-pattern";
import { AnimationPromise } from "./AnimationPromise";
import { type MazeCell } from "./MazeCell";
import { type MazeDimensions, type MazeEvent } from "./MazeController";
import {
  type RectSize,
  type Coord,
  type GridSize,
  type Idx2d,
} from "./twoDimens";
import { clamp, easeOutQuad, type Direction } from "./utils";

/** Colors used by the renderer. */
const COLOR = {
  empty: colors.blue[500],
  partial: colors.blue[300],
  solid: colors.blue[50],
  path: colors.slate[700],
  partialPath: "#33415566" /* colors.slate[700] / 40 */,
  start: colors.amber[500],
  end: colors.fuchsia[500],
} as const;

export default class MazeDrawer {
  public static readonly ALLOWED_VALUES = {
    cellWallRatio: { min: 0.1, max: 5 },
    zoomLevel: [0.25, 0.5, 1],
  } as const;
  public static readonly DEFAULT_VALUES = {
    cellWallRatio: 4,
    zoomLevel: 1,
  } as const;

  /////////////////////////////////////
  // Fields
  /////////////////////////////////////

  /** Whether to use the hidden canvas rendering context. */
  public useHiddenCtx: boolean = false;
  /** Ratio of cell width to vertical wall width. */
  public cellWallRatio: number = MazeDrawer.DEFAULT_VALUES.cellWallRatio;

  public lastEvent: MazeEvent | null = null;
  public maze: MazeCell[][] | null = null;
  public startEnd: [MazeCell, MazeCell] | null = null;
  public path: readonly Readonly<MazeCell>[] | null = null;
  public isComplete: boolean = false;
  public changeList: Readonly<MazeCell>[] = [];
  public shouldDraw: boolean = true;

  /** Dimensions of the maze. */
  private gridSize: Readonly<GridSize>;
  /** Zoom level of the maze. */
  private zoomLevel: number = MazeDrawer.DEFAULT_VALUES.zoomLevel;

  /** The canvas rendering context. */
  private visibleCtx: CanvasRenderingContext2D;
  /** The hidden canvas rendering context for offscreen rendering. */
  private hiddenCtx: OffscreenCanvasRenderingContext2D;

  private sweepAnimations = new Set<AnimationPromise>();

  /////////////////////////////////////
  // Constructor
  /////////////////////////////////////

  /**
   * @param ctx - The canvas rendering context. The canvas should have a CSS
   * width as well as a width and height attribute (set to 0 initially).
   * @param initialGridSize - The inital dimensions of the maze.
   * @param setContainerSize - Callback to set the container size. Has to set
   * programmatically for CSS transitions to work.
   */
  constructor(
    ctx: CanvasRenderingContext2D,
    initialGridSize: Readonly<GridSize>,
    private setContainerSize: (size: RectSize) => void,
  ) {
    this.visibleCtx = ctx;
    const hiddenCanvas = document.createElement("canvas");
    this.hiddenCtx = match(
      hiddenCanvas
        .transferControlToOffscreen()
        .getContext("2d", { willReadFrequently: true }),
    )
      .with(null, () => {
        throw new Error("Failed to create offscreen canvas.");
      })
      .otherwise((ctx) => ctx);
    this.gridSize = initialGridSize;
    this.resize({ ...this.gridSize, cellWallRatio: this.cellWallRatio });
  }

  /////////////////////////////////////
  // Getters and Setters
  /////////////////////////////////////

  /**
   * The visible or hidden canvas rendering context depending on whether
   * `useHiddenCtx` is true.
   */
  private get ctx():
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D {
    return this.useHiddenCtx ? this.hiddenCtx : this.visibleCtx;
  }

  /** Width of the canvas. */
  private get width(): number {
    return this.ctx.canvas.width;
  }

  /** Sets the width of both canvases. */
  private set width(value: number) {
    this.visibleCtx.canvas.width = value;
    this.hiddenCtx.canvas.width = value;
  }

  /** Height of the canvas. */
  private get height(): number {
    return this.ctx.canvas.height;
  }

  /** Sets the height of both canvases. */
  private set height(value: number) {
    this.visibleCtx.canvas.height = value;
    this.hiddenCtx.canvas.height = value;
  }

  /** Width of cell + vertical wall */
  private get fullSize(): number {
    return Math.max(2, Math.round(16 * this.zoomLevel));
  }

  /** Width of a vertical wall. */
  private get wallSize(): number {
    return clamp(
      Math.round(this.fullSize / (this.cellWallRatio + 1)),
      1,
      this.fullSize - 1,
    );
  }

  /** Width/height of a cell. */
  private get cellSize(): number {
    return this.fullSize - this.wallSize;
  }

  /////////////////////////////////////
  // Public Methods
  /////////////////////////////////////

  /** Updates the renderer and canvas with the new size. */
  public resize(dims: Readonly<MazeDimensions>): void {
    this.animateFloodFill(null);
    this.gridSize = dims;
    this.cellWallRatio = dims.cellWallRatio;
    this.updateCanvasSize();
    this.setContainerSize({ width: this.width, height: this.height });
    this.visibleCtx.canvas.style.width = `${this.width}px`;
    this.visibleCtx.canvas.style.height = `${this.height}px`;
    this.fillWithWall();
  }

  public zoomTo(zoomLevel: number): void {
    this.zoomLevel = zoomLevel;
    this.updateCanvasSize();
    const redraw = () => {
      this.ctx.fillStyle = COLOR.empty;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.isComplete = true;
      this.draw();
      this.isComplete = false;
    };
    redraw();
    this.setContainerSize({ width: this.width, height: this.height });
    this.visibleCtx.canvas.style.width = `${this.width}px`;
    this.visibleCtx.canvas.style.height = `${this.height}px`;
    redraw();
  }

  /** Returns a promise that resolves when the animations are done. */
  public async waitForSweepAnimations(): Promise<void> {
    await Promise.all(Array.from(this.sweepAnimations).map((a) => a.promise));
  }

  /** Cancels all sweep animations. */
  public stopSweepAnimations(): void {
    this.sweepAnimations.forEach((animation) => animation.cancel());
  }

  public fillWithWall(): void {
    this.animateDoubleFloodFill(null, COLOR.empty);
  }

  /**
   * Double sweep the canvas from left to right with the hidden canvas and the
   * wall/empty color.
   * @param durationMs Duration of the animation in milliseconds.
   */
  public animateCanvasCopyFill(
    durationMs: number = 400,
    delayMs: number = 100,
  ): void {
    let drawnWidth = 0;
    const image: ImageData = this.hiddenCtx.getImageData(
      0,
      0,
      this.width,
      this.height,
    );
    const animation = new AnimationPromise(
      (_, timeSinceStartMs: number) => {
        const colorWidth: number = Math.round(
          easeOutQuad(timeSinceStartMs, durationMs - delayMs, 0, this.width),
        );
        const imageWidth: number = Math.round(
          easeOutQuad(timeSinceStartMs, durationMs, 0, this.width),
        );

        this.ctx.fillStyle = COLOR.empty;
        this.ctx.fillRect(0, 0, colorWidth, this.height);

        this.ctx.putImageData(image, 0, 0, 0, 0, imageWidth, this.height);

        drawnWidth = imageWidth;
      },
      () => drawnWidth === this.width,
    );
    this.sweepAnimations.add(animation);
    animation.start();
    animation.promise.then(() => {
      this.sweepAnimations.delete(animation);
    });
  }

  /** Draws the current state of the maze. */
  public draw(): void {
    if (this.maze === null || !this.shouldDraw) {
      this.ctx.fillStyle = COLOR.empty;
      this.ctx.fillRect(0, 0, this.width, this.height);
      return;
    }

    if (this.lastEvent === "generate") {
      if (this.isComplete) {
        this.drawMaze();
      } else {
        this.drawModifiedCells();
      }
      return;
    }

    if (this.lastEvent === "solve") {
      if (this.isComplete) {
        this.drawMaze();
        this.drawStartEnd();
        this.drawPath(false);
      } else {
        this.drawModifiedCells();
        this.drawStartEnd();
        this.drawPath(true);
      }
      return;
    }

    throw new Error("Invalid maze event");
  }

  /**
   * Draw only the modified cells and their walls.
   *
   * Comparable to a dirty rect update.
   */
  private drawModifiedCells(): void {
    for (const cell of this.changeList) {
      this.fillCell(cell);
      this.drawCellWalls(cell);
    }
    this.changeList = [];
  }

  /**
   * Draws the maze assuming the maze is complete.
   *
   * - `this.maze` must not be null.
   * - Clears the canvas and draws the maze from scratch.
   */
  private drawFinishedMaze(): void {
    if (this.maze === null) throw new Error();
    // Fill the canvas with empty color
    const ctx = this.ctx;
    this.ctx.fillStyle = COLOR.empty;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw from top to bottom, left to right
    ctx.fillStyle = COLOR.solid;
    for (let row = 0; row < this.gridSize.rows; ++row) {
      for (let col = 0; col < this.gridSize.cols; ++col) {
        const cell: Readonly<MazeCell> = this.maze[row][col];
        this.fillCell(cell);
        // Clear the right wall if connected
        if (
          col !== this.gridSize.cols - 1 &&
          // Can't call `includes` with `readonly` for some reason
          cell.connections.includes(this.maze[row][col + 1] as MazeCell)
        ) {
          this.drawWall(cell, "right");
        }
        // Clear the bottom wall if connected
        if (
          row !== this.gridSize.rows - 1 &&
          cell.connections.includes(this.maze[row + 1][col] as MazeCell)
        ) {
          this.drawWall(cell, "down");
        }
      }
    }
  }

  /**
   * Draws the maze assuming the maze is incomplete.
   */
  private drawMaze(): void {
    if (this.maze === null) throw new Error();
    // Fill the canvas with empty color
    const ctx = this.ctx;
    ctx.fillStyle = COLOR.empty;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw from top to bottom, left to right
    for (let row = 0; row < this.gridSize.rows; ++row) {
      for (let col = 0; col < this.gridSize.cols; ++col) {
        const cell: Readonly<MazeCell> = this.maze[row][col];
        this.fillCell(cell);
        // Draw right wall
        if (col !== this.gridSize.cols - 1) {
          ctx.fillStyle = this.determineWallColor(
            cell,
            this.maze[row][col + 1],
          );
          this.drawWall(cell, "right");
        }
        // Draw bottom wall
        if (row !== this.gridSize.rows - 1) {
          ctx.fillStyle = this.determineWallColor(
            cell,
            this.maze[row + 1][col],
          );
          this.drawWall(cell, "down");
        }
      }
    }
  }

  private drawPath(isPartial: boolean): void {
    if (this.path === null || this.path.length <= 1) return;
    const halfCellSize: number = this.cellSize / 2;

    const calcPathCoord = (pathCell: Readonly<MazeCell>): Coord => {
      const topLeft: Coord = this.calcCellTopLeft(pathCell);
      return {
        x: topLeft.x + halfCellSize,
        y: topLeft.y + halfCellSize,
      };
    };

    this.ctx.beginPath();
    let coord: Coord = calcPathCoord(this.path[0]);
    this.ctx.moveTo(coord.x, coord.y);
    coord = calcPathCoord(this.path[1]);
    this.ctx.lineTo(coord.x, coord.y);
    this.ctx.strokeStyle = COLOR.path;
    this.ctx.stroke();

    this.ctx.beginPath();
    for (let i = 0; i < this.path.length; ++i) {
      coord = calcPathCoord(this.path[i]);
      if (i === 0) {
        this.ctx.moveTo(coord.x, coord.y);
      } else {
        this.ctx.lineTo(coord.x, coord.y);
      }
    }
    this.ctx.strokeStyle = isPartial ? COLOR.partialPath : COLOR.path;
    this.ctx.lineWidth =
      this.cellWallRatio < 1
        ? Math.ceil(this.cellSize * 0.8)
        : Math.max(1, Math.round(this.cellSize * 0.2));
    this.ctx.stroke();
  }

  private drawStartEnd(): void {
    if (this.startEnd === null) throw Error();
    this.drawStartEndCell(this.startEnd[0], true);
    this.drawStartEndCell(this.startEnd[1], false);
  }

  /**
   * Fill the canvas from left to right.
   * @param color Color to fill with. If null, clears the canvas.
   * @param durationMs Duration of the animation in milliseconds.
   */
  private animateFloodFill(
    color: string | null = null,
    durationMs: number = 400,
  ): void {
    let drawnWidth = 0;
    const animation = new AnimationPromise(
      (_, timeSinceStartMs: number) => {
        const drawWidth: number = Math.round(
          easeOutQuad(timeSinceStartMs, durationMs, 0, this.width),
        );
        if (color === null) {
          this.ctx.clearRect(0, 0, drawWidth, this.height);
        } else {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(0, 0, drawWidth, this.height);
        }
        drawnWidth = drawWidth;
      },
      () => drawnWidth === this.width,
    );
    this.sweepAnimations.add(animation);
    animation.start();
    animation.promise.then(() => {
      this.sweepAnimations.delete(animation);
    });
  }

  /**
   * Similar to sweepFill, but with two colors in close succession.
   * @param color1 First color to fill with. If null, clears the canvas.
   * @param color2 Second color to fill with. If null, clears the canvas.
   * @param durationMs Duration of the animation in milliseconds.
   */
  private animateDoubleFloodFill(
    color1: string | null = null,
    color2: string | null = null,
    durationMs: number = 400,
    delayMs: number = 100,
  ): void {
    let drawnWidth = 0;
    const animation = new AnimationPromise(
      (_, timeSinceStartMs: number) => {
        const drawWidth1: number = Math.round(
          easeOutQuad(timeSinceStartMs, durationMs - delayMs, 0, this.width),
        );
        const drawWidth2: number = Math.round(
          easeOutQuad(timeSinceStartMs, durationMs, 0, this.width),
        );

        const batch: [string | null, number][] = [
          [color1, drawWidth1],
          [color2, drawWidth2],
        ];
        for (const [color, width] of batch) {
          if (color === null) {
            this.ctx.clearRect(0, 0, width, this.height);
          } else {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(0, 0, width, this.height);
          }
        }

        drawnWidth = drawWidth2;
      },
      () => drawnWidth === this.width,
    );
    this.sweepAnimations.add(animation);
    animation.start();
    animation.promise.then(() => {
      this.sweepAnimations.delete(animation);
    });
  }

  /**
   * Draws the given cell.
   */
  private fillCell(
    cell: Readonly<MazeCell>,
    color: string | null = null,
  ): void {
    const topLeft: Coord = this.calcCellTopLeft(cell.idx2d);
    this.ctx.fillStyle =
      color === null
        ? match(cell.state)
            .with("empty", () => COLOR.empty)
            .with("partial", () => COLOR.partial)
            .with("solid", () => COLOR.solid)
            .exhaustive()
        : color;
    this.ctx.fillRect(topLeft.x, topLeft.y, this.cellSize, this.cellSize);
  }

  /**
   * Draws all the walls between the given cell and its neighbors.
   */
  private drawCellWalls(cell: Readonly<MazeCell>): void {
    for (const neighbor of cell.neighbors) {
      this.ctx.fillStyle = this.determineWallColor(cell, neighbor);
      this.drawWall(cell, this.determineDirection(cell, neighbor));
    }
  }

  /**
   * @param cell - Cell to draw a wall on.
   * @param side - Side of the cell to draw a wall on.
   */
  private drawWall(cell: Readonly<MazeCell>, side: Direction): void {
    const { x, y }: Coord = this.calcCellTopLeft(cell.idx2d);
    match(side)
      .with("up", () => {
        this.ctx.fillRect(x, y - this.wallSize, this.cellSize, this.wallSize);
      })
      .with("right", () => {
        this.ctx.fillRect(x + this.cellSize, y, this.wallSize, this.cellSize);
      })
      .with("down", () => {
        this.ctx.fillRect(x, y + this.cellSize, this.cellSize, this.wallSize);
      })
      .with("left", () => {
        this.ctx.fillRect(x - this.wallSize, y, this.wallSize, this.cellSize);
      })
      .exhaustive();
  }

  private drawStartEndCell(cell: Readonly<MazeCell>, isStart: boolean): void {
    const center: Coord = this.calcCellCenter(cell.idx2d);
    const width: number = Math.max(
      this.cellSize,
      Math.round(this.fullSize * 0.75),
    );
    this.ctx.fillStyle = isStart ? COLOR.start : COLOR.end;
    this.ctx.fillRect(
      center.x - Math.round(width / 2),
      center.y - Math.round(width / 2),
      width,
      width,
    );
  }

  private updateCanvasSize(): void {
    const cellSize: number = this.cellSize;
    const wallSize: number = this.wallSize;
    this.width =
      this.gridSize.cols * cellSize + (this.gridSize.cols + 1) * wallSize;
    this.height =
      this.gridSize.rows * cellSize + (this.gridSize.rows + 1) * wallSize;
  }

  private determineWallColor(
    cell: Readonly<MazeCell>,
    neighbor: Readonly<MazeCell>,
  ): string {
    if (!cell.connections.includes(neighbor as MazeCell)) return COLOR.empty;

    if (this.lastEvent === "solve") {
      return match([cell.state, neighbor.state])
        .when(
          (states) => states.includes("solid"),
          () => COLOR.solid,
        )
        .otherwise(() => COLOR.partial);
    } else {
      return match([cell.state, neighbor.state])
        .when(
          (states) => states.includes("partial"),
          () => COLOR.partial,
        )
        .otherwise(() => COLOR.solid);
    }
  }

  /**
   * Determines the direction from `cell` to `neighbor`.
   */
  private determineDirection(
    cell: Readonly<MazeCell>,
    neighbor: Readonly<MazeCell>,
  ): Direction {
    return match([neighbor.row - cell.row, neighbor.col - cell.col])
      .returnType<Direction>()
      .with([-1, 0], () => "up")
      .with([1, 0], () => "down")
      .with([0, -1], () => "left")
      .with([0, 1], () => "right")
      .otherwise(() => {
        throw Error("Invalid distance from neighbor!");
      });
  }

  /**
   * Calculate the coordinates of the top-left corner of the cell.
   * @param row - Row index of the cell.
   * @param col - Column index of the cell.
   */
  private calcCellTopLeft({ row, col }: Idx2d): Coord {
    const wallSize: number = this.wallSize;
    const fullSize: number = this.cellSize + wallSize;
    return {
      x: fullSize * col + wallSize,
      y: fullSize * row + wallSize,
    };
  }

  private calcCellCenter({ row, col }: Idx2d): Coord {
    const halfCellSize: number = Math.round(this.cellSize / 2);
    const wallSize: number = this.wallSize;
    const fullSize: number = this.cellSize + wallSize;
    return {
      x: fullSize * col + wallSize + halfCellSize,
      y: fullSize * row + wallSize + halfCellSize,
    };
  }
}
