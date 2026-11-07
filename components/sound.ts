import { useEffect } from 'react';

// Computer sounds, played with the Web Audio API (web only; silent elsewhere).
//
// Every named sound is synthesized by default. To use your own recordings instead,
// put files in public/sounds/ named after the sound, e.g. public/sounds/startup.wav
// (or .mp3). If a file is there it's played; otherwise the built-in version is used.
//
// The machine itself also makes noise while it's on: a fan hum, a hard disk that
// spins up, and seek clicks whenever the disk is busy.

export type SoundName =
  | 'startup' // logging on (the Windows start-up sound)
  | 'shutdown' // shutting down or restarting
  | 'logoff' // logging off
  | 'error'
  | 'warning'
  | 'info'
  | 'question'
  | 'beep'; // the BIOS power-on self-test beep

const FILE_TYPES = ['wav', 'mp3'];
const MUTE_KEY = 'win2000sim:muted';
const VOLUME_KEY = 'win2000sim:volume';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let machine: { stop: () => void } | null = null;
let muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1';
let volume = (() => {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(VOLUME_KEY) : null;
  const saved = raw === null ? NaN : Number(raw);
  return saved >= 0 && saved <= 1 ? saved : 0.8;
})();
const volumeListeners = new Set<(volume: number) => void>();

/** The level the master output should be at: silent when muted, else the volume (squared, so the slider feels even). */
const outputGain = () => (muted ? 0 : volume * volume);
const listeners = new Set<(muted: boolean) => void>();
const files = new Map<SoundName, Promise<AudioBuffer | null>>();

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = outputGain();
  master.connect(ctx.destination);
  return ctx;
}

/** Browsers only allow sound after the user clicks or types; call this from such an event. */
export function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

// Any click or key press unlocks audio, so sounds work no matter where the user starts.
if (typeof window !== 'undefined') {
  const once = () => unlockAudio();
  window.addEventListener('pointerdown', once, { capture: true });
  window.addEventListener('keydown', once, { capture: true });
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof localStorage !== 'undefined') localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  if (master && ctx) master.gain.setTargetAtTime(outputGain(), ctx.currentTime, 0.02);
  listeners.forEach((l) => l(value));
}

export function getVolume() {
  return volume;
}

/** Sets the master volume, from 0 to 1. */
export function setVolume(value: number) {
  volume = Math.min(1, Math.max(0, value));
  if (typeof localStorage !== 'undefined') localStorage.setItem(VOLUME_KEY, String(volume));
  if (master && ctx) master.gain.setTargetAtTime(outputGain(), ctx.currentTime, 0.02);
  volumeListeners.forEach((l) => l(volume));
}

export function onVolumeChange(listener: (volume: number) => void): () => void {
  volumeListeners.add(listener);
  return () => volumeListeners.delete(listener);
}

export function onMuteChange(listener: (muted: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------- user-supplied files ----------

function loadFile(name: SoundName): Promise<AudioBuffer | null> {
  let job = files.get(name);
  if (job) return job;
  job = (async () => {
    const c = audio();
    if (!c) return null;
    for (const ext of FILE_TYPES) {
      try {
        const res = await fetch(`/sounds/${name}.${ext}`);
        // The dev server answers unknown paths with the app's HTML page, so check the type.
        if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) continue;
        return await c.decodeAudioData(await res.arrayBuffer());
      } catch {
        // Try the next file type, then fall back to the built-in sound.
      }
    }
    return null;
  })();
  files.set(name, job);
  return job;
}

// Start looking for files early so the first sound isn't delayed.
export function preloadSounds() {
  (['startup', 'shutdown', 'logoff', 'error', 'warning', 'info', 'question', 'beep'] as SoundName[]).forEach(loadFile);
}

/** Plays a named sound. Resolves when it has finished. */
export async function playSound(name: SoundName): Promise<void> {
  const c = audio();
  if (!c || !master) return;
  const buffer = await loadFile(name);
  if (buffer) {
    const src = c.createBufferSource();
    src.buffer = buffer;
    src.connect(master);
    src.start();
    return new Promise((resolve) => (src.onended = () => resolve()));
  }
  const seconds = SYNTHS[name](c, master, c.currentTime + 0.02);
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

// ---------- synthesizer helpers ----------

/** A single note with a soft attack and an exponential release. */
function tone(
  c: AudioContext,
  out: AudioNode,
  { freq, start, length, volume = 0.2, type = 'sine', attack = 0.01 }: {
    freq: number;
    start: number;
    length: number;
    volume?: number;
    type?: OscillatorType;
    attack?: number;
  },
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

/** A feedback echo, to give chimes some room. */
function echo(c: AudioContext, out: AudioNode, time = 0.18, feedback = 0.35): AudioNode {
  const input = c.createGain();
  const delay = c.createDelay(1);
  const fb = c.createGain();
  const wet = c.createGain();
  delay.delayTime.value = time;
  fb.gain.value = feedback;
  wet.gain.value = 0.5;
  input.connect(out);
  input.connect(delay);
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(out);
  return input;
}

function noiseBuffer(c: AudioContext, seconds: number, brown = false): AudioBuffer {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    } else {
      d[i] = white;
    }
  }
  return buf;
}

const note = (n: number) => 440 * 2 ** ((n - 69) / 12); // MIDI note number to Hz

// ---------- built-in sounds (all original) ----------

/** Each synth schedules its sound at `t` and returns how long it lasts, in seconds. */
const SYNTHS: Record<SoundName, (c: AudioContext, out: AudioNode, t: number) => number> = {
  // A warm rising arpeggio that settles on a held chord.
  startup: (c, out, t) => {
    const room = echo(c, out, 0.22, 0.3);
    const notes = [60, 67, 64, 71, 74, 79];
    notes.forEach((n, i) => {
      tone(c, room, { freq: note(n), start: t + i * 0.16, length: 1.6, volume: 0.12, type: 'triangle' });
      tone(c, room, { freq: note(n + 12), start: t + i * 0.16, length: 0.9, volume: 0.03 });
    });
    [48, 55, 64, 71].forEach((n) =>
      tone(c, room, { freq: note(n), start: t + 0.95, length: 2.8, volume: 0.07, attack: 0.35 }),
    );
    return 4;
  },
  // The same colors, falling and fading away.
  shutdown: (c, out, t) => {
    const room = echo(c, out, 0.25, 0.3);
    [79, 74, 71, 67, 64, 60].forEach((n, i) =>
      tone(c, room, { freq: note(n), start: t + i * 0.2, length: 1.4, volume: 0.11, type: 'triangle' }),
    );
    [45, 52, 60].forEach((n) => tone(c, room, { freq: note(n), start: t + 1.1, length: 2.4, volume: 0.06, attack: 0.3 }));
    return 3.6;
  },
  logoff: (c, out, t) => {
    const room = echo(c, out);
    tone(c, room, { freq: note(72), start: t, length: 0.9, volume: 0.12, type: 'triangle' });
    tone(c, room, { freq: note(67), start: t + 0.22, length: 1.2, volume: 0.12, type: 'triangle' });
    return 1.6;
  },
  error: (c, out, t) => {
    tone(c, out, { freq: note(57), start: t, length: 0.5, volume: 0.14, type: 'triangle' });
    tone(c, out, { freq: note(63), start: t, length: 0.5, volume: 0.1, type: 'triangle' });
    return 0.6;
  },
  warning: (c, out, t) => {
    tone(c, out, { freq: note(76), start: t, length: 0.25, volume: 0.13, type: 'triangle' });
    tone(c, out, { freq: note(76), start: t + 0.16, length: 0.4, volume: 0.13, type: 'triangle' });
    return 0.6;
  },
  info: (c, out, t) => {
    tone(c, out, { freq: note(84), start: t, length: 0.8, volume: 0.13 });
    tone(c, out, { freq: note(96), start: t, length: 0.3, volume: 0.03 });
    return 0.8;
  },
  question: (c, out, t) => {
    tone(c, out, { freq: note(76), start: t, length: 0.3, volume: 0.12, type: 'triangle' });
    tone(c, out, { freq: note(81), start: t + 0.14, length: 0.5, volume: 0.12, type: 'triangle' });
    return 0.7;
  },
  // A PC speaker: a plain square wave.
  beep: (c, out, t) => {
    tone(c, out, { freq: 990, start: t, length: 0.18, volume: 0.07, type: 'square', attack: 0.002 });
    return 0.2;
  },
};

// ---------- the machine: fan, hard disk, floppy ----------

/** Powers the computer on: fan hum and a hard disk spinning up. Safe to call twice. */
export function startMachine() {
  const c = audio();
  if (!c || !master || machine) return;
  const t = c.currentTime;

  // Fan: low brown noise, gently filtered.
  const fan = c.createBufferSource();
  fan.buffer = noiseBuffer(c, 4, true);
  fan.loop = true;
  const fanFilter = c.createBiquadFilter();
  fanFilter.type = 'lowpass';
  fanFilter.frequency.value = 500;
  const fanGain = c.createGain();
  fanGain.gain.setValueAtTime(0.0001, t);
  fanGain.gain.exponentialRampToValueAtTime(0.05, t + 1.5);
  fan.connect(fanFilter).connect(fanGain).connect(master);
  fan.start(t);

  // Hard disk platters: a whine that rises as the disk spins up, then settles quietly.
  const motor = c.createOscillator();
  motor.type = 'sine';
  motor.frequency.setValueAtTime(40, t);
  motor.frequency.exponentialRampToValueAtTime(120, t + 3.5);
  const motorGain = c.createGain();
  motorGain.gain.setValueAtTime(0.0001, t);
  motorGain.gain.exponentialRampToValueAtTime(0.025, t + 2);
  motorGain.gain.exponentialRampToValueAtTime(0.008, t + 5);
  const whine = c.createOscillator();
  whine.type = 'sine';
  whine.frequency.setValueAtTime(300, t);
  whine.frequency.exponentialRampToValueAtTime(1200, t + 3.5);
  const whineGain = c.createGain();
  whineGain.gain.setValueAtTime(0.0001, t);
  whineGain.gain.exponentialRampToValueAtTime(0.006, t + 2.5);
  whineGain.gain.exponentialRampToValueAtTime(0.0015, t + 6);
  motor.connect(motorGain).connect(master);
  whine.connect(whineGain).connect(master);
  motor.start(t);
  whine.start(t);

  machine = {
    stop: () => {
      const now = c.currentTime;
      // Spin down: everything slows and fades over a couple of seconds.
      for (const g of [fanGain, motorGain, whineGain]) {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
      }
      motor.frequency.cancelScheduledValues(now);
      motor.frequency.setValueAtTime(motor.frequency.value, now);
      motor.frequency.exponentialRampToValueAtTime(30, now + 2.5);
      whine.frequency.cancelScheduledValues(now);
      whine.frequency.setValueAtTime(whine.frequency.value, now);
      whine.frequency.exponentialRampToValueAtTime(200, now + 2.5);
      for (const n of [fan, motor, whine]) n.stop(now + 2.6);
    },
  };
}

/** Powers the computer off: the fan and disk spin down. */
export function stopMachine() {
  machine?.stop();
  machine = null;
}

let clickNoise: AudioBuffer | null = null;

/** One hard disk head seek: a short dry click. */
function seek(c: AudioContext, out: AudioNode, t: number, loud = 1) {
  clickNoise ??= noiseBuffer(c, 0.05);
  const src = c.createBufferSource();
  src.buffer = clickNoise;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1800 + Math.random() * 2500;
  band.Q.value = 1.2;
  const g = c.createGain();
  const length = 0.008 + Math.random() * 0.012;
  g.gain.setValueAtTime(0.25 * loud, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(band).connect(g).connect(out);
  src.start(t, Math.random() * 0.03, length + 0.01);
}

/** The hard disk is busy for a while: a burst of seek clicks. Only while the machine is on. */
export function diskActivity(ms = 500, intensity = 1) {
  const c = audio();
  if (!c || !master || !machine) return;
  let t = c.currentTime + 0.01;
  const end = t + ms / 1000;
  while (t < end) {
    seek(c, master, t, 0.5 + Math.random() * 0.5);
    // Seeks come in little clusters with pauses between them.
    t += Math.random() < 0.3 ? 0.1 + Math.random() * 0.25 / intensity : 0.025 + Math.random() * 0.05;
  }
}

/** A floppy drive checking itself: the stepper motor buzzes back and forth. */
export function floppySeek() {
  const c = audio();
  if (!c || !master) return;
  const t = c.currentTime + 0.01;
  for (let pass = 0; pass < 2; pass++) {
    const start = t + pass * 0.45;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(pass ? 260 : 220, start);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.03, start + 0.02);
    g.gain.setValueAtTime(0.03, start + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    osc.connect(lp).connect(g).connect(master);
    osc.start(start);
    osc.stop(start + 0.4);
    // The head clunks at each end of its travel.
    seek(c, master, start, 1);
    seek(c, master, start + 0.33, 1);
  }
}

/** Keeps the hard disk chattering while a screen is shown (boot and shutdown screens). */
export function useDiskBusy(intensity = 1) {
  useEffect(() => {
    diskActivity(600, intensity);
    const t = setInterval(() => diskActivity(500 + Math.random() * 400, intensity), 900);
    return () => clearInterval(t);
  }, [intensity]);
}
