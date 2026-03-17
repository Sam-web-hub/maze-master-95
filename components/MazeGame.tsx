"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  generateMaze,
  solveMaze,
  formatTime,
  type MazeGrid,
  type Cell,
} from "@/lib/maze";
import {
  resumeAudio,
  startMusic,
  stopMusic,
  playWinFanfare,
} from "@/lib/audio";
import { vibrateMove, vibrateVictory } from "@/lib/haptics";
import {
  loadSettings,
  saveSettings,
  loadBestTimes,
  saveBestTime,
  loadLastSize,
  saveLastSize,
  type BestTimes,
} from "@/lib/storage";
import MazeCanvas from "./MazeCanvas";
import Desktop from "./Desktop";
import SettingsDialog, { type Settings } from "./SettingsDialog";

const SIZE_OPTIONS = [
  { label: "Small (10×10)", value: 10 },
  { label: "Medium (15×15)", value: 15 },
  { label: "Large (20×20)", value: 20 },
  { label: "X-Large (25×25)", value: 25 },
  { label: "Huge (35×35)", value: 35 },
];

type Screen = "desktop" | "game";

export default function MazeGame() {
  const [screen, setScreen] = useState<Screen>("desktop");
  const [size, setSize] = useState<number>(() => loadLastSize(15));
  const [maze, setMaze] = useState<MazeGrid>([]);
  const [player, setPlayer] = useState<Cell>({ x: 0, y: 0 });
  const [trail, setTrail] = useState<Cell[]>([]);
  const [solution, setSolution] = useState<Cell[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [bestTimes, setBestTimes] = useState<BestTimes>(() => loadBestTimes());
  const [gameOver, setGameOver] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState("Find the exit — good luck!");
  const [clock, setClock] = useState("");
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Keep latest settings in a ref so audio/haptic callbacks always see current values
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // ── Clock ────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(
        `${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Music: only play during game ────────────────────────
  useEffect(() => {
    if (screen === "game" && settings.music) {
      resumeAudio();
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [settings.music, screen]);

  // ── Settings change handler ──────────────────────────────
  const handleSettingsChange = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
    if (next.music && screen === "game") {
      resumeAudio();
      startMusic();
    } else stopMusic();
  };

  // ── New maze ─────────────────────────────────────────────
  const startNewMaze = useCallback(
    (newSize?: number) => {
      const s = newSize ?? size;
      if (newSize !== undefined) {
        setSize(s);
        saveLastSize(s);
      }
      const newMaze = generateMaze(s, s);
      setMaze(newMaze);
      setPlayer({ x: 0, y: 0 });
      setTrail([]);
      setSolution([]);
      setMoves(0);
      setElapsed(0);
      setGameOver(false);
      setShowWin(false);
      setStatus("Find the exit — good luck!");
      if (timerRef.current) clearInterval(timerRef.current);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
      }, 1000);
      setScreen("game");
    },
    [size],
  );

  // ── Move handler ─────────────────────────────────────────
  const handleMove = useCallback(
    (dx: number, dy: number) => {
      if (gameOver || maze.length === 0) return;

      setPlayer((prev) => {
        const nx = prev.x + dx,
          ny = prev.y + dy;
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) return prev;
        const bit =
          dx === 0 && dy === -1
            ? 1
            : dx === 1
              ? 2
              : dx === 0 && dy === 1
                ? 4
                : 8;
        if (!(maze[prev.y][prev.x] & bit)) return prev;

        // Haptic feedback on move
        if (settingsRef.current.haptics) vibrateMove();

        setTrail((t) => {
          const next = [...t, prev];
          return next.length > 150 ? next.slice(-150) : next;
        });
        setSolution([]);
        setMoves((m) => {
          const nm = m + 1;
          setStatus(`${nm} move${nm !== 1 ? "s" : ""}`);
          return nm;
        });

        if (nx === size - 1 && ny === size - 1) {
          setGameOver(true);
          if (timerRef.current) clearInterval(timerRef.current);
          const ms = Date.now() - startTimeRef.current!;
          setBestTimes(saveBestTime(size, ms));
          setStatus("🎉 YOU ESCAPED THE MAZE!");

          // Win sounds + haptics
          stopMusic();
          if (settingsRef.current.fanfare) {
            resumeAudio();
            playWinFanfare();
          }
          if (settingsRef.current.haptics) vibrateVictory();

          setTimeout(() => setShowWin(true), 400);
        }

        return { x: nx, y: ny };
      });
    },
    [gameOver, maze, size],
  );

  // ── Keyboard ─────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "game") return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        w: [0, -1],
        W: [0, -1],
        ArrowDown: [0, 1],
        s: [0, 1],
        S: [0, 1],
        ArrowLeft: [-1, 0],
        a: [-1, 0],
        A: [-1, 0],
        ArrowRight: [1, 0],
        d: [1, 0],
        D: [1, 0],
      };
      if (map[e.key]) {
        e.preventDefault();
        handleMove(...map[e.key]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleMove, screen]);

  const handleAutoSolve = () => {
    const sol = solveMaze(
      maze,
      size,
      size,
      player.x,
      player.y,
      size - 1,
      size - 1,
    );
    setSolution(sol);
    setStatus(`Solution: ${sol.length} steps from here`);
  };

  const handleClear = () => {
    setSolution([]);
    setTrail([]);
    setStatus("Path cleared.");
  };

  const handleHint = () => {
    const sol = solveMaze(
      maze,
      size,
      size,
      player.x,
      player.y,
      size - 1,
      size - 1,
    );
    if (sol.length > 1) {
      setSolution([sol[0], sol[1]]);
      const n = sol[1];
      const labels: [number, number, string][] = [
        [0, -1, "North ↑"],
        [1, 0, "East →"],
        [0, 1, "South ↓"],
        [-1, 0, "West ←"],
      ];
      for (const [dx, dy, label] of labels) {
        if (n.x === player.x + dx && n.y === player.y + dy) {
          setStatus(`Hint: go ${label}`);
          break;
        }
      }
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = parseInt(e.target.value);
    setSize(s);
    startNewMaze(s);
  };

  const handleBackToDesktop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopMusic();
    setScreen("desktop");
  };

  const timerDisplay = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`;

  // ── Desktop screen ────────────────────────────────────────
  if (screen === "desktop") {
    return (
      <>
        <Desktop
          onLaunch={startNewMaze}
          clock={clock}
          onSettings={() => {
            resumeAudio();
            setShowSettings(true);
          }}
        />
        {showSettings && (
          <SettingsDialog
            settings={settings}
            onChange={handleSettingsChange}
            onClose={() => setShowSettings(false)}
          />
        )}
      </>
    );
  }

  // ── Game screen ───────────────────────────────────────────
  return (
    <div className="win-wrapper">
      <div className="window">
        {/* Title Bar */}
        <div className="title-bar">
          <div className="title-bar-text">
            🧩 MAZE MASTER 95 — [Untitled Maze]
          </div>
          <div className="title-bar-controls">
            <div className="title-btn">_</div>
            <div className="title-btn">□</div>
            <div className="title-btn close-btn" onClick={handleBackToDesktop}>
              ✕
            </div>
          </div>
        </div>

        {/* Menu Bar */}
        <div className="menu-bar">
          {["File", "Edit", "Maze", "Help"].map((m) => (
            <div key={m} className="menu-item">
              {m}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <button className="win-btn" onClick={() => startNewMaze()}>
            🔄 New Maze
          </button>
          <div className="separator" />
          <span className="toolbar-label">Size:</span>
          <select
            className="win-select"
            value={size}
            onChange={handleSizeChange}
            title="Select maze size"
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="separator" />
          <button className="win-btn" onClick={handleAutoSolve}>
            💡 Auto-Solve
          </button>
          <button className="win-btn" onClick={handleClear}>
            🧹 Clear
          </button>
          <button className="win-btn" onClick={handleHint}>
            ❓ Hint
          </button>
          <div className="separator" />
          <button
            className="win-btn"
            onClick={() => {
              resumeAudio();
              setShowSettings(true);
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Mobile stats bar */}
        <div className="mobile-stats">
          <div className="mobile-stat">
            Moves: <span className="mobile-stat-val">{moves}</span>
          </div>
          <div className="mobile-stat">
            Time: <span className="mobile-stat-val">{timerDisplay}</span>
          </div>
          <div className="mobile-stat">
            Best:{" "}
            <span className="mobile-stat-val">
              {bestTimes[size] !== undefined
                ? formatTime(bestTimes[size])
                : "--:--"}
            </span>
          </div>
        </div>

        {/* Main content */}
        <div className="content">
          <div className="maze-col">
            <MazeCanvas
              maze={maze}
              cols={size}
              rows={size}
              player={player}
              trail={trail}
              solution={solution}
              onMove={handleMove}
            />
          </div>

          <div className="side-panel">
            <div className="group-box">
              <div className="group-label">Stats</div>
              <div className="stat-row">
                <span>Moves:</span>
                <span className="stat-value">{moves}</span>
              </div>
              <div className="stat-row">
                <span>Time:</span>
                <span className="stat-value">{timerDisplay}</span>
              </div>
              <div className="stat-row">
                <span>Best:</span>
                <span className="stat-value">
                  {bestTimes[size] !== undefined
                    ? formatTime(bestTimes[size])
                    : "--:--"}
                </span>
              </div>
            </div>

            <div className="group-box">
              <div className="group-label">Legend</div>
              {[
                { color: "#000", label: "Wall" },
                { color: "#fff", label: "Path", border: true },
                { color: "#cc0000", label: "You ★" },
                { color: "#00aa00", label: "Exit" },
                { color: "rgba(255,140,0,0.5)", label: "Trail" },
                { color: "rgba(255,215,0,0.7)", label: "Solution" },
              ].map(({ color, label, border }) => (
                <div key={label} className="legend-item">
                  <div
                    className="legend-swatch"
                    style={{
                      background: color,
                      border: border ? "1px solid #888" : undefined,
                    }}
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="group-box desktop-only">
              <div className="group-label">Controls</div>
              <div className="instructions">
                Arrow keys
                <br />
                or W A S D<br />
                to move
                <br />
                <br />
                <strong>Swipe</strong> on mobile
                <br />
                <br />
                Reach the
                <br />
                <strong>GREEN</strong> exit!
              </div>
            </div>

            {/* Settings summary on desktop */}
            <div className="group-box desktop-only">
              <div className="group-label">Active</div>
              <div className="instructions" style={{ fontSize: 14 }}>
                {settings.music ? "🎵 Music on" : "🔇 Music off"}
                <br />
                {settings.fanfare ? "🎺 Fanfare on" : "🔕 Fanfare off"}
                <br />
                {settings.haptics ? "📳 Haptics on" : "📵 Haptics off"}
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-segment">{status}</div>
          <div className="status-segment pos-segment">
            {player.x},{player.y}
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      {showSettings && (
        <SettingsDialog
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Win Dialog */}
      {showWin && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="title-bar">
              <div className="title-bar-text">🎉 Congratulations!</div>
              <div className="title-bar-controls">
                <div
                  className="title-btn close-btn"
                  onClick={() => setShowWin(false)}
                >
                  ✕
                </div>
              </div>
            </div>
            <div className="dialog-content">
              <div className="dialog-icon">🏆</div>
              <div className="dialog-text">
                <strong>You escaped the maze!</strong>
                <span>
                  Moves: {moves} | Time: {timerDisplay}
                </span>
              </div>
            </div>
            <div className="dialog-buttons">
              <button className="win-btn" onClick={() => startNewMaze()}>
                Play Again
              </button>
              <button className="win-btn" onClick={handleBackToDesktop}>
                Main Menu
              </button>
              <button className="win-btn" onClick={() => setShowWin(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="start-btn">⊞ Start</button>
        <div className="taskbar-window">🧩 Maze Master 95</div>
        <div className="taskbar-clock">{clock}</div>
      </div>
    </div>
  );
}
