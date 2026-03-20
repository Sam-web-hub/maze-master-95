// Background music — 4-channel FamiTracker conversion
// Note-level lookahead scheduler, each event pre-tagged with its output bus

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

// ── Note frequencies ──────────────────────────────────────────────────────────
const NOTE_FREQ: Record<string, number> = {
  C0: 16.35,
  "C#0": 17.32,
  "D#0": 19.45,
  "F#0": 23.12,
  "G#0": 25.96,
  "A#0": 29.14,
  C1: 32.7,
  "C#1": 34.65,
  "D#1": 38.89,
  E1: 41.2,
  "F#1": 46.25,
  "G#1": 51.91,
  "A#1": 58.27,
  B1: 61.74,
  C2: 65.41,
  "C#2": 69.3,
  "D#2": 77.78,
  E2: 82.41,
  "F#2": 92.5,
  "G#2": 103.83,
  "A#2": 116.54,
  C3: 130.81,
  "C#3": 138.59,
  "D#3": 155.56,
  E3: 164.81,
  "F#3": 185.0,
  "G#3": 207.65,
  "A#3": 233.08,
  B3: 246.94,
  C4: 261.63,
  "C#4": 277.18,
  "D#4": 311.13,
  E4: 329.63,
  "F#4": 369.99,
  "G#4": 415.3,
  "A#4": 466.16,
  B4: 493.88,
  C5: 523.25,
  "C#5": 554.37,
  "D#5": 622.25,
  E5: 659.25,
  "F#5": 739.99,
  "G#5": 830.61,
  "A#5": 932.33,
};

function resolve(n: string): number {
  const norm = n
    .replace(/^G-/, "G#")
    .replace(/^E-/, "D#")
    .replace(/^A-/, "G#")
    .replace(/^B-/, "A#")
    .replace(/^D-/, "C#")
    .replace(/^C-/, "C");
  return NOTE_FREQ[norm] ?? 0;
}

const ROW_SEC = 60 / 150 / 6;

// ── Instruments ───────────────────────────────────────────────────────────────
function playNote(
  ac: AudioContext,
  dest: AudioNode,
  freq: number,
  vol: number,
  start: number,
  dur: number,
  type: OscillatorType,
) {
  if (freq <= 0 || vol <= 0 || dur <= 0) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(dest);
  const v = vol * 0.14;
  g.gain.setValueAtTime(v, start);
  g.gain.setValueAtTime(v * 0.6, start + dur * 0.5);
  g.gain.linearRampToValueAtTime(0, start + dur);
  osc.start(start);
  osc.stop(start + dur + 0.005);
}

function playKick(
  ac: AudioContext,
  dest: AudioNode,
  start: number,
  vol: number,
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, start);
  osc.frequency.exponentialRampToValueAtTime(30, start + 0.08);
  osc.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol * 0.55, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
  osc.start(start);
  osc.stop(start + 0.13);
}

function playSnare(
  ac: AudioContext,
  dest: AudioNode,
  start: number,
  vol: number,
) {
  const len = Math.ceil(ac.sampleRate * 0.1);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filt = ac.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = 1200;
  filt.Q.value = 1;
  const g = ac.createGain();
  src.connect(filt);
  filt.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol * 0.4, start);
  src.start(start);
  src.stop(start + 0.11);
}

function playHat(
  ac: AudioContext,
  dest: AudioNode,
  start: number,
  vol: number,
) {
  const len = Math.ceil(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filt = ac.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = 9000;
  const g = ac.createGain();
  src.connect(filt);
  filt.connect(g);
  g.connect(dest);
  g.gain.setValueAtTime(vol * 0.18, start);
  src.start(start);
  src.stop(start + 0.035);
}

// ── Song data ─────────────────────────────────────────────────────────────────
const CH1_RAW: [string, number][] = [
  ["C#1", 0x6a],
  ["", 0xa2],
  ["", 0x17],
  ["", 0xd8],
  ["", 0x8a],
  ["", 0x0a],
  ["", 0x80],
  ["", 0xa4],
  ["C#1", 0xa5],
  ["", 0xb1],
  ["", 0xfd],
  ["", 0x46],
  ["", 0x2e],
  ["", 0x8b],
  ["", 0x7e],
  ["", 0x43],
  ["C#1", 0x9f],
  ["", 0xb9],
  ["", 0x5b],
  ["", 0x32],
  ["", 0xe3],
  ["", 0xe5],
  ["", 0xaa],
  ["", 0x27],
  ["C#1", 0xda],
  ["", 0x90],
  ["", 0x20],
  ["", 0x2d],
  ["", 0xfa],
  ["", 0xbf],
  ["", 0x72],
  ["", 0x8b],
  ["F#0", 0x97],
  ["", 0xee],
  ["", 0x7e],
  ["", 0x58],
  ["", 0x91],
  ["", 0xaf],
  ["", 0x72],
  ["", 0xc8],
  ["F#0", 0x67],
  ["", 0x95],
  ["", 0x78],
  ["", 0xae],
  ["", 0xd4],
  ["", 0x66],
  ["", 0xb3],
  ["", 0xb7],
  ["F#0", 0x47],
  ["", 0xbc],
  ["", 0xd3],
  ["", 0x8a],
  ["", 0xbb],
  ["", 0x1c],
  ["", 0xbf],
  ["", 0xca],
  ["F#0", 0xc7],
  ["", 0x36],
  ["", 0xf9],
  ["", 0xd0],
  ["", 0xf7],
  ["", 0x96],
  ["", 0xcd],
  ["", 0x47],
];
const CH2_RAW: [string, number][] = [
  ["G#4", 0x27],
  ["E-4", 0x3a],
  ["C#4", 0x4e],
  ["C#4", 0x62],
  ["E-3", 0x75],
  ["G#4", 0x89],
  ["C#3", 0x9c],
  ["G#3", 0xb0],
  ["G#3", 0xc4],
  ["G#4", 0xd7],
  ["E-4", 0x00],
  ["G#3", 0x13],
  ["C#4", 0x27],
  ["E-4", 0x3a],
  ["C#4", 0x4e],
  ["E-4", 0x62],
  ["C#3", 0x75],
  ["E-4", 0x89],
  ["G#4", 0x9c],
  ["E-3", 0xb0],
  ["G#4", 0xc4],
  ["G#4", 0xd7],
  ["E-4", 0x00],
  ["G#4", 0x13],
  ["G#4", 0x27],
  ["C#4", 0x3a],
  ["G#4", 0x4e],
  ["G#3", 0x62],
  ["G#4", 0x75],
  ["G#4", 0x89],
  ["C#4", 0x9c],
  ["G#3", 0xb0],
  ["C#3", 0xc4],
  ["C#3", 0xd7],
  ["C#4", 0x00],
  ["A-5", 0x13],
  ["F#4", 0x27],
  ["A-5", 0x3a],
  ["F#4", 0x4e],
  ["A-4", 0x62],
  ["A-4", 0x75],
  ["F#4", 0x89],
  ["C#4", 0x9c],
  ["F#3", 0xb0],
  ["C#4", 0xc4],
  ["F#4", 0xd7],
  ["A-4", 0x00],
  ["F#4", 0x13],
  ["A-5", 0x27],
  ["A-5", 0x3a],
  ["C#3", 0x4e],
  ["C#4", 0x62],
  ["A-4", 0x75],
  ["C#4", 0x89],
  ["A-4", 0x9c],
  ["A-5", 0xb0],
  ["C#4", 0xc4],
  ["C#3", 0xd7],
  ["A-4", 0x00],
  ["C#3", 0x13],
  ["F#3", 0x27],
  ["C#4", 0x3a],
  ["A-4", 0x4e],
  ["F#3", 0x62],
];
const CH3_RAW: [string, number][] = [
  ["G#4", 0x7c],
  ["", 0x6f],
  ["", 0x62],
  ["G#4", 0x56],
  ["E-4", 0x62],
  ["D#4", 0x6f],
  ["C#4", 0x7c],
  ["D#4", 0x6f],
  ["", 0x7c],
  ["D#4", 0x6f],
  ["", 0x7c],
  ["D#4", 0x89],
  ["C#4", 0x95],
  ["B-4", 0x89],
  ["D#4", 0x7c],
  ["C#4", 0x89],
  ["C#4", 0x95],
  ["D#4", 0xa2],
  ["B-4", 0x95],
  ["G#3", 0x89],
  ["F#3", 0x7c],
  ["D#3", 0x6f],
  ["C#3", 0x7c],
  ["B-3", 0x6f],
  ["", 0x62],
  ["B-3", 0x6f],
  ["B-3", 0x62],
  ["A-3", 0x56],
  ["", 0x62],
  ["G#2", 0x6f],
  ["E-2", 0x62],
  ["D#2", 0x6f],
  ["D#2", 0x7c],
  ["", 0x6f],
  ["D#2", 0x62],
  ["D#2", 0x6f],
  ["", 0x62],
  ["D#2", 0x6f],
  ["", 0x62],
  ["E-2", 0x6f],
  ["D#2", 0x62],
  ["D#2", 0x6f],
  ["", 0x7c],
  ["", 0x6f],
  ["D#2", 0x62],
  ["E-2", 0x56],
  ["F#2", 0x62],
  ["G#2", 0x56],
  ["", 0x49],
  ["G#2", 0x56],
  ["", 0x62],
  ["G#2", 0x56],
  ["G#2", 0x62],
  ["G#2", 0x56],
  ["", 0x62],
  ["A-3", 0x6f],
  ["", 0x62],
  ["G#2", 0x56],
  ["F#2", 0x49],
  ["G#2", 0x56],
  ["G#2", 0x49],
  ["F#2", 0x3c],
  ["", 0x2f],
  ["G#2", 0x23],
];
const CH4_RAW: [string, number][] = [
  ["G#2", 0x75],
  ["C#2", 0x89],
  ["E-2", 0x9c],
  ["G#2", 0xb0],
  ["C#2", 0xc4],
  ["E-1", 0xd7],
  ["C#1", 0x00],
  ["C#2", 0x13],
  ["E-2", 0x27],
  ["G#2", 0x3a],
  ["C#1", 0x4e],
  ["E-1", 0x62],
  ["G#1", 0x75],
  ["G#1", 0x89],
  ["C#2", 0x9c],
  ["G#1", 0xb0],
  ["C#1", 0xc4],
  ["C#1", 0xd7],
  ["G#2", 0x00],
  ["C#2", 0x13],
  ["G#1", 0x27],
  ["C#1", 0x3a],
  ["E-2", 0x4e],
  ["C#1", 0x62],
  ["E-1", 0x75],
  ["C#1", 0x89],
  ["C#1", 0x9c],
  ["G#2", 0xb0],
  ["E-1", 0xc4],
  ["C#2", 0xd7],
  ["E-2", 0x00],
  ["E-1", 0x13],
  ["A-2", 0x27],
  ["A-2", 0x3a],
  ["F#2", 0x4e],
  ["C#1", 0x62],
  ["C#1", 0x75],
  ["C#1", 0x89],
  ["A-2", 0x9c],
  ["C#1", 0xb0],
  ["F#1", 0xc4],
  ["A-2", 0xd7],
  ["C#2", 0x00],
  ["F#2", 0x13],
  ["A-2", 0x27],
  ["C#1", 0x3a],
  ["C#2", 0x4e],
  ["A-3", 0x62],
  ["C#1", 0x75],
  ["F#1", 0x89],
  ["F#2", 0x9c],
  ["C#2", 0xb0],
  ["C#2", 0xc4],
  ["A-2", 0xd7],
  ["C#2", 0x00],
  ["F#2", 0x13],
  ["C#1", 0x27],
  ["A-3", 0x3a],
  ["F#1", 0x4e],
  ["A-2", 0x62],
  ["C#1", 0x75],
  ["C#1", 0x89],
  ["C#1", 0x9c],
  ["A-2", 0xb0],
];
const CH5_RAW: [string, number][] = [
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["KCK", 0x99],
  ["NSS", 0xcc],
  ["SNR", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["KCK", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["KCK", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
  ["SNR", 0xcc],
  ["NSS", 0x99],
  ["NSS", 0xcc],
  ["NSS", 0x99],
];

// ── Pre-build flat event list, each tagged with bus id ────────────────────────
type DrumType = "kick" | "snare" | "hat";
type BusId = "ch1" | "ch2" | "ch3" | "ch4" | "drm";
type NoteEvent = {
  t: number;
  dur: number;
  freq: number;
  vol: number;
  oscType?: OscillatorType;
  drumType?: DrumType;
  bus: BusId;
};

function buildMelodic(
  raw: [string, number][],
  oscType: OscillatorType,
  bus: BusId,
): NoteEvent[] {
  const events: NoteEvent[] = [];
  let row = 0;
  let lastFreq = 0;
  for (const [note, waitHex] of raw) {
    const wait = waitHex || 1;
    if (note) lastFreq = resolve(note);
    if (lastFreq > 0) {
      events.push({
        t: row * ROW_SEC,
        dur: wait * ROW_SEC * 0.82,
        freq: lastFreq,
        vol: 1,
        oscType,
        bus,
      });
    }
    row += wait;
  }
  return events;
}

function buildDrums(raw: [string, number][]): NoteEvent[] {
  return raw.map(([type, volHex], i) => {
    const vol = volHex / 0xff;
    const drumType = type === "KCK" ? "kick" : type === "SNR" ? "snare" : "hat";
    return {
      t: i * ROW_SEC,
      dur: ROW_SEC * 0.5,
      freq: 0,
      vol,
      drumType,
      bus: "drm",
    } as NoteEvent;
  });
}

const LOOP_SEC = 64 * ROW_SEC;
const ALL_NOTES = [
  ...buildMelodic(CH1_RAW, "square", "ch1"),
  ...buildMelodic(CH2_RAW, "square", "ch2"),
  ...buildMelodic(CH3_RAW, "triangle", "ch3"),
  ...buildMelodic(CH4_RAW, "sawtooth", "ch4"),
  ...buildDrums(CH5_RAW),
].sort((a, b) => a.t - b.t);

// ── Music engine ──────────────────────────────────────────────────────────────
let musicNodes: { stop: () => void } | null = null;

export function startMusic() {
  if (musicNodes) return;
  try {
    const ac = getCtx();
    let stopped = false;

    const master = ac.createGain();
    master.gain.setValueAtTime(0, ac.currentTime);
    master.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.4);
    const lpf = ac.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 6000;
    master.connect(lpf);
    lpf.connect(ac.destination);

    const buses: Record<BusId, GainNode> = {
      ch1: ac.createGain(),
      ch2: ac.createGain(),
      ch3: ac.createGain(),
      ch4: ac.createGain(),
      drm: ac.createGain(),
    };
    buses.ch1.gain.value = 1.0;
    buses.ch1.connect(master);
    buses.ch2.gain.value = 0.8;
    buses.ch2.connect(master);
    buses.ch3.gain.value = 0.9;
    buses.ch3.connect(master);
    buses.ch4.gain.value = 0.6;
    buses.ch4.connect(master);
    buses.drm.gain.value = 1.0;
    buses.drm.connect(master);

    const LOOKAHEAD = 0.3;
    const TICK_MS = 100;
    let nextIdx = 0;
    let loopStart = ac.currentTime + 0.05;

    const tick = () => {
      if (stopped) return;
      const horizon = ac.currentTime + LOOKAHEAD;

      while (true) {
        if (nextIdx >= ALL_NOTES.length) {
          nextIdx = 0;
          loopStart += LOOP_SEC;
        }
        const ev = ALL_NOTES[nextIdx];
        const absT = loopStart + ev.t;
        if (absT > horizon) break;

        const dest = buses[ev.bus];
        if (ev.drumType === "kick") playKick(ac, dest, absT, ev.vol);
        else if (ev.drumType === "snare") playSnare(ac, dest, absT, ev.vol);
        else if (ev.drumType === "hat") playHat(ac, dest, absT, ev.vol);
        else if (ev.oscType)
          playNote(ac, dest, ev.freq, ev.vol, absT, ev.dur, ev.oscType);

        nextIdx++;
      }

      setTimeout(tick, TICK_MS);
    };

    tick();

    musicNodes = {
      stop: () => {
        stopped = true;
        try {
          master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.2);
          setTimeout(() => {
            try {
              master.disconnect();
            } catch {}
          }, 400);
        } catch {}
        musicNodes = null;
      },
    };
  } catch {}
}

export function stopMusic() {
  musicNodes?.stop();
}

// ── Win fanfare ───────────────────────────────────────────────────────────────
export function playWinFanfare() {
  try {
    const ac = getCtx();
    const out = ac.createGain();
    out.gain.setValueAtTime(0.25, ac.currentTime);
    out.connect(ac.destination);
    const now = ac.currentTime;
    ["C#4", "E-4", "G#4", "C#5"].forEach((n, i) =>
      playNote(ac, out, resolve(n), 1, now + i * 0.1, 0.18, "square"),
    );
    ["C#5", "G#4", "E-4"].forEach((n) =>
      playNote(ac, out, resolve(n), 1, now + 0.44, 0.5, "triangle"),
    );
    playKick(ac, out, now + 0.44, 0.8);
    out.gain.setValueAtTime(0.25, now + 0.7);
    out.gain.linearRampToValueAtTime(0, now + 1.1);
  } catch {}
}
