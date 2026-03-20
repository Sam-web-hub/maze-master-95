// Audio using HTML Audio API — streams an mp3 from a royalty-free URL
// Track: "8-Bit Perplexion" by Eric Matyas (soundimage.org) — Royalty-Free

const MUSIC_URL =
  "https://soundimage.org/wp-content/uploads/2017/10/8-Bit-Perplexion.mp3";

let musicAudio: HTMLAudioElement | null = null;

export function resumeAudio() {
  // No-op for HTML Audio — autoplay policy handled in startMusic
}

export function startMusic() {
  if (musicAudio) return;
  try {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = "auto";
    const promise = audio.play();
    // Browsers may block autoplay — silently ignore if blocked
    if (promise !== undefined) {
      promise.catch(() => {});
    }
    musicAudio = audio;
  } catch {}
}

export function stopMusic() {
  if (!musicAudio) return;
  try {
    musicAudio.pause();
    musicAudio.currentTime = 0;
    musicAudio.src = "";
  } catch {}
  musicAudio = null;
}

export function pauseMusic() {
  try {
    musicAudio?.pause();
  } catch {}
}

export function resumeMusic() {
  try {
    musicAudio?.play().catch(() => {});
  } catch {}
}

// ── Win fanfare — kept as Web Audio so it works without a file ────────────────
let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
  if (!ctx)
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function schedNote(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  vol: number,
  start: number,
  dur: number,
  type: OscillatorType,
) {
  if (freq <= 0 || dur <= 0) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol * 0.22, start);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.01);
}

function schedKick(ac: AudioContext, dest: AudioNode, start: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, start);
  osc.frequency.exponentialRampToValueAtTime(35, start + 0.08);
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.5, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
  osc.start(start);
  osc.stop(start + 0.13);
}

export function playWinFanfare() {
  try {
    const ac = getCtx();
    ac.resume();
    const out = ac.createGain();
    out.gain.setValueAtTime(0.28, ac.currentTime);
    out.connect(ac.destination);
    const now = ac.currentTime;

    const NOTE: Record<string, number> = {
      C4: 261.63,
      E4: 329.63,
      G4: 392.0,
      C5: 523.25,
      G5: 783.99,
    };

    // Rising arpeggio
    [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5].forEach((f, i) =>
      schedNote(ac, out, f, 0.9, now + i * 0.1, 0.18, "square"),
    );
    // Final chord
    [NOTE.C5, NOTE.G4, NOTE.E4].forEach((f) =>
      schedNote(ac, out, f, 0.55, now + 0.44, 0.55, "triangle"),
    );
    schedKick(ac, out, now + 0.44);

    out.gain.setValueAtTime(0.28, now + 0.72);
    out.gain.linearRampToValueAtTime(0, now + 1.1);
  } catch {}
}
