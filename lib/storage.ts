/**
 * Local-storage helpers for Maze Master 95.
 *
 * Stored keys:
 *   mm95_settings   – { music, fanfare, haptics }
 *   mm95_best_times – { [size: number]: number }  (ms per maze size)
 *   mm95_last_size  – number  (last selected maze size)
 */

import type { Settings } from "@/components/SettingsDialog";

const KEYS = {
  settings: "mm95_settings",
  bestTimes: "mm95_best_times",
  lastSize: "mm95_last_size",
} as const;

// ── Generic helpers ──────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage quota exceeded or private-browsing restriction — fail silently
  }
}

// ── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: Settings = {
  music: false,
  fanfare: true,
  haptics: true,
};

export function loadSettings(): Settings {
  return load<Settings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Settings): void {
  save(KEYS.settings, settings);
}

// ── Best times (per maze size) ────────────────────────────────────────────────

export type BestTimes = Record<number, number>; // size → ms

export function loadBestTimes(): BestTimes {
  return load<BestTimes>(KEYS.bestTimes, {});
}

export function saveBestTime(size: number, ms: number): BestTimes {
  const times = loadBestTimes();
  if (times[size] === undefined || ms < times[size]) {
    times[size] = ms;
    save(KEYS.bestTimes, times);
  }
  return times;
}

// ── Last selected maze size ───────────────────────────────────────────────────

export function loadLastSize(fallback = 15): number {
  return load<number>(KEYS.lastSize, fallback);
}

export function saveLastSize(size: number): void {
  save(KEYS.lastSize, size);
}
