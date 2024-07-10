/**
 * Types for two-dimensional objects/entities.
 */

/** Represents a two-dimensional index. */
export interface Idx2d {
  row: number;
  col: number;
}

/** Represents the dimensions of a two-dimensional grid. */
export interface GridSize {
  rows: number;
  cols: number;
}

/** Represents a two-dimensional point. */
export interface Coord {
  x: number;
  y: number;
}

/** Represents the dimensions of a rectangle. */
export interface RectSize {
  width: number;
  height: number;
}
