"use client";

import { useState, useRef } from "react";

interface DesktopProps {
  onLaunch: (size: number) => void;
  onSettings: () => void;
  clock: string;
}

const SIZE_OPTIONS = [
  { label: "Small", sub: "10×10", value: 10, icon: "🗺️" },
  { label: "Medium", sub: "15×15", value: 15, icon: "🧩" },
  { label: "Large", sub: "20×20", value: 20, icon: "🌐" },
  { label: "X-Large", sub: "25×25", value: 25, icon: "🏔️" },
  { label: "Huge", sub: "35×35", value: 35, icon: "🌌" },
];

export default function Desktop({ onLaunch, onSettings, clock }: DesktopProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showReadme, setShowReadme] = useState(false);
  const lastTap = useRef<{ value: number; time: number } | null>(null);

  const handleClick = (value: number) => {
    if (selected === value) onLaunch(value);
    else setSelected(value);
  };

  const handleTouchEnd = (e: React.TouchEvent, value: number) => {
    e.preventDefault();
    const now = Date.now();
    if (
      lastTap.current &&
      lastTap.current.value === value &&
      now - lastTap.current.time < 400
    ) {
      lastTap.current = null;
      onLaunch(value);
    } else {
      lastTap.current = { value, time: now };
      setSelected(value);
    }
  };

  return (
    <div className="desktop">
      <div className="desktop-area" onClick={() => setSelected(null)}>
        {/* Icons grid */}
        <div className="desktop-icons">
          {SIZE_OPTIONS.map(({ label, sub, value, icon }) => (
            <div
              key={value}
              className={`desktop-icon${selected === value ? " desktop-icon-selected" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(value);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleTouchEnd(e, value);
              }}
            >
              <div className="desktop-icon-img">{icon}</div>
              <div className="desktop-icon-label">
                {label}
                <span className="desktop-icon-sub">{sub}</span>
              </div>
            </div>
          ))}

          {/* Settings icon */}
          <div
            className="desktop-icon"
            onClick={(e) => {
              e.stopPropagation();
              onSettings();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSettings();
            }}
          >
            <div className="desktop-icon-img">⚙️</div>
            <div className="desktop-icon-label">Settings</div>
          </div>

          {/* Read Me icon */}
          <div
            className="desktop-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowReadme(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowReadme(true);
            }}
          >
            <div className="desktop-icon-img">📄</div>
            <div className="desktop-icon-label">Read Me</div>
          </div>
        </div>

        {/* Center prompt */}
        <div className="desktop-prompt">
          <div className="desktop-prompt-inner">
            <div className="desktop-prompt-title">🧩 MAZE MASTER 95</div>
            <div className="desktop-prompt-sub">
              Double-click an icon to start
            </div>
          </div>
        </div>
      </div>

      {/* ReadMe Dialog */}
      {showReadme && (
        <div className="dialog-overlay">
          <div className="dialog" style={{ minWidth: 320, maxWidth: 400 }}>
            <div className="title-bar">
              <div className="title-bar-text">📄 Read Me — Maze Master 95</div>
              <div className="title-bar-controls">
                <div
                  className="title-btn close-btn"
                  onClick={() => setShowReadme(false)}
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
                  <strong>💡 Auto-Solve</strong> — highlights the full solution
                  path.
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
              <button className="win-btn" onClick={() => setShowReadme(false)}>
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
