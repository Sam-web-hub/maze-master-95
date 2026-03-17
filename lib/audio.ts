// All sounds built with Web Audio API — no external files needed

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx)
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

export function resumeAudio() {
  try {
    getCtx().resume();
  } catch {}
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function note(name: string): number {
  const notes: Record<string, number> = {
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.0,
    A3: 220.0,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
    A5: 880.0,
    B5: 987.77,
    C6: 1046.5,
  };
  return notes[name] ?? 0;
}

// Schedule a single note on an oscillator channel
function schedNote(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  vol: number,
  type: OscillatorType = "square",
) {
  if (freq === 0) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.008);
  g.gain.setValueAtTime(vol * 0.7, start + dur * 0.5);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

// Kick drum: short sine thump
function schedKick(ac: AudioContext, dest: AudioNode, start: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, start);
  osc.frequency.exponentialRampToValueAtTime(40, start + 0.08);
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(0.5, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
  osc.start(start);
  osc.stop(start + 0.13);
}

// Hi-hat: filtered noise burst
function schedHat(
  ac: AudioContext,
  dest: AudioNode,
  start: number,
  vol = 0.12,
) {
  const bufSize = ac.sampleRate * 0.05;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const g = ac.createGain();
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.04);
  src.start(start);
  src.stop(start + 0.05);
}

// ── Song data ────────────────────────────────────────────────────────────────
// 16-step pattern at 150 BPM, looping
// Each step = one 16th note
// Melody uses "triangle" for a softer lead; bass uses "sawtooth" for warmth

const BPM = 150;
const STEP = 60 / BPM / 4; // 16th note duration
const PATTERN = 32; // steps per loop

// Melody — two bars of a minor-key puzzle theme (A minor)
// 0 = rest
const MELODY_NOTES = [
  "A4",
  "C5",
  0,
  "E5",
  "D5",
  "C5",
  "B4",
  0,
  "A4",
  "G4",
  "A4",
  "C5",
  "E5",
  0,
  "D5",
  "E5",
  "C5",
  "B4",
  "A4",
  0,
  "G4",
  "A4",
  "B4",
  "C5",
  "D5",
  0,
  "E5",
  "C5",
  "A4",
  "G4",
  "A4",
  0,
];

// Harmony — a third below melody, quieter
const HARM_NOTES = [
  "F4",
  "A4",
  0,
  "C5",
  "B4",
  "A4",
  "G4",
  0,
  "F4",
  "E4",
  "F4",
  "A4",
  "C5",
  0,
  "B4",
  "C5",
  "A4",
  "G4",
  "F4",
  0,
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
  0,
  "C5",
  "A4",
  "F4",
  "E4",
  "F4",
  0,
];

// Bass — root + fifth pattern
const BASS_NOTES = [
  "A2",
  "A2",
  "E3",
  "A2",
  "G2",
  "G2",
  "D3",
  "G2",
  "A2",
  "A2",
  "E3",
  "A2",
  "C3",
  "C3",
  "G3",
  "C3",
  "F2",
  "F2",
  "C3",
  "F2",
  "E2",
  "E2",
  "B2",
  "E2",
  "A2",
  "A2",
  "E3",
  "A2",
  "A2",
  "E2",
  "A2",
  "E2",
];

// Kick pattern  (1 = kick)
const KICK = [
  1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0,
  0, 0, 1, 0, 1, 0,
];
// Hi-hat pattern
const HATS = [
  0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
  1, 0, 0, 1, 0, 1,
];

// ── Background music engine ──────────────────────────────────────────────────

let musicNodes: { stop: () => void } | null = null;

export function startMusic() {
  if (musicNodes) return;
  try {
    const ac = getCtx();
    let stopped = false;
    let loop = 0;

    // Master gain with a slight lowpass for warmth
    const master = ac.createGain();
    master.gain.setValueAtTime(0.22, ac.currentTime);
    const warmth = ac.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 3200;
    master.connect(warmth);
    warmth.connect(ac.destination);

    // Per-voice gain busses
    const melBus = ac.createGain();
    melBus.gain.value = 0.55;
    melBus.connect(master);
    const harmBus = ac.createGain();
    harmBus.gain.value = 0.28;
    harmBus.connect(master);
    const bassBus = ac.createGain();
    bassBus.gain.value = 0.5;
    bassBus.connect(master);
    const drumBus = ac.createGain();
    drumBus.gain.value = 0.9;
    drumBus.connect(master);

    const scheduleLoop = (startTime: number) => {
      if (stopped) return;

      for (let s = 0; s < PATTERN; s++) {
        const t = startTime + s * STEP;
        const dur = STEP * 0.82;

        const mFreq =
          typeof MELODY_NOTES[s] === "string"
            ? note(MELODY_NOTES[s] as string)
            : 0;
        const hFreq =
          typeof HARM_NOTES[s] === "string" ? note(HARM_NOTES[s] as string) : 0;
        const bFreq = note(BASS_NOTES[s]);

        if (mFreq) schedNote(ac, melBus, mFreq, t, dur, 0.9, "triangle");
        if (hFreq) schedNote(ac, harmBus, hFreq, t, dur, 0.7, "triangle");
        if (bFreq)
          schedNote(ac, bassBus, bFreq, t, STEP * 1.5, 0.8, "sawtooth");
        if (KICK[s]) schedKick(ac, drumBus, t);
        if (HATS[s]) schedHat(ac, drumBus, t, 0.1);
      }

      const loopDur = PATTERN * STEP;
      loop++;
      const nextStart = startTime + loopDur;
      // Schedule next loop ~100ms before it's needed
      const delay = (nextStart - ac.currentTime - 0.1) * 1000;
      if (!stopped)
        setTimeout(() => scheduleLoop(nextStart), Math.max(0, delay));
    };

    // Small initial delay so first notes don't clip
    scheduleLoop(ac.currentTime + 0.05);

    musicNodes = {
      stop: () => {
        stopped = true;
        try {
          master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.1);
          setTimeout(() => {
            try {
              master.disconnect();
            } catch {}
          }, 200);
        } catch {}
        musicNodes = null;
      },
    };
  } catch {}
}

export function stopMusic() {
  musicNodes?.stop();
}

// ── Win fanfare ──────────────────────────────────────────────────────────────

export function playWinFanfare() {
  try {
    const ac = getCtx();
    const master = ac.createGain();
    master.gain.setValueAtTime(0.22, ac.currentTime);
    master.connect(ac.destination);

    const now = ac.currentTime;

    // Rising arpeggio
    const arp = ["C5", "E5", "G5", "C6"];
    arp.forEach((n, i) => {
      schedNote(ac, master, note(n), now + i * 0.1, 0.18, 0.8, "square");
    });

    // Triumphant chord at the end
    const chord = ["C5", "E5", "G5", "C6"];
    chord.forEach((n) => {
      schedNote(ac, master, note(n), now + 0.44, 0.55, 0.55, "triangle");
    });

    // Kick on the chord hit
    schedKick(ac, master, now + 0.44);

    // Fade out
    master.gain.setValueAtTime(0.22, now + 0.7);
    master.gain.linearRampToValueAtTime(0, now + 1.1);
  } catch {}
}
