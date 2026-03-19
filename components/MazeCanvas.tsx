"use client";

import { useEffect, useRef, useCallback } from "react";
import { type MazeGrid, type Cell } from "@/lib/maze";

interface MazeCanvasProps {
  maze: MazeGrid;
  cols: number;
  rows: number;
  player: Cell;
  trail: Cell[];
  solution: Cell[];
  onMove: (dx: number, dy: number) => void;
}

const STEP_MS = 120; // ms between auto-steps while holding
const MIN_SWIPE = 20; // px threshold to register a swipe

export default function MazeCanvas({
  maze,
  cols,
  rows,
  player,
  trail,
  solution,
  onMove,
}: MazeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isTouching = useRef(false);
  const runInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const dirRef = useRef<{ dx: number; dy: number } | null>(null);

  // Keep latest maze + player in refs so the interval always sees fresh values
  const mazeRef = useRef(maze);
  const playerRef = useRef(player);
  const colsRef = useRef(cols);
  const rowsRef = useRef(rows);
  useEffect(() => {
    mazeRef.current = maze;
  }, [maze]);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    colsRef.current = cols;
  }, [cols]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // ── Drawing ──────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || maze.length === 0) return;

    const ctx = canvas.getContext("2d")!;
    const pw = wrapper.clientWidth - 8;
    const ph = wrapper.clientHeight - 8;
    if (pw <= 0 || ph <= 0) return;

    const CELL = Math.max(8, Math.floor(Math.min(pw / cols, ph / rows)));
    const W = cols * CELL;
    const H = rows * CELL;

    canvas.width = W + 2;
    canvas.height = H + 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lw = Math.max(1.5, CELL / 10);
    const inset = Math.max(2, Math.ceil(lw) + 1);

    for (const t of trail) {
      ctx.fillStyle = "rgba(255,140,0,0.32)";
      ctx.fillRect(
        t.x * CELL + 1 + inset,
        t.y * CELL + 1 + inset,
        CELL - inset * 2,
        CELL - inset * 2,
      );
    }
    for (const s of solution) {
      ctx.fillStyle = "rgba(255,215,0,0.62)";
      ctx.fillRect(
        s.x * CELL + 1 + inset,
        s.y * CELL + 1 + inset,
        CELL - inset * 2,
        CELL - inset * 2,
      );
    }

    const lw2 = lw; // alias so wall drawing block below is unchanged
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = lw;
    ctx.lineCap = "square";

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * CELL + 1;
        const py = y * CELL + 1;
        const cell = maze[y][x];
        ctx.beginPath();
        if (!(cell & 1)) {
          ctx.moveTo(px, py);
          ctx.lineTo(px + CELL, py);
        }
        if (!(cell & 2)) {
          ctx.moveTo(px + CELL, py);
          ctx.lineTo(px + CELL, py + CELL);
        }
        if (!(cell & 4)) {
          ctx.moveTo(px, py + CELL);
          ctx.lineTo(px + CELL, py + CELL);
        }
        if (!(cell & 8)) {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + CELL);
        }
        ctx.stroke();
      }
    }

    // Outer border
    const borderW = Math.max(2.5, lw * 1.8);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = borderW;
    ctx.strokeRect(1, 1, W, H);

    // Entry gap: erase top border of cell (0,0) — use a wide white stroke centred on y=1
    // Exit gap: erase bottom border of last cell — centred on y=H+1
    const gapW = CELL - Math.ceil(borderW) * 2; // gap width leaving corners intact
    const gapLW = borderW + 2; // slightly wider than border to fully cover
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = gapLW;
    ctx.lineCap = "butt";
    // Entry: top edge of cell (0,0)
    ctx.beginPath();
    ctx.moveTo(1 + Math.ceil(borderW), 1);
    ctx.lineTo(1 + Math.ceil(borderW) + gapW, 1);
    ctx.stroke();
    // Exit: bottom edge of cell (cols-1, rows-1)
    ctx.beginPath();
    ctx.moveTo(W - Math.ceil(borderW) - gapW, H + 1);
    ctx.lineTo(W - Math.ceil(borderW), H + 1);
    ctx.stroke();
    ctx.lineCap = "square";

    const r = Math.max(4, CELL * 0.27);
    const fontSize = Math.max(8, Math.floor(CELL * 0.38));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#0055cc";
    ctx.beginPath();
    ctx.arc(CELL * 0.5 + 1, CELL * 0.5 + 1, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px 'VT323', monospace`;
    ctx.fillText("S", CELL * 0.5 + 1, CELL * 0.5 + 2);

    ctx.fillStyle = "#00aa00";
    ctx.beginPath();
    ctx.arc(
      (cols - 0.5) * CELL + 1,
      (rows - 0.5) * CELL + 1,
      r,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText("E", (cols - 0.5) * CELL + 1, (rows - 0.5) * CELL + 2);

    const cx = (player.x + 0.5) * CELL + 1;
    const cy = (player.y + 0.5) * CELL + 1;
    ctx.fillStyle = "#cc0000";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#800000";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.font = `${Math.max(8, Math.floor(CELL * 0.35))}px sans-serif`;
    ctx.fillText("★", cx, cy + 1);
  }, [maze, cols, rows, player, trail, solution]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [draw]);

  // ── Auto-run helpers ─────────────────────────────────────

  /** Returns true if movement in (dx,dy) from current player pos is possible */
  const canMove = useCallback((dx: number, dy: number): boolean => {
    const { x, y } = playerRef.current;
    const nx = x + dx,
      ny = y + dy;
    if (nx < 0 || nx >= colsRef.current || ny < 0 || ny >= rowsRef.current)
      return false;
    const bit =
      dx === 0 && dy === -1 ? 1 : dx === 1 ? 2 : dx === 0 && dy === 1 ? 4 : 8;
    return !!(mazeRef.current[y][x] & bit);
  }, []);

  const stopRun = useCallback(() => {
    if (runInterval.current) {
      clearInterval(runInterval.current);
      runInterval.current = null;
    }
    dirRef.current = null;
  }, []);

  const startRun = useCallback(
    (dx: number, dy: number) => {
      stopRun();
      dirRef.current = { dx, dy };

      // Take the first step immediately
      if (!canMove(dx, dy)) return;
      onMove(dx, dy);

      // Then keep stepping while finger is held and path is clear
      runInterval.current = setInterval(() => {
        if (!isTouching.current || !dirRef.current) {
          stopRun();
          return;
        }
        if (!canMove(dirRef.current.dx, dirRef.current.dy)) {
          stopRun();
          return;
        }
        onMove(dirRef.current.dx, dirRef.current.dy);
      }, STEP_MS);
    },
    [canMove, onMove, stopRun],
  );

  // ── Touch handlers ───────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouching.current = true;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!touchStart.current) return;

      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);

      if (Math.max(adx, ady) < MIN_SWIPE) return;

      const moveDx = adx > ady ? (dx > 0 ? 1 : -1) : 0;
      const moveDy = adx > ady ? 0 : dy > 0 ? 1 : -1;

      // If direction changed, restart run and re-anchor touch origin
      const cur = dirRef.current;
      if (!cur || cur.dx !== moveDx || cur.dy !== moveDy) {
        startRun(moveDx, moveDy);
        touchStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    [startRun],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      isTouching.current = false;
      stopRun();
      touchStart.current = null;
    },
    [stopRun],
  );

  // Cleanup on unmount
  useEffect(() => () => stopRun(), [stopRun]);

  return (
    <div ref={wrapperRef} className="maze-panel">
      <canvas
        ref={canvasRef}
        style={{ display: "block", touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}
