// Vibration API wrappers — silently no-ops on unsupported devices

export function vibrateMove() {
  try {
    navigator.vibrate?.(18);
  } catch {}
}

export function vibrateVictory() {
  // Three escalating bursts: short-short-long
  try {
    navigator.vibrate?.([60, 80, 60, 80, 200]);
  } catch {}
}
