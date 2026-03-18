// Direction constants: N=1, E=2, S=4, W=8
export const DIRS = [
  { dx: 0, dy: -1, bit: 1, opp: 4 },
  { dx: 1, dy: 0, bit: 2, opp: 8 },
  { dx: 0, dy: 1, bit: 4, opp: 1 },
  { dx: -1, dy: 0, bit: 8, opp: 2 },
] as const;

export type Cell = { x: number; y: number };
export type MazeGrid = number[][];
export type Algorithm = "recursive" | "prims" | "random";

// ── Recursive Backtracker ────────────────────────────────────────────────────
// Produces long, winding corridors with a single obvious "river" path.
function generateRecursive(cols: number, rows: number): MazeGrid {
  const maze = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const vis = Array.from({ length: rows }, () => new Array(cols).fill(false));

  const carve = (x: number, y: number) => {
    vis[y][x] = true;
    const dirs = [...DIRS].sort(() => Math.random() - 0.5);
    for (const d of dirs) {
      const nx = x + d.dx,
        ny = y + d.dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !vis[ny][nx]) {
        maze[y][x] |= d.bit;
        maze[ny][nx] |= d.opp;
        carve(nx, ny);
      }
    }
  };
  carve(0, 0);
  return maze;
}

// ── Prim's Algorithm ─────────────────────────────────────────────────────────
// Grows the maze outward from a seed — produces a much "bushier" maze with
// lots of short dead ends and no strong directional bias.
function generatePrims(cols: number, rows: number): MazeGrid {
  const maze = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const inMaze = Array.from({ length: rows }, () =>
    new Array(cols).fill(false),
  );

  // Each frontier entry: the wall between an in-maze cell and an out-of-maze cell
  type Wall = {
    fx: number;
    fy: number;
    nx: number;
    ny: number;
    bit: number;
    opp: number;
  };
  const frontier: Wall[] = [];

  const addFrontier = (x: number, y: number) => {
    for (const d of DIRS) {
      const nx = x + d.dx,
        ny = y + d.dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !inMaze[ny][nx]) {
        frontier.push({ fx: x, fy: y, nx, ny, bit: d.bit, opp: d.opp });
      }
    }
  };

  // Seed from (0,0)
  inMaze[0][0] = true;
  addFrontier(0, 0);

  while (frontier.length > 0) {
    // Pick a random frontier wall
    const idx = Math.floor(Math.random() * frontier.length);
    const wall = frontier.splice(idx, 1)[0];
    const { fx, fy, nx, ny, bit, opp } = wall;

    // If the neighbour is already in the maze, skip (stale frontier entry)
    if (inMaze[ny][nx]) continue;

    // Carve through
    maze[fy][fx] |= bit;
    maze[ny][nx] |= opp;
    inMaze[ny][nx] = true;
    addFrontier(nx, ny);
  }

  return maze;
}

// ── Public API ───────────────────────────────────────────────────────────────

export function generateMaze(
  cols: number,
  rows: number,
  algorithm: Algorithm = "recursive",
): MazeGrid {
  const pick =
    algorithm === "random"
      ? Math.random() < 0.5
        ? "recursive"
        : "prims"
      : algorithm;

  return pick === "prims"
    ? generatePrims(cols, rows)
    : generateRecursive(cols, rows);
}

/** BFS solver — returns path from (sx,sy) to (ex,ey) */
export function solveMaze(
  maze: MazeGrid,
  cols: number,
  rows: number,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
): Cell[] {
  const queue: { x: number; y: number; path: Cell[] }[] = [
    { x: sx, y: sy, path: [{ x: sx, y: sy }] },
  ];
  const seen = Array.from({ length: rows }, () => new Array(cols).fill(false));
  seen[sy][sx] = true;

  while (queue.length) {
    const { x, y, path } = queue.shift()!;
    if (x === ex && y === ey) return path;
    for (const d of DIRS) {
      const nx = x + d.dx,
        ny = y + d.dy;
      if (
        nx >= 0 &&
        nx < cols &&
        ny >= 0 &&
        ny < rows &&
        !seen[ny][nx] &&
        maze[y][x] & d.bit
      ) {
        seen[ny][nx] = true;
        queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  return [];
}

export function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}
