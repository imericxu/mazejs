import { Mutex } from "async-mutex";
import {
  type GenerationAlgorithm,
  type SolveAlgorithm,
} from "./algorithms/algorithmTypes";
import { AnimationPromise } from "./AnimationPromise";
import { MazeCell } from "./MazeCell";
import MazeDrawer from "./MazeDrawer";
import { RectSize } from "./twoDimens";
import { clamp, deepEqual } from "./utils";
import { Tremaux } from "./algorithms/solving/Tremaux";
import { match } from "ts-pattern";
import { MazeGenerator } from "./algorithms/generating/MazeGenerator";
import { MazeSolver } from "./algorithms/solving/MazeSolver";
import { Wilsons } from "./algorithms/generating/Wilsons";

export type MazeEvent = "generate" | "solve";

export interface MazeDimensions {
  rows: number;
  cols: number;
  /**
   * Width of cell vs wall.
   *
   * E.g., 0.5 means a cell is half the width of a wall.
   */
  cellWallRatio: number;
}

export interface MazeSettings {
  dimensions: MazeDimensions;
  generatingAlgorithm?: GenerationAlgorithm;
  doAnimateGenerating: boolean;
  solvingAlgorithm?: SolveAlgorithm;
  doAnimateSolving: boolean;
}

export class MazeController {
  /** Range of rows/cols allowed. */
  static DIMS_RANGE = {
    minSize: 3,
    maxSize: 800,
    minRatio: 0.1,
    maxRatio: 5,
  } as const;

  /** Default settings. */
  static DEFAULTS: MazeSettings = {
    dimensions: {
      rows: 20,
      cols: 20,
      cellWallRatio: MazeDrawer.DEFAULT_VALUES.cellWallRatio,
    },
    doAnimateGenerating: true,
    doAnimateSolving: true,
  } as const;

  private drawer: MazeDrawer;
  private mazeAnimation: AnimationPromise | null = null;
  private shouldSweep: boolean = true;
  private mutex = new Mutex();

  private dimensions: MazeDimensions = MazeController.DEFAULTS.dimensions;

  private maze: MazeCell[][] | null = null;

  /**
   * @param ctx - The canvas context to draw on.
   * @param setContainerSize - Callback to set the container size when the maze
   *   is resized.
   * @param setSolvable - Callback to set whether the maze is in a solvable
   *   state.
   */
  constructor(
    ctx: CanvasRenderingContext2D,
    setContainerSize: (size: Readonly<RectSize>) => void,
    private setSolvable: (solvable: boolean) => void,
  ) {
    this.drawer = new MazeDrawer(
      ctx,
      MazeController.DEFAULTS.dimensions,
      setContainerSize,
    );
  }

  public async generate(settings: MazeSettings): Promise<void> {
    if (this.drawer.lastEvent === "solve") this.shouldSweep = true;
    this.drawer.lastEvent = "generate";
    this.setSolvable(false);

    if (!deepEqual(this.dimensions, settings.dimensions)) {
      this.dimensions = settings.dimensions;
      this.drawer.resize(this.dimensions);
      this.shouldSweep = false;
    }

    const { rows, cols } = this.dimensions;

    await this.stopMazeAnimation();
    const alg: MazeGenerator = new Wilsons({ rows, cols });
    this.maze = alg.maze;
    this.drawer.maze = this.maze;

    // Do a sweep animation if the resize didn't already do one
    if (settings.doAnimateGenerating && this.shouldSweep) {
      this.drawer.fillWithWall();
      this.shouldSweep = false;
    }
    // Dynamically decide the number of steps to take based on total number
    // of cells. Increases exponentially with number of cells.
    const steps: number = settings.doAnimateGenerating
      ? Math.min(
          Math.round(
            clamp(Math.pow(rows * cols, 0.6) * 0.1, 1, rows * cols * 0.2),
          ),
          1000,
        )
      : 1000;
    // Define the animation
    // Always use animation frames to prevent lag with heavy computations
    const animation = new AnimationPromise(
      () => {
        for (let i = 0; i < steps; i++) {
          const cells = alg.step();
          if (settings.doAnimateGenerating) {
            this.drawer.changeList.push(...cells);
          }
        }
        if (settings.doAnimateGenerating) this.drawer.draw();
      },
      () => {
        if (!alg.finished) return false;
        this.setSolvable(true);
        return true;
      },
      settings.doAnimateGenerating ? 60 : null,
    );

    this.mutex.runExclusive(async () => {
      await this.stopMazeAnimation();
      await this.drawer.waitForSweepAnimations();
      this.drawer.isComplete = false;
      this.drawer.shouldDraw = settings.doAnimateGenerating;
      this.mazeAnimation = animation;
      this.mazeAnimation.start();
      this.mazeAnimation.promise.then(() => {
        this.mazeAnimation = null;
        this.drawer.isComplete = true;
        this.drawer.useHiddenCtx = !settings.doAnimateGenerating;
        this.drawer.shouldDraw = true;
        this.drawer.draw();
        if (!settings.doAnimateGenerating) this.drawer.animateCanvasCopyFill();
        this.drawer.useHiddenCtx = false;
      });
      this.shouldSweep = true;
    });
  }

  public async solve(settings: MazeSettings): Promise<void> {
    if (this.maze === null) throw new Error("Can't solve null maze");
    if (this.drawer.lastEvent === "generate") this.shouldSweep = false;
    this.drawer.lastEvent = "solve";

    await this.stopMazeAnimation();

    const [start, end] = this.randomStartEnd();
    this.drawer.startEnd = [start, end];
    const alg: MazeSolver = new Tremaux(this.maze, start, end);

    if (settings.doAnimateSolving) {
      if (this.shouldSweep) {
        this.drawer.useHiddenCtx = true;
        this.drawer.lastEvent = "generate";
        this.drawer.isComplete = true;
        this.drawer.draw();
        this.drawer.animateCanvasCopyFill();
        this.drawer.useHiddenCtx = false;
        this.drawer.lastEvent = "solve";
      }

      const animation = new AnimationPromise(
        () => {
          this.drawer.changeList = alg.step();
          this.drawer.path = alg.path;
          this.drawer.draw();
        },
        () => {
          if (!alg.finished) return false;
          this.drawer.isComplete = true;
          this.drawer.draw();
          return true;
        },
        60,
      );

      this.mutex.runExclusive(async () => {
        await this.stopMazeAnimation();
        await this.drawer.waitForSweepAnimations();
        this.drawer.isComplete = false;
        this.mazeAnimation = animation;
        this.mazeAnimation.start();
        this.shouldSweep = true;
        this.mazeAnimation.promise.then(() => {
          this.mazeAnimation = null;
        });
      });
    } else {
      alg.finish();
      this.drawer.path = alg.path;
      this.drawer.isComplete = true;
      this.drawer.useHiddenCtx = true;
      this.drawer.draw();
      this.drawer.animateCanvasCopyFill();
      this.drawer.useHiddenCtx = false;
    }
    this.shouldSweep = true;
  }

  /**
   * Empties the canvas and stops all animations.
   */
  public async clear(): Promise<void> {
    this.setSolvable(false);
    await this.stopMazeAnimation();
    this.maze = null;
    this.shouldSweep = false;
    this.drawer.lastEvent = null;
    this.drawer.fillWithWall();
  }

  public zoomTo(zoomLevel: number): void {
    this.drawer.zoomTo(zoomLevel);
  }

  /**
   * Stops all maze animations.
   */
  private async stopMazeAnimation(): Promise<void> {
    const promise = this.mazeAnimation?.promise;
    this.mazeAnimation?.cancel();
    await promise;
  }

  private randomStartEnd(): [MazeCell, MazeCell] {
    if (this.maze === null) throw new Error("Maze is null");
    return match(Math.random() < 0.5)
      .returnType<[MazeCell, MazeCell]>()
      .with(true, () => {
        // Horizontal
        const start: MazeCell =
          this.maze![Math.floor(Math.random() * this.dimensions.rows)][0];
        const end: MazeCell =
          this.maze![Math.floor(Math.random() * this.dimensions.rows)][
            this.dimensions.cols - 1
          ];
        return [start, end];
      })
      .with(false, () => {
        // Vertical
        const start: MazeCell =
          this.maze![0][Math.floor(Math.random() * this.dimensions.cols)];
        const end: MazeCell =
          this.maze![this.dimensions.rows - 1][
            Math.floor(Math.random() * this.dimensions.cols)
          ];
        return [start, end];
      })
      .exhaustive();
  }
}
