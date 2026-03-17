"use client";

interface DPadProps {
  onMove: (dx: number, dy: number) => void;
}

const BTN_BASE =
  "win-btn dpad-btn select-none touch-manipulation active:dpad-btn-active";

export default function DPad({ onMove }: DPadProps) {
  const press =
    (dx: number, dy: number) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      onMove(dx, dy);
    };

  return (
    <div className="dpad-wrap">
      <div className="dpad-grid">
        {/* Up */}
        <button
          className="win-btn dpad-btn dpad-up"
          onPointerDown={press(0, -1)}
          aria-label="Move up"
        >
          ▲
        </button>

        {/* Middle row */}
        <button
          className="win-btn dpad-btn dpad-left"
          onPointerDown={press(-1, 0)}
          aria-label="Move left"
        >
          ◀
        </button>

        <div className="dpad-center">✛</div>

        <button
          className="win-btn dpad-btn dpad-right"
          onPointerDown={press(1, 0)}
          aria-label="Move right"
        >
          ▶
        </button>

        {/* Down */}
        <button
          className="win-btn dpad-btn dpad-down"
          onPointerDown={press(0, 1)}
          aria-label="Move down"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
