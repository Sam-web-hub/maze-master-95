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
              }}
            >
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">🎮 How to Play</div>
                <p>
                  Navigate your red ★ from the <strong>S</strong> (top-left) to
                  the <strong>E</strong> exit (bottom-right).
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">⌨️ Controls</div>
                <p>
                  <strong>Desktop:</strong> Arrow keys or W A S D
                </p>
                <p>
                  <strong>Mobile:</strong> Swipe on the maze. Hold your swipe to
                  keep moving — change direction mid-swipe to turn.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">🛠️ Tools</div>
                <p>
                  <strong>💡 Auto-Solve</strong> — highlights the full solution.
                </p>
                <p>
                  <strong>❓ Hint</strong> — shows just your next step.
                </p>
                <p>
                  <strong>🧹 Clear</strong> — removes trail and solution.
                </p>
              </div>
              <div className="group-box" style={{ marginBottom: 10 }}>
                <div className="group-label">⚙️ Settings</div>
                <p>
                  Toggle background music, win fanfare, and haptic vibration
                  from the Settings icon or the ⚙️ button in the toolbar.
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
