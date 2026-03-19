"use client";

import { useState } from "react";
import { type Algorithm } from "@/lib/maze";

interface DesktopProps {
  onLaunch: (size: number, algorithm: Algorithm) => void;
  onSettings: () => void;
  clock: string;
}

const SIZE_OPTIONS = [
  { label: "Small", sub: "10×10", value: 10 },
  { label: "Medium", sub: "15×15", value: 15 },
  { label: "Large", sub: "20×20", value: 20 },
  { label: "X-Large", sub: "25×25", value: 25 },
  { label: "Huge", sub: "35×35", value: 35 },
];

export default function Desktop({ onLaunch, onSettings, clock }: DesktopProps) {
  const [showPlay, setShowPlay] = useState(false);
  const [showReadme, setShowReadme] = useState(false);
  const [selected, setSelected] = useState(15);
  const [algorithm, setAlgorithm] = useState<Algorithm>("random");

  // Single unified handler — works for both mouse clicks and touch taps.
  // onTouchEnd calls e.preventDefault() to suppress the subsequent synthetic
  // mouse click that browsers fire ~300ms later, preventing double-triggers.
  const makeHandlers = (action: () => void) => ({
    onClick: action,
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
    },
  });

  return (
    <div className="desktop">
      <div className="desktop-area">
        {/* Desktop icons */}
        <div className="desktop-icons">
          {/* Play */}
          <div
            className="desktop-icon"
            {...makeHandlers(() => setShowPlay(true))}
          >
            <div className="desktop-icon-img">🧩</div>
            <div className="desktop-icon-label">Play</div>
          </div>

          {/* Settings */}
          <div className="desktop-icon" {...makeHandlers(onSettings)}>
            <div className="desktop-icon-img">⚙️</div>
            <div className="desktop-icon-label">Settings</div>
          </div>

          {/* Read Me */}
          <div
            className="desktop-icon"
            {...makeHandlers(() => setShowReadme(true))}
          >
            <div className="desktop-icon-img">📄</div>
            <div className="desktop-icon-label">Read Me</div>
          </div>
        </div>
      </div>

      {/* ── Play / size picker dialog ── */}
      {showPlay && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ minWidth: 300 }}>
            <div className="title-bar">
              <div className="title-bar-text">🧩 New Game</div>
              <div className="title-bar-controls">
                <div
                  className="title-btn close-btn"
                  {...makeHandlers(() => setShowPlay(false))}
                >
                  ✕
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "16px 16px 8px",
                fontFamily: "VT323, monospace",
              }}
            >
              <div className="group-box">
                <div className="group-label">Select maze size</div>
                {SIZE_OPTIONS.map(({ label, sub, value }) => (
                  <label
                    key={value}
                    className="settings-row"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="maze-size"
                      className="settings-checkbox"
                      checked={selected === value}
                      onChange={() => setSelected(value)}
                    />
                    <span style={{ fontSize: 17 }}>{label}</span>
                    <span className="settings-hint">{sub}</span>
                  </label>
                ))}
              </div>
            </div>
            <div
              style={{ padding: "0 16px 8px", fontFamily: "VT323, monospace" }}
            >
              <div className="group-box">
                <div className="group-label">Select algorithm</div>
                {(
                  [
                    {
                      value: "recursive",
                      label: "Recursive Backtracker",
                      hint: "Long winding paths",
                    },
                    {
                      value: "prims",
                      label: "Prim's Algorithm",
                      hint: "Bushy, many dead ends",
                    },
                    {
                      value: "random",
                      label: "Surprise Me!",
                      hint: "Random each time",
                    },
                  ] as const
                ).map(({ value, label, hint }) => (
                  <label
                    key={value}
                    className="settings-row"
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="maze-algo"
                      className="settings-checkbox"
                      checked={algorithm === value}
                      onChange={() => setAlgorithm(value)}
                    />
                    <span style={{ fontSize: 17 }}>{label}</span>
                    <span className="settings-hint">{hint}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="dialog-buttons">
              <button
                className="win-btn"
                {...makeHandlers(() => {
                  setShowPlay(false);
                  onLaunch(selected, algorithm);
                })}
              >
                ▶ Play
              </button>
              <button
                className="win-btn"
                {...makeHandlers(() => setShowPlay(false))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ReadMe dialog ── */}
      {showReadme && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ minWidth: 320, maxWidth: 400 }}>
            <div className="title-bar">
              <div className="title-bar-text">📄 Read Me — Maze Master 95</div>
              <div className="title-bar-controls">
                <div
                  className="title-btn close-btn"
                  {...makeHandlers(() => setShowReadme(false))}
                >
                  ✕
                </div>
              </div>
            </div>
            <div
              style={{
                padding: "14px 16px 4px",
                fontFamily: "VT323, monospace",
                fontSize: 17,
                lineHeight: 1.6,
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">🎮 How to Play</div>
                <p>
                  Navigate your red ★ from the <strong>S</strong> (top-left) to
                  the <strong>E</strong> exit (bottom-right). Your orange trail
                  shows where you have been.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">⌨️ Controls</div>
                <p>
                  <strong>Desktop:</strong> Arrow keys or W A S D to move one
                  step at a time.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>Mobile:</strong> Swipe on the maze to move. Keep
                  holding after the swipe to auto-run in that direction — the
                  player stops automatically when it hits a wall. Redirect
                  mid-hold by swiping a new direction without lifting your
                  finger.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">🛠️ Tools</div>
                <p>
                  <strong>💡 Auto-Solve</strong> — highlights the full shortest
                  path from your current position to the exit.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>❓ Hint</strong> — reveals only your very next step.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>🧹 Clear</strong> — removes your trail and any
                  solution highlight.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">🔀 Algorithms</div>
                <p>
                  Choose how your maze is generated — in the New Game dialog or
                  the Algo dropdown in the toolbar:
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>Recursive Backtracker</strong> — carves long winding
                  corridors with a strong single path. Easier to navigate.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>{"Prim's Algorithm"}</strong> — grows the maze outward
                  from a seed, producing a bushy layout packed with short dead
                  ends. Much harder.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>Surprise Me!</strong> — picks one of the two
                  algorithms at random each game.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">⚙️ Settings</div>
                <p>
                  <strong>🎵 Background music</strong> — chiptune loop that
                  plays during the game.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>🎺 Win fanfare</strong> — plays a short jingle when
                  you reach the exit.
                </p>
                <p style={{ marginTop: 4 }}>
                  <strong>📳 Haptics</strong> — vibrates on each move and plays
                  a victory pattern when you win. Mobile only.
                </p>
                <p style={{ marginTop: 4 }}>
                  Access settings from the ⚙️ desktop icon or the ⚙️ toolbar
                  button in-game.
                </p>
              </div>
            </div>
            <div className="dialog-buttons">
              <button
                className="win-btn"
                {...makeHandlers(() => setShowReadme(false))}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="start-btn">⊞ Start</button>
        <div className="taskbar-clock">{clock}</div>
      </div>
    </div>
  );
}
