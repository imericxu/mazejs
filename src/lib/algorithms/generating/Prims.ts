import { MazeGenerator } from "@/lib/algorithms/generating/MazeGenerator";
import { type MazeCell } from "@/lib/MazeCell";
import { randomFromArray, randomFromSet } from "@/lib/utils";

/**
 * Randomized Prim's Algorithm
 *
 * Prim's algorithm with no weights and connections are randomly selected.
 * Visually, the maze spreads from a center in a somewhat circular fashion.
 */
export class Prims extends MazeGenerator {
  private frontier: Set<MazeCell> = new Set();

  protected _step(): [boolean, Readonly<MazeCell>[]] {
    const changeList: MazeCell[] = [];

    const randFrontierCell: MazeCell = randomFromSet(this.frontier);
    this.frontier.delete(randFrontierCell);

    // Connect to a random solid neighbor
    randFrontierCell.state = "solid";
    randFrontierCell.connect(
      randomFromArray(
        randFrontierCell.neighbors.filter(
          (neighbor) => neighbor.state === "solid",
        ),
      ),
    );
    changeList.push(randFrontierCell);

    // Add all empty neighbors to the frontier
    randFrontierCell.neighbors
      .filter((neighbor) => neighbor.state === "empty")
      .forEach((neighbor) => {
        // No need to check; sets prevent duplicates.
        this.frontier.add(neighbor);
        neighbor.state = "partial";
        changeList.push(neighbor);
      });

    return [this.frontier.size === 0, changeList];
  }

  /** Pick a random cell to start with and add its neighbors to the frontier. */
  protected initialize(): Readonly<MazeCell>[] {
    const startCell: MazeCell = randomFromArray(randomFromArray(this.maze));
    // Mark the start cell as solid and add its neighbors to the frontier.
    startCell.state = "solid";
    startCell.neighbors.forEach((neighbor) => {
      this.frontier.add(neighbor);
      neighbor.state = "partial";
    });
    return [startCell, ...startCell.neighbors];
  }
}
