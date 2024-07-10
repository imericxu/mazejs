import { MazeCell } from "@/lib/MazeCell";
import { MazeSolver } from "./MazeSolver";
import { randomFromArray } from "@/lib/utils";

export class Tremaux extends MazeSolver {
  protected _step(): [boolean, Readonly<MazeCell>[]] {
    const current: MazeCell = this._path[this._path.length - 1];

    const unvisitedConnections: MazeCell[] = current.connections.filter(
      (connection) => connection.state === "solid",
    );

    // Nowhere to go, go back
    if (unvisitedConnections.length === 0) {
      this._path.pop();
      const changes: MazeCell[] = [current];
      if (this._path.length > 0) {
        changes.push(this._path[this._path.length - 1]);
      }
      return [false, changes];
    }

    // Choose a random unvisited connection
    const next: MazeCell = randomFromArray(unvisitedConnections);
    next.state = "partial";
    this._path.push(next);
    return [next === this.end, [current, next]];
  }

  protected initialize(): Readonly<MazeCell>[] {
    this._path = [this.start];
    this.start.state = "partial";
    return [this.start];
  }
}
