import { Idx2d } from "./twoDimens";

export type CellState = "empty" | "partial" | "solid";

/** Represents a single cell in a maze. */
export class MazeCell {
  /** State used for rendering. */
  state: CellState = "empty";

  get idx2d(): Readonly<Idx2d> {
    return this._idx2d;
  }

  get row(): number {
    return this._idx2d.row;
  }

  get col(): number {
    return this._idx2d.col;
  }

  get neighbors(): ReadonlyArray<MazeCell> {
    return this._neighbors;
  }

  get connections(): ReadonlyArray<MazeCell> {
    return this._connections;
  }

  private _idx2d: Idx2d;
  /**
   * Neighboring cells that may or may not be connected.
   *
   * Unnecessary due to the grid layout of the maze, but removes the need to
   * calculate neighbors in the future.
   */
  private _neighbors: MazeCell[] = [];
  /**
   * Cells that are connected to this cell.
   *
   * Must be a subset of `neighbors`.
   */
  private _connections: MazeCell[] = [];

  /** Create a new MazeCell with no neighbors or connections. */
  constructor(idx2d: Readonly<Idx2d>) {
    this._idx2d = { ...idx2d };
  }

  /**
   * Add a neighbor to this cell.
   *
   * This will also add this cell as a neighbor to the given cell.
   */
  addNeighbor(cell: MazeCell): void {
    if (!this._neighbors.includes(cell)) this._neighbors.push(cell);
    if (!cell._neighbors.includes(this)) cell._neighbors.push(this);
  }

  /**
   * Connect this cell to another cell.
   *
   * This will also connect the given cell to this cell.
   * @param cell Must be a neighbor of this cell.
   */
  connect(cell: MazeCell): void {
    if (!this._neighbors.includes(cell)) {
      throw new Error("Cannot connect cells that are not neighbors");
    }
    if (!this._connections.includes(cell)) this._connections.push(cell);
    if (!cell._connections.includes(this)) cell._connections.push(this);
  }

  /**
   * Disconnect this cell from another cell.
   *
   * This will also disconnect the given cell from this cell.
   */
  disconnect(cell: MazeCell): void {
    this._connections = this._connections.filter((c) => c !== cell);
    cell._connections = cell._connections.filter((c) => c !== this);
  }
}
