// audio.js — every sound is synthesised with WebAudio. No audio files,
// no network, nothing borrowed: a chop is a filtered noise burst, a bell
// is two sine notes, the music is a small original loop on triangle waves.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A quiet original melody: C major, 8 bars, bouncy but calm. The bass
// walks the roots under it. Kept low so it never fights the sound effects.
const MELODY = [
  523, 0, 659, 0, 784, 0, 659, 0,
  880, 0, 784, 0, 659, 0, 523, 0,
  587, 0, 698, 0, 880, 0, 698, 0,
  784, 659, 587, 523, 587, 0, 0, 0,
];
const BASS = [262, 196, 220, 196, 262, 196, 220, 262];

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol || 0.15, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, freq) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = freq || 1200;
  const gain = ctx.createGain();
  gain.gain.value = vol || 0.25;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(t0);
}

// One named sound effect each. All under ~150 ms so the game answers at once.
export function playSfx(name) {
  if (!ctx || muted) return;
  switch (name) {
    case 'pickup': tone(520, 0.08, 'triangle', 0.18); break;
    case 'chop': noiseBurst(0.07, 0.35, 900); tone(180, 0.06, 'square', 0.08); break;
    case 'chop-done': noiseBurst(0.07, 0.35, 900); tone(660, 0.12, 'triangle', 0.2); break;
    case 'cook-start': noiseBurst(0.25, 0.12, 4000); break; // sizzle starts
    case 'cook-done': tone(740, 0.1, 'triangle', 0.2); tone(988, 0.14, 'triangle', 0.2, 0.09); break;
    case 'plated': tone(440, 0.08, 'triangle', 0.18); tone(554, 0.1, 'triangle', 0.18, 0.07); break;
    case 'serve': tone(1047, 0.16, 'sine', 0.22); tone(1319, 0.22, 'sine', 0.22, 0.1); break;
    case 'coin': tone(1319, 0.07, 'square', 0.08); tone(1760, 0.14, 'square', 0.08, 0.06); break;
    case 'error': tone(160, 0.16, 'sawtooth', 0.12); break;
    case 'expire': tone(392, 0.2, 'sawtooth', 0.12); tone(311, 0.3, 'sawtooth', 0.12, 0.15); break;
    case 'burnt': noiseBurst(0.3, 0.2, 500); tone(110, 0.3, 'sawtooth', 0.1); break;
    case 'new-order': tone(880, 0.09, 'triangle', 0.16); tone(1175, 0.12, 'triangle', 0.16, 0.08); break;
    case 'click': tone(700, 0.05, 'triangle', 0.12); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.2, i * 0.12)); break;
    default: break;
  }
}

export function startMusic() {
  if (!ctx || musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const note = MELODY[musicStep % MELODY.length];
    if (note) tone(note, 0.22, 'triangle', 0.05);
    if (musicStep % 4 === 0) {
      const root = BASS[(musicStep / 4) % BASS.length];
      tone(root, 0.5, 'sine', 0.06);
    }
    musicStep++;
  }, 210);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
