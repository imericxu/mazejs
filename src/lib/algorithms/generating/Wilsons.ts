import { MazeCell } from "@/lib/MazeCell";
import { MazeGenerator } from "./MazeGenerator";
import { randomFromArray, randomFromSet } from "@/lib/utils";
import { match } from "ts-pattern";

/**
 * Wilson's Algorithm
 *
 * Uses loop-erased walks to generate a uniform spanning tree/maze.
 *
 * @see <a href="https://en.wikipedia.org/wiki/Loop-erased_random_walk">
 * Loop-erased walk on Wikipedia
 * </a>
 */
export class Wilsons extends MazeGenerator {
  private notInMaze = new Set<MazeCell>(this.maze.flat());
  private currentWalk: MazeCell[] = [];

  protected _step(): [boolean, Readonly<MazeCell>[]] {
    if (this.currentWalk.length === 0) {
      return [false, this.startNewWalk()];
    }

    const current: MazeCell = this.currentWalk[this.currentWalk.length - 1];

    // Random neighbor not including previous cell
    const random: MazeCell = match(this.currentWalk.length)
      .with(1, () => randomFromArray(current.neighbors))
      .otherwise(() => {
        const prev: MazeCell = this.currentWalk[this.currentWalk.length - 2];
        return randomFromArray(
          current.neighbors.filter((neighb) => neighb !== prev),
        );
      });

    let changes: Readonly<MazeCell>[];

    if (random.state === "solid") {
      // This only applies to the first successful walk
      if (
        this.currentWalk[0].state === "solid" &&
        this.currentWalk.length === 4
      ) {
        changes = this.deleteLoop(random);
      } else {
        // Add walk to maze if we hit a solid cell
        current.connect(random);
        changes = this.addWalkToMaze();
      }
    } else if (this.currentWalk.includes(random)) {
      // Delete loop if we hit a cell already in the walk
      changes = this.deleteLoop(random);
    } else {
      // Add random cell to walk otherwise
      this.currentWalk.push(random);
      current.connect(random);
      random.state = "partial";
      changes = [random];
    }

    return [this.notInMaze.size === 0, changes];
  }

  /** Select a random cell to start the maze. */
  protected initialize(): Readonly<MazeCell>[] {
    this.startNewWalk();
    this.currentWalk[0].state = "solid";
    return this.currentWalk;
  }

  /**
   * Pick a random non-maze cell and start a new walk from it.
   * @returns Changed cells (i.e., the starting cell)
   */
  private startNewWalk(): Readonly<MazeCell>[] {
    const random: MazeCell = randomFromSet(this.notInMaze);
    this.currentWalk = [random];
    random.state = "partial";
    return [random];
  }

  /**
   * Add the current walk to the maze.
   *
   * I.e., remove the walk from the not-in-maze set and set the cells to solid.
   * @returns Changed cells (i.e., the cells in the walk)
   */
  private addWalkToMaze(): Readonly<MazeCell>[] {
    // Remove the walk from the not-in-maze set
    for (const cell of this.currentWalk) {
      this.notInMaze.delete(cell);
      cell.state = "solid";
    }
    const changes = this.currentWalk;
    this.currentWalk = [];
    return changes;
  }

  private deleteLoop(conflict: MazeCell): Readonly<MazeCell>[] {
    const changes: Readonly<MazeCell>[] = [];
    let head: MazeCell;
    do {
      const popped: MazeCell = this.currentWalk.pop()!;
      popped.state = "empty";
      this.notInMaze.add(popped);
      changes.push(popped);

      head = this.currentWalk[this.currentWalk.length - 1];
      head.disconnect(popped);
    } while (head !== conflict);
    return changes;
  }
}
