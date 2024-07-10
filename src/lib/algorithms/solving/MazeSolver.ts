import { type MazeCell } from "@/lib/MazeCell";
import { Algorithm } from "../Algorithm";

export abstract class MazeSolver extends Algorithm {
  protected _path: MazeCell[] = [];

  constructor(
    maze: MazeCell[][],
    protected start: MazeCell,
    protected end: MazeCell,
  ) {
    maze.forEach((row) =>
      row.forEach((cell) => {
        cell.state = "solid";
      }),
    );
    super(maze);
  }

  public get path(): readonly Readonly<MazeCell>[] {
    return this._path;
  }
}
