import { MazeCell } from "@/lib/MazeCell";
import { GridSize } from "@/lib/twoDimens";
import { Algorithm } from "../Algorithm";

export abstract class MazeGenerator extends Algorithm {
  constructor({ rows, cols }: GridSize) {
    const maze: MazeCell[][] = Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col) => new MazeCell({ row, col })),
    );
    for (let row = 0; row < rows; ++row) {
      for (let col = 0; col < cols; ++col) {
        const cell: MazeCell = maze[row][col];
        // Add right neighbor if not in last column.
        if (col < cols - 1) {
          cell.addNeighbor(maze[row][col + 1]);
        }
        // Add down neighbor if not in last row.
        if (row < rows - 1) {
          cell.addNeighbor(maze[row + 1][col]);
        }
      }
    }
    super(maze);
  }
}
