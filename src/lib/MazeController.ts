import { match } from "ts-pattern";
import {
  type GenerationAlgorithm,
  type SolveAlgorithm,
} from "./algorithms/algorithmTypes";
import { Backtracking } from "./algorithms/generating/Backtracking";
import { Prims } from "./algorithms/generating/Prims";
import { MazeCell } from "./MazeCell";
import { clamp, deepEqual, Direction, easeOutQuad } from "./utils";
import { Wilsons } from "./algorithms/generating/Wilsons";
import { Idx2d, Coord, RectSize } from "./twoDimens";
import { AnimationPromise } from "./AnimationPromise";
import { Mutex } from "async-mutex";
import colors from "tailwindcss/colors";
import MazeDrawer from "./MazeDrawer";

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
      cellWallRatio: 4.0,
    },
    doAnimateGenerating: true,
    doAnimateSolving: true,
  } as const;

  private drawer: MazeDrawer;
  private mazeAnimation: AnimationPromise | null = null;
  private isCanvasEmpty: boolean = true;
  private mutex = new Mutex();

  private dimensions: MazeDimensions = MazeController.DEFAULTS.dimensions;

  private maze: MazeCell[][] | null = null;

  constructor(
    ctx: CanvasRenderingContext2D,
    setContainerSize: (size: Readonly<RectSize>) => void,
  ) {
    this.drawer = new MazeDrawer(
      ctx,
      MazeController.DEFAULTS.dimensions,
      setContainerSize,
    );
  }

  public async generate(settings: MazeSettings): Promise<void> {
    if (!deepEqual(this.dimensions, settings.dimensions)) {
      this.dimensions = settings.dimensions;
      this.drawer.resize(this.dimensions);
      this.isCanvasEmpty = true;
    }

    const { rows, cols } = this.dimensions;

    this.stopMazeAnimation();
    const alg = new Backtracking({ rows, cols });
    this.maze = alg.maze;

    if (settings.doAnimateGenerating) {
      // Do a sweep animation if the resize didn't already do one
      if (!this.isCanvasEmpty) {
        this.drawer.fillWithWall();
        this.isCanvasEmpty = true;
      }
      // Dynamically decide the number of steps to take based on total number
      // of cells. Increases exponentially with number of cells.
      const steps: number = Math.round(
        clamp(Math.pow(rows * cols, 0.6) * 0.1, 1, rows * cols * 0.2),
      );
      // Define the animation
      const animation = new AnimationPromise(
        () => {
          const modifiedCells: Readonly<MazeCell>[] = [];
          for (let i = 0; i < steps; i++) {
            const cells = alg.step();
            modifiedCells.push(...cells);
          }
          this.drawer.drawModifiedCells(modifiedCells);
        },
        () => {
          if (alg.finished) {
            if (this.maze === null) throw new Error("Maze is null");
            this.drawer.drawFinishedMaze(this.maze);
            return true;
          }
          return false;
        },
        60,
      );

      this.mutex.runExclusive(async () => {
        await this.stopMazeAnimation();
        await this.drawer.waitForSweepAnimations();
        this.mazeAnimation = animation;
        this.mazeAnimation.start();
        this.mazeAnimation.promise.then(() => {
          this.mazeAnimation = null;
        });
      });
    } else {
      alg.finish();
      this.drawer.useHiddenCtx = true;
      this.drawer.drawFinishedMaze(this.maze);
      this.drawer.animateCanvasCopyFill();
      this.drawer.useHiddenCtx = false;
    }
    this.isCanvasEmpty = false;
  }

  public solve(settings: MazeSettings): void {}

  /**
   * Empties the canvas and stops all animations.
   */
  public clear(): void {
    this.stopMazeAnimation();
    this.drawer.fillWithWall();
  }

  /**
   * Stops all maze animations.
   */
  private async stopMazeAnimation(): Promise<void> {
    const promise = this.mazeAnimation?.promise;
    this.mazeAnimation?.cancel();
    await promise;
  }
}
