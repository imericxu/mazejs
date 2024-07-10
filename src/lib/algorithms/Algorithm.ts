import { MazeCell } from "@/lib/MazeCell";

export abstract class Algorithm {
  private _finished: boolean = false;
  private initialized: boolean = false;

  /**
   * @param maze - Cells that make up the maze.
   */
  constructor(public maze: MazeCell[][]) {}

  public get finished(): boolean {
    return this._finished;
  }

  /**
   * Takes a single step in the algorithm.
   * @returns The cells that were modified in this step.
   */
  public step(): Readonly<MazeCell>[] {
    if (this._finished) return [];
    // Initialize here instead of constructor so the animation makes sense.
    // I.e., you don't expect there to be a change before the first step.
    if (!this.initialized) {
      this.initialized = true;
      return this.initialize();
    }

    const [isFinished, modifiedCells] = this._step();

    this._finished = isFinished;
    return modifiedCells;
  }

  /**
   * Generates the entire maze.
   */
  public finish(): void {
    while (!this._finished) {
      this.step();
    }
  }

  /**
   * Algorithm-specific step in the algorithm.
   * @returns A tuple of whether the algorithm is finished and the cells that
   *   were modified in this step.
   */
  protected abstract _step(): [boolean, Readonly<MazeCell>[]];

  /**
   * Algorithm-specific initialization.
   * @returns The cells that were modified during initialization.
   */
  protected abstract initialize(): Readonly<MazeCell>[];
}
