import { MazeCell } from "@/lib/MazeCell";

export function buildPath(
  cameFrom: Map<MazeCell, MazeCell>,
  end: MazeCell,
): MazeCell[] {
  const path: MazeCell[] = [];
  let current: MazeCell | null = end;
  while (current !== null) {
    path.unshift(current);
    current = cameFrom.get(current) ?? null;
  }
  return path.toReversed();
}
