// Ember Kitchen — audio: tiny synthesised kitchen sounds, WebAudio only.
// One clear job: sound effects. No files, no network, no music loops.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function tone(freq, dur, type, vol, when = 0) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function sfxPickup() {
  tone(520, 0.08, 'sine', 0.12);
}

export function sfxChop() {
  tone(180, 0.06, 'square', 0.1);
  tone(120, 0.05, 'square', 0.08, 0.07);
}

export function sfxSizzle() {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const buffer = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.25;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.12, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  src.connect(gain).connect(ac.destination);
  src.start();
}

export function sfxDing() {
  tone(880, 0.18, 'sine', 0.14);
  tone(1320, 0.22, 'sine', 0.1, 0.1);
}

export function sfxServe() {
  tone(523, 0.1, 'triangle', 0.14);
  tone(659, 0.1, 'triangle', 0.14, 0.09);
  tone(784, 0.2, 'triangle', 0.16, 0.18);
}

export function sfxBad() {
  tone(160, 0.18, 'sawtooth', 0.1);
}

export function sfxTick() {
  tone(1000, 0.04, 'sine', 0.06);
}
