import { MazeCell } from "@/lib/MazeCell";
import { MazeSolver } from "./MazeSolver";
import { Deque } from "@datastructures-js/deque";
import { buildPath } from "./pathUtils";

export class BFS extends MazeSolver {
  private queue = new Deque<MazeCell>();
  private cameFrom = new Map<MazeCell, MazeCell>();

  protected _step(): [boolean, Readonly<MazeCell>[]] {
    const changes: MazeCell[] = [];

    // Go through one queue level
    const queueSize = this.queue.size();
    for (let i = 0; i < queueSize; ++i) {
      const current = this.queue.popFront();

      if (current === this.end) {
        this._path = buildPath(this.cameFrom, this.end);
        return [true, []];
      }

      for (const neighbor of current.connections) {
        if (neighbor.state === "solid") {
          neighbor.state = "partial";
          this.queue.pushBack(neighbor);
          this.cameFrom.set(neighbor, current);
          changes.push(neighbor);
        }
      }
    }

    return [this.queue.isEmpty(), changes];
  }

  protected initialize(): Readonly<MazeCell>[] {
    this.start.state = "partial";
    this.queue.pushBack(this.start);
    return [this.start];
  }
}
