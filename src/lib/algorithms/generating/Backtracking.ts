import { MazeGenerator } from "@/lib/algorithms/generating/MazeGenerator";
import { type MazeCell } from "@/lib/MazeCell";
import { randomFromArray } from "@/lib/utils";

/**
 * "Recursive" Backtracking Algorithm
 *
 * Randomly connects to unvisited nodes until it hits a dead end, then it
 * backtracks. This is a recursive algorithm, but it's implemented iteratively.
 */
export class Backtracker extends MazeGenerator {
  private exploreStack: MazeCell[] = [];

  protected _step(): [boolean, Readonly<MazeCell>[]] {
    const changeList: MazeCell[] = [];

    const current: MazeCell = this.exploreStack[this.exploreStack.length - 1];

    // Connect to an random unvisited neighbor if it exists, else, backtrack.
    const unvisitedNeighbors: MazeCell[] = current.neighbors.filter(
      (neighbor) => neighbor.state === "empty",
    );

    if (unvisitedNeighbors.length === 0) {
      current.state = "solid";
      changeList.push(current);
      this.exploreStack.pop();
    } else {
      const randomNeighbor: MazeCell = randomFromArray(unvisitedNeighbors);
      current.connect(randomNeighbor);
      randomNeighbor.state = "partial";
      changeList.push(randomNeighbor);
      this.exploreStack.push(randomNeighbor);
    }

    return [this.exploreStack.length === 0, changeList];
  }

  /** Pick a random cell to start with. */
  protected initialize(): Readonly<MazeCell>[] {
    const startCell: MazeCell = randomFromArray(randomFromArray(this.maze));
    startCell.state = "partial";
    this.exploreStack.push(startCell);
    return [startCell];
  }
}
