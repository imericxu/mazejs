export const GENERATION_ALGORITHMS = [
  "random",
  "wilsons",
  "backtracker",
  "prims",
] as const;
export type GenerationAlgorithm = (typeof GENERATION_ALGORITHMS)[number];
export const SOLVE_ALGORITHMS = ["random", "bfs", "tremaux"] as const;
export type SolveAlgorithm = (typeof SOLVE_ALGORITHMS)[number];
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
  generationAlgorithm: GenerationAlgorithm;
  doAnimateGenerating: boolean;
  solveAlgorithm: SolveAlgorithm;
  doAnimateSolving: boolean;
}
