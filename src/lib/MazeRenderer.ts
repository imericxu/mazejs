import { match } from "ts-pattern";
import {
  type GeneratingAlgorithm,
  type SolvingAlgorithm,
} from "./algorithms/algorithmTypes";
import { Backtracking } from "./algorithms/generating/Backtracking";
import { Prims } from "./algorithms/generating/Prims";
import { MazeCell } from "./MazeCell";
import { clamp, deepEqual, Direction, easeOutQuad } from "./utils";
import { Wilsons } from "./algorithms/generating/Wilsons";
import { Idx2d, Point as Coord } from "./twoDimens";
import { AnimationPromise } from "./AnimationPromise";
import { Mutex } from "async-mutex";
import colors from "tailwindcss/colors";

export type MazeZoomLevel = 1 | 0.5 | 0.25;

export interface MazeDimensions {
  rows: number;
  cols: number;
  /**
   * Width of cell vs wall.
   *
   * E.g., 0.5 means a cell is half the width of a wall.
   */
  cellWallRatio: number;
  zoomLevel: MazeZoomLevel;
}

export interface MazeSettings {
  dimensions: MazeDimensions;
  generatingAlgorithm?: GeneratingAlgorithm;
  doAnimateGenerating: boolean;
  solvingAlgorithm?: SolvingAlgorithm;
  doAnimateSolving: boolean;
}

export class MazeRenderer {
  /** Range of rows/cols allowed. */
  static SIZE_RANGE = {
    min: 3,
    max: 800,
  } as const;

  /** Default settings. */
  static DEFAULTS: MazeSettings = {
    dimensions: {
      rows: 20,
      cols: 20,
      cellWallRatio: 4.0,
      zoomLevel: 1,
    },
    doAnimateGenerating: true,
    doAnimateSolving: true,
  } as const;

  static Color = {
    cellEmpty: colors.blue[500],
    cellPartial: colors.blue[300],
    cellSolid: colors.blue[50],
  } as const;

  /** Size of cell + wall. */
  private static FULL_SIZE: number = 12;

  set dimensions(value: MazeDimensions) {
    this._dimensions = value;
    this.wallSize = this.calcWallSize();
    this.cellSize = MazeRenderer.FULL_SIZE - this.wallSize;
  }

  private _ctx: CanvasRenderingContext2D;
  private hiddenCtx: CanvasRenderingContext2D;
  private useHiddenCanvas: boolean = false;
  private mutex = new Mutex();
  private sweepAnimations = new Set<AnimationPromise>();
  // Needs to be a set b/c of race conditions
  private mazeAnimations = new Set<AnimationPromise>();
  private isCanvasEmpty = true;
  private maze: MazeCell[][] | null = null;
  private wallSize: number;
  private cellSize: number;
  private _dimensions: MazeDimensions = MazeRenderer.DEFAULTS.dimensions;

  private get ctx(): CanvasRenderingContext2D {
    return this.useHiddenCanvas ? this.hiddenCtx : this._ctx;
  }

  private get width(): number {
    return this.ctx.canvas.width;
  }

  private set width(value: number) {
    this.ctx.canvas.width = value;
    this.hiddenCtx.canvas.width = value;
  }

  private get height(): number {
    return this.ctx.canvas.height;
  }

  private set height(value: number) {
    this.ctx.canvas.height = value;
    this.hiddenCtx.canvas.height = value;
  }

  private get rows(): number {
    return this._dimensions.rows;
  }

  private get cols(): number {
    return this._dimensions.cols;
  }

  private get cellWallRatio(): number {
    return this._dimensions.cellWallRatio;
  }

  constructor(ctx: CanvasRenderingContext2D) {
    this._ctx = ctx;
    this.wallSize = this.calcWallSize();
    this.cellSize = MazeRenderer.FULL_SIZE - this.wallSize;
    // Prevent animations from running when performing the initial resize
    this.resize();
    // Create hidden canvas
    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.position = "absolute";
    canvas.style.display = "none";
    this.hiddenCtx = canvas.getContext("2d", { willReadFrequently: true })!;
  }

  async generateMaze(options: MazeSettings): Promise<void> {
    if (!deepEqual(this._dimensions, options.dimensions)) {
      this.dimensions = options.dimensions;
      await this.resize();
    }

    await this.stopMazeAnimation();
    const alg = new Wilsons({ rows: this.rows, cols: this.cols });
    this.maze = alg.maze;

    if (options.doAnimateGenerating) {
      // Do a sweep animation if the resize didn't already do one
      if (!this.isCanvasEmpty) {
        await this.doubleSweepFill(
          MazeRenderer.Color.cellPartial,
          MazeRenderer.Color.cellEmpty,
        );
        this.isCanvasEmpty = true;
      }
      // Dynamically decide the number of steps to take based on total number
      // of cells. Increases exponentially with number of cells.
      const steps: number = Math.round(
        clamp(
          Math.pow(this.rows * this.cols, 0.6) * 0.1,
          1,
          this.rows * this.cols * 0.2,
        ),
      );
      // Define the animation
      const animation = new AnimationPromise(
        () => {
          const modifiedCells: Readonly<MazeCell>[] = [];
          for (let i = 0; i < steps; i++) {
            const cells = alg.step();
            modifiedCells.push(...cells);
          }
          this.drawModifiedCells(modifiedCells);
        },
        () => {
          if (alg.finished) {
            this.drawMaze();
            return true;
          }
          return false;
        },
        60,
      );
      this.mutex.runExclusive(async () => {
        await this.waitForSweepAnimations();
        await this.stopAllAnimations();
        // Clear the canvas
        this.ctx.fillStyle = MazeRenderer.Color.cellEmpty;
        this.ctx.fillRect(0, 0, this.width, this.height);
        // Start the animation
        this.mazeAnimations.add(animation);
        animation.start();
        animation.promise.then(() => {
          this.mazeAnimations.delete(animation);
        });
      });
    } else {
      alg.finish();
      // Draw on the hidden canvas
      this.mutex.runExclusive(() => {
        this.useHiddenCanvas = true;
        this.drawMaze();
        this.useHiddenCanvas = false;
        this.canvasCopyFill();
      });
    }
    this.isCanvasEmpty = false;
  }

  async solveMaze(options: MazeSettings): Promise<void> {}

  /**
   * Empties the canvas and stops all animations.
   */
  async clear(): Promise<void> {
    await this.stopAllAnimations();
    await this.sweepFill(MazeRenderer.Color.cellEmpty);
  }

  /**
   * Fill the canvas from left to right.
   * @param color Color to fill with. If null, clears the canvas.
   * @param durationMs Duration of the animation in milliseconds.
   */
  private async sweepFill(
    color: string | null = null,
    durationMs: number = 400,
  ): Promise<void> {
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
    await animation.promise;
    this.sweepAnimations.delete(animation);
  }

  /**
   * Similar to sweepFill, but with two colors in close succession.
   * @param color1 First color to fill with. If null, clears the canvas.
   * @param color2 Second color to fill with. If null, clears the canvas.
   * @param durationMs Duration of the animation in milliseconds.
   */
  private async doubleSweepFill(
    color1: string | null = null,
    color2: string | null = null,
    durationMs: number = 400,
    delayMs: number = 100,
  ): Promise<void> {
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
    await animation.promise;
    this.sweepAnimations.delete(animation);
  }

  /**
   * Double sweep the canvas from left to right with the hidden canvas and the
   * wall/empty color.
   * @param durationMs Duration of the animation in milliseconds.
   */
  private async canvasCopyFill(
    durationMs: number = 400,
    delayMs: number = 100,
  ): Promise<void> {
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

        this.ctx.fillStyle = MazeRenderer.Color.cellEmpty;
        this.ctx.fillRect(0, 0, colorWidth, this.height);

        this.ctx.putImageData(image, 0, 0, 0, 0, imageWidth, this.height);

        drawnWidth = imageWidth;
      },
      () => drawnWidth === this.width,
    );
    this.sweepAnimations.add(animation);
    animation.start();
    await animation.promise;
    this.sweepAnimations.delete(animation);
  }

  /**
   * Clears the canvas, resizes, then fills another with the given dimensions.
   */
  private async resize(): Promise<void> {
    this.mutex.runExclusive(async () => {
      await this.stopAllAnimations();
      await this.sweepFill();

      this.width = this.cols * this.cellSize + (this.cols + 1) * this.wallSize;
      this.height = this.rows * this.cellSize + (this.rows + 1) * this.wallSize;
      await this.sweepFill(MazeRenderer.Color.cellEmpty);
      this.isCanvasEmpty = true;
    });
  }

  /**
   * Stops all animations.
   */
  private async stopAllAnimations(): Promise<void> {
    await Promise.all([this.stopSweepAnimations(), this.stopMazeAnimation()]);
  }

  private async stopSweepAnimations(): Promise<void> {
    this.sweepAnimations.forEach((animation) => animation.cancel());
    await Promise.all(
      Array.from(this.sweepAnimations).map((animation) => animation.promise),
    );
  }

  /**
   * Stops all maze animations.
   */
  private async stopMazeAnimation(): Promise<void> {
    this.mazeAnimations.forEach((animation) => animation.cancel());
    await Promise.all(
      Array.from(this.mazeAnimations).map((animation) => animation.promise),
    );
  }

  /**
   * Waits for all sweep animations to finish.
   */
  private async waitForSweepAnimations(): Promise<void> {
    await Promise.all(
      Array.from(this.sweepAnimations).map((animation) => animation.promise),
    );
  }

  /**
   * Draw only the modified cells and their walls.
   *
   * Comparable to a dirty rect update.
   */
  private drawModifiedCells(modifiedCells: Readonly<MazeCell>[]): void {
    for (const cell of modifiedCells) {
      this.drawCell(cell);
      this.drawCellWalls(cell);
    }
  }

  /**
   * Draws the maze assuming the maze is complete.
   *
   * - `this.maze` must not be null.
   * - Clears the canvas and draws the maze from scratch.
   */
  private drawMaze(): void {
    if (this.maze === null) {
      throw new Error("Maze is null");
    }

    // Fill the canvas with empty color
    this.ctx.fillStyle = MazeRenderer.Color.cellEmpty;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw from top to bottom, left to right
    this.ctx.fillStyle = MazeRenderer.Color.cellSolid;
    for (let row = 0; row < this.rows; ++row) {
      for (let col = 0; col < this.cols; ++col) {
        const cell: MazeCell = this.maze[row][col];
        this.drawCell(cell);
        // Clear the right wall if connected
        if (
          col !== this.cols - 1 &&
          cell.connections.includes(this.maze[row][col + 1])
        ) {
          this.drawWall(cell, "right");
        }
        // Clear the bottom wall if connected
        if (
          row !== this.rows - 1 &&
          cell.connections.includes(this.maze[row + 1][col])
        ) {
          this.drawWall(cell, "down");
        }
      }
    }
  }

  /**
   * Draws the maze assuming the maze is incomplete.
   */
  private drawIncompleteMaze(): void {
    if (this.maze === null) {
      throw new Error("Maze is null");
    }

    // Fill the canvas with empty color
    this.ctx.fillStyle = MazeRenderer.Color.cellEmpty;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw from top to bottom, left to right
    for (let row = 0; row < this.rows; ++row) {
      for (let col = 0; col < this.cols; ++col) {
        const cell: MazeCell = this.maze[row][col];
        this.drawCell(cell);
        // Draw right wall
        this.ctx.fillStyle = this.determineWallColor(
          cell,
          this.maze[row][col + 1],
        );
        this.drawWall(cell, "right");
        // Draw bottom wall
        this.ctx.fillStyle = this.determineWallColor(
          cell,
          this.maze[row + 1][col],
        );
        this.drawWall(cell, "down");
      }
    }
  }

  /**
   * Draws the given cell.
   */
  private drawCell(cell: Readonly<MazeCell>): void {
    const topLeft: Coord = this.calcCellTopLeft(cell.idx2d);
    this.ctx.fillStyle = match(cell.state)
      .with("empty", () => MazeRenderer.Color.cellEmpty)
      .with("partial", () => MazeRenderer.Color.cellPartial)
      .with("solid", () => MazeRenderer.Color.cellSolid)
      .exhaustive();
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

  private determineWallColor(
    cell: Readonly<MazeCell>,
    neighbor: Readonly<MazeCell>,
  ): string {
    if (!cell.connections.includes(neighbor as MazeCell))
      return MazeRenderer.Color.cellEmpty;
    return match([cell.state, neighbor.state])
      .when(
        (states) => states.includes("partial"),
        () => MazeRenderer.Color.cellPartial,
      )
      .otherwise(() => MazeRenderer.Color.cellSolid);
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
   * Calculate the width of a vertical wall.
   * @returns An integer between 1 and `MazeRenderer.FULL_SIZE - 1`.
   */
  private calcWallSize(): number {
    return clamp(
      Math.round(MazeRenderer.FULL_SIZE / (this.cellWallRatio + 1)),
      1,
      MazeRenderer.FULL_SIZE - 1,
    );
  }

  /**
   * Calculate the coordinates of the top-left corner of the cell.
   * @param row - Row index of the cell.
   * @param col - Column index of the cell.
   */
  private calcCellTopLeft({ row, col }: Idx2d): Coord {
    return {
      x: MazeRenderer.FULL_SIZE * col + this.wallSize,
      y: MazeRenderer.FULL_SIZE * row + this.wallSize,
    };
  }
}
