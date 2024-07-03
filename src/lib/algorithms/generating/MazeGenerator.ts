import { MazeCell } from "@/lib/MazeCell";
import { GridSize } from "@/lib/twoDimens";

export abstract class MazeGenerator {
  /** Cells that make up the maze. */
  maze: MazeCell[][];
  private _finished: boolean = false;
  private initialized: boolean = false;

  constructor({ rows, cols }: GridSize) {
    this.maze = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => new MazeCell({ row, col })),
    );
    for (let row = 0; row < rows; ++row) {
      for (let col = 0; col < cols; ++col) {
        const cell: MazeCell = this.maze[row][col];
        // Add right neighbor if not in last column.
        if (col < cols - 1) {
          cell.addNeighbor(this.maze[row][col + 1]);
        }
        // Add down neighbor if not in last row.
        if (row < rows - 1) {
          cell.addNeighbor(this.maze[row + 1][col]);
        }
      }
    }
  }

  /**
   * Takes a single step in the algorithm.
   * @returns The cells that were modified in this step.
   */
  step(): Readonly<MazeCell>[] {
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
  finish(): void {
    while (!this._finished) {
      this.step();
    }
  }

  get finished(): boolean {
    return this._finished;
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
