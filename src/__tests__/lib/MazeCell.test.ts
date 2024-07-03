import { MazeCell } from "@/lib/MazeCell";
import { expect, test } from "vitest";

test("Constructor should work", () => {
  const cell = new MazeCell({ row: 5, col: 8 });
  expect(cell.row).toBe(5);
  expect(cell.col).toBe(8);
  expect(cell.neighbors).toHaveLength(0);
  expect(cell.connections).toHaveLength(0);
});

test("Two non-neighbor cells shouldn't be able to connect", () => {
  const cell1 = new MazeCell({ row: 0, col: 0 });
  const cell2 = new MazeCell({ row: 1, col: 1 });
  expect(() => cell1.connect(cell2)).toThrowError();
});

test("Two neighbor cells should be able to connect", () => {
  const cell1 = new MazeCell({ row: 0, col: 0 });
  const cell2 = new MazeCell({ row: 0, col: 1 });
  cell1.addNeighbor(cell2);
  expect(() => cell1.connect(cell2)).not.toThrowError();
});

test("Adding a neighbor should be two-way", () => {
  const cell1 = new MazeCell({ row: 0, col: 0 });
  const cell2 = new MazeCell({ row: 0, col: 1 });
  cell1.addNeighbor(cell2);
  expect(cell1.neighbors).toContain(cell2);
  expect(cell2.neighbors).toContain(cell1);
});

test("Connecting cells should be two-way", () => {
  const cell1 = new MazeCell({ row: 0, col: 0 });
  const cell2 = new MazeCell({ row: 0, col: 1 });
  cell1.addNeighbor(cell2);
  cell1.connect(cell2);
  expect(cell1.connections).toContain(cell2);
  expect(cell2.connections).toContain(cell1);
});

test("Disconnecting cells should be two-way", () => {
  const cell1 = new MazeCell({ row: 0, col: 0 });
  const cell2 = new MazeCell({ row: 0, col: 1 });
  cell1.addNeighbor(cell2);
  cell1.connect(cell2);
  cell1.disconnect(cell2);
  expect(cell1.connections).not.toContain(cell2);
  expect(cell2.connections).not.toContain(cell1);
});
