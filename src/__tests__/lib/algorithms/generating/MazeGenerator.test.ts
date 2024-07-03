import { MazeGenerator } from "@/lib/algorithms/generating/MazeGenerator";
import { expect, test, vi } from "vitest";

class MockGenerator extends MazeGenerator {
  protected _step = vi.fn();
  protected initialize = vi.fn();
}

test("The constructor should initialize a fully-neighbored grid", () => {
  const generator = new MockGenerator(3, 3);
  for (let row = 0; row < 3; ++row) {
    for (let col = 0; col < 3; ++col) {
      const cell = generator.maze[row][col];
      if (col < 2) {
        expect(cell.neighbors).toContain(generator.maze[row][col + 1]);
      }
      if (row < 2) {
        expect(cell.neighbors).toContain(generator.maze[row + 1][col]);
      }
    }
  }
});
