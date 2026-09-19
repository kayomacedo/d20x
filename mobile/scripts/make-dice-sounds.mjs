import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function add(out, offset, value) {
  const i = Math.round(offset * RATE);
  if (i >= 0 && i < out.length) out[i] = clamp(out[i] + value);
}

function mix(out, start, clip, gain = 1) {
  const from = Math.round(start * RATE);
  for (let i = 0; i < clip.length && from + i < out.length; i += 1) {
    out[from + i] = clamp(out[from + i] + clip[i] * gain);
  }
}

function highpassNoise(rand, samples, cutoff) {
  let prev = 0;
  let y = 0;
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / RATE;
  const a = rc / (rc + dt);
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = rand() * 2 - 1;
    y = a * (y + x - prev);
    prev = x;
    out[i] = y;
  }
  return out;
}

function acrylicImpact(rand, surface) {
  const duration = 0.09;
  const n = Math.round(RATE * duration);
  const out = new Float32Array(n);
  const table = surface === 'wood' ? 155 : surface === 'stone' ? 110 : 190;
  const modes =
    surface === 'wood'
      ? [
          [1680, 0.028, 0.38],
          [2620, 0.02, 0.32],
          [3940, 0.014, 0.28],
          [6100, 0.008, 0.22],
        ]
      : surface === 'stone'
        ? [
            [2140, 0.02, 0.3],
            [3480, 0.014, 0.34],
            [5120, 0.01, 0.3],
            [7800, 0.006, 0.28],
          ]
        : [
            [1980, 0.022, 0.34],
            [3150, 0.016, 0.36],
            [4680, 0.011, 0.3],
            [7200, 0.007, 0.26],
          ];

  const click = highpassNoise(rand, Math.round(RATE * 0.008), 1800);
  mix(out, 0, click, surface === 'stone' ? 0.95 : 0.8);

  for (let i = 0; i < n; i += 1) {
    const t = i / RATE;
    const tableEnv = Math.exp(-t / (surface === 'wood' ? 0.045 : 0.022));
    out[i] += Math.sin(2 * Math.PI * table * t) * tableEnv * (surface === 'wood' ? 0.28 : 0.16);
    for (const [freq, decay, gain] of modes) {
      const wobble = 1 + (rand() - 0.5) * 0.012;
      out[i] += Math.sin(2 * Math.PI * freq * wobble * t) * Math.exp(-t / decay) * gain;
    }
    if (t < 0.004) {
      out[i] += (rand() * 2 - 1) * (1 - t / 0.004) * 0.35;
    }
    out[i] = clamp(out[i]);
  }
  return out;
}

function bounceTimes(count, rand) {
  const times = [0];
  let t = 0;
  let gap = 0.032 + rand() * 0.012;
  for (let i = 1; i < count; i += 1) {
    t += gap;
    times.push(t);
    gap *= 1.28 + rand() * 0.12;
  }
  return times;
}

function oneDie(surface, seed, bounces = 5) {
  const rand = rng(seed);
  const times = bounceTimes(bounces, rand);
  const last = times[times.length - 1] + 0.12;
  const out = new Float32Array(Math.round(RATE * last));
  times.forEach((time, index) => {
    const gain = Math.pow(0.58, index) * (0.85 + rand() * 0.2);
    mix(out, time, acrylicImpact(rand, surface), gain);
    if (index > 0 && rand() > 0.45) {
      mix(out, time + 0.006 + rand() * 0.008, acrylicImpact(rand, surface), gain * 0.35);
    }
  });
  return out;
}

function manyDice(surface, count, seed, extraRoll = false) {
  const rand = rng(seed);
  const clips = [];
  let end = 0.2;
  for (let d = 0; d < count; d += 1) {
    const start = rand() * (extraRoll ? 0.18 : 0.08);
    const die = oneDie(surface, seed + d * 97, extraRoll ? 6 + (d % 3) : 4 + (d % 2));
    clips.push({ start, die });
    end = Math.max(end, start + die.length / RATE);
  }
  const out = new Float32Array(Math.round(RATE * (end + 0.04)));
  for (const { start, die } of clips) mix(out, start, die, 0.72);
  return out;
}

function toWav(samples) {
  let peak = 0;
  for (const value of samples) peak = Math.max(peak, Math.abs(value));
  if (peak < 0.001) peak = 1;
  const bytes = Buffer.alloc(44 + samples.length * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(36 + samples.length * 2, 4);
  bytes.write('WAVE', 8);
  bytes.write('fmt ', 12);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(RATE, 24);
  bytes.writeUInt32LE(RATE * 2, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) {
    bytes.writeInt16LE(Math.round((samples[i] / peak) * 0.9 * 32767), 44 + i * 2);
  }
  return bytes;
}

function save(name, samples) {
  writeFileSync(join(ROOT, name), toWav(samples));
  console.log(name, (samples.length / RATE).toFixed(2) + 's');
}

save('dice-single-plastic.wav', oneDie('table', 11, 5));
save('dice-single-wood.wav', oneDie('wood', 23, 5));
save('dice-single-stone.wav', oneDie('stone', 41, 4));
save('dice-multi-handful.wav', manyDice('table', 4, 71, false));
save('dice-multi-tumble.wav', manyDice('table', 7, 83, true));
save('dice-multi-table.wav', manyDice('wood', 5, 99, false));
