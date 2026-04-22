/**
 * SoundManager — procedural audio using Web Audio API.
 * No audio files needed. All sounds are synthesized on the fly.
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicPlaying = false;
let _muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ─── Mute control ───

export function isMuted(): boolean {
  return _muted;
}

export function setMuted(muted: boolean): void {
  _muted = muted;
  if (masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, getCtx().currentTime, 0.05);
  }
  if (muted) stopMusic();
}

export function toggleMute(): boolean {
  setMuted(!_muted);
  return _muted;
}

// ─── Helper: play a tone ───

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  delay = 0,
  target: GainNode | null = sfxGain,
) {
  if (_muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(target || ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoise(duration: number, gainValue = 0.1, delay = 0) {
  if (_muted) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(gainValue, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  // Bandpass filter for a more pleasant noise
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 0.5;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain || ctx.destination);
  source.start(ctx.currentTime + delay);
}

// ─── Sound Effects ───

/** Click sound for buttons */
export function playClick(): void {
  playTone(800, 0.08, 'square', 0.1);
  playTone(600, 0.06, 'square', 0.05, 0.02);
}

/** Spin start — mechanical whirr */
export function playSpinStart(): void {
  for (let i = 0; i < 8; i++) {
    playTone(200 + i * 50, 0.06, 'sawtooth', 0.08, i * 0.03);
  }
  playNoise(0.3, 0.08);
}

/** Reel stop — clunk sound */
export function playReelStop(reelIndex: number): void {
  const delay = reelIndex * 0.3;
  playTone(150, 0.12, 'square', 0.15, delay);
  playTone(100, 0.08, 'triangle', 0.1, delay + 0.02);
  playNoise(0.08, 0.06, delay);
}

/** Small win — cheerful ding */
export function playSmallWin(): void {
  playTone(523, 0.15, 'sine', 0.25);       // C5
  playTone(659, 0.15, 'sine', 0.25, 0.1);  // E5
  playTone(784, 0.2, 'sine', 0.3, 0.2);    // G5
}

/** Medium win — ascending arpeggio */
export function playMediumWin(): void {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, 0.2, 'sine', 0.25, i * 0.1);
    playTone(freq * 1.5, 0.15, 'triangle', 0.1, i * 0.1 + 0.05);
  });
}

/** Big win — fanfare */
export function playBigWin(): void {
  const fanfare = [
    [523, 0.2], [523, 0.2], [523, 0.2], [659, 0.3],
    [784, 0.15], [659, 0.15], [784, 0.4],
    [1047, 0.5],
  ] as [number, number][];
  let t = 0;
  for (const [freq, dur] of fanfare) {
    playTone(freq, dur + 0.1, 'sine', 0.3, t);
    playTone(freq * 0.5, dur + 0.1, 'triangle', 0.1, t);
    t += dur;
  }
  // Shimmer
  for (let i = 0; i < 12; i++) {
    playTone(2000 + Math.random() * 3000, 0.1, 'sine', 0.05, i * 0.08);
  }
}

/** Coin / credit add sound */
export function playCoinSound(): void {
  playTone(1200, 0.08, 'sine', 0.2);
  playTone(1800, 0.06, 'sine', 0.15, 0.05);
  playTone(2400, 0.1, 'sine', 0.2, 0.08);
}

/** Loss / no win — subtle low tone */
export function playNoWin(): void {
  playTone(200, 0.3, 'sine', 0.06);
  playTone(180, 0.2, 'sine', 0.04, 0.1);
}

/** Navigate / page transition */
export function playNavigate(): void {
  playTone(400, 0.1, 'sine', 0.12);
  playTone(600, 0.12, 'sine', 0.12, 0.06);
}

/** Hover sound */
export function playHover(): void {
  playTone(1000, 0.04, 'sine', 0.04);
}

// ─── Background Music ───

export function startMusic(): void {
  if (_muted || musicPlaying) return;
  const ctx = getCtx();
  musicPlaying = true;

  // Simple ambient casino loop using layered oscillators
  const baseFreqs = [130.81, 164.81, 196.00]; // C3, E3, G3 chord
  musicOscillators = [];

  for (const freq of baseFreqs) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.value = 0.03;

    // Slow tremolo for ambience
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.3 + Math.random() * 0.5;
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    osc.connect(gain);
    gain.connect(musicGain || ctx.destination);
    osc.start();
    musicOscillators.push(osc, lfo);
  }

  // Add a soft high pad
  const pad = ctx.createOscillator();
  pad.type = 'triangle';
  pad.frequency.value = 523.25; // C5
  const padGain = ctx.createGain();
  padGain.gain.value = 0.008;
  pad.connect(padGain);
  padGain.connect(musicGain || ctx.destination);
  pad.start();
  musicOscillators.push(pad);
}

export function stopMusic(): void {
  musicPlaying = false;
  for (const osc of musicOscillators) {
    try { osc.stop(); } catch {}
  }
  musicOscillators = [];
}

// ─── Adaptive win sound picker ───

export function playWinSound(winAmount: number, betAmount: number): void {
  const ratio = winAmount / betAmount;
  if (ratio >= 10) {
    playBigWin();
  } else if (ratio >= 3) {
    playMediumWin();
  } else {
    playSmallWin();
  }
}
