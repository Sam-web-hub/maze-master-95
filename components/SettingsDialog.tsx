"use client";

export interface Settings {
  music: boolean;
  fanfare: boolean;
  haptics: boolean;
}

interface SettingsDialogProps {
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

export default function SettingsDialog({
  settings,
  onChange,
  onClose,
}: SettingsDialogProps) {
  const toggle = (key: keyof Settings) =>
    onChange({ ...settings, [key]: !settings[key] });

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ minWidth: 320 }}>
        {/* Title bar */}
        <div className="title-bar">
          <div className="title-bar-text">⚙️ Settings</div>
          <div className="title-bar-controls">
            <div className="title-btn close-btn" onClick={onClose}>
              ✕
            </div>
          </div>
        </div>

        <div className="settings-body">
          {/* Sound section */}
          <div className="group-box" style={{ marginBottom: 10 }}>
            <div className="group-label">🔊 Sound</div>

            <label className="settings-row">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.music}
                onChange={() => toggle("music")}
              />
              <span>Background music</span>
            </label>

            <label className="settings-row">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.fanfare}
                onChange={() => toggle("fanfare")}
              />
              <span>Win fanfare</span>
            </label>
          </div>

          {/* Haptics section */}
          <div className="group-box">
            <div className="group-label">📳 Haptics</div>

            <label className="settings-row">
              <input
                type="checkbox"
                className="settings-checkbox"
                checked={settings.haptics}
                onChange={() => toggle("haptics")}
              />
              <span>Vibration feedback</span>
              <span className="settings-hint">(move + victory)</span>
            </label>
          </div>
        </div>

        <div className="dialog-buttons">
          <button className="win-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
