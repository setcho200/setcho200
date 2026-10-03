// Synthesises the 15 s soundtrack (start-light beeps, whooshes, impacts, riser) as a 16-bit stereo WAV.
const fs = require('fs');
const SR = 48000, DUR = 15, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
const add = (i, v, pan = 0) => { if (i >= 0 && i < N) { L[i] += v * (1 - pan) ; R[i] += v * (1 + pan); } };

function beep(t, f, len, amp) { for (let i = 0; i < len * SR; i++) { const e = Math.min(1, i / 200) * Math.exp(-i / SR * 3); add(Math.round(t * SR) + i, Math.sign(Math.sin(2 * Math.PI * f * i / SR)) * amp * e * 0.5 + Math.sin(2 * Math.PI * f * i / SR) * amp * e); } }
function kick(t, amp) { let ph = 0; for (let i = 0; i < 0.9 * SR; i++) { const x = i / SR, f = 40 + 110 * Math.exp(-x * 18); ph += 2 * Math.PI * f / SR; add(Math.round(t * SR) + i, Math.tanh(Math.sin(ph) * 2) * amp * Math.exp(-x * 4.5)); } }
function noise(t, len, amp, fStart, fEnd, shape, panSweep = 0) {
  let lp = 0; for (let i = 0; i < len * SR; i++) { const x = i / (len * SR), fc = fStart + (fEnd - fStart) * x, a = Math.min(1, fc * 2 * Math.PI / SR); lp += a * (rnd() - lp); add(Math.round(t * SR) + i, lp * amp * shape(x), panSweep * (x * 2 - 1)); }
}
function riser(t, len, amp) { let ph = 0; for (let i = 0; i < len * SR; i++) { const x = i / (len * SR), f = 80 * Math.pow(12, x); ph += 2 * Math.PI * f / SR; add(Math.round(t * SR) + i, (Math.sin(ph) + 0.3 * Math.sin(ph * 2.01)) * amp * x * x); } }
function drone(t0, t1, f, amp) { for (let i = t0 * SR; i < t1 * SR; i++) { const x = i / SR, e = Math.min(1, (x - t0) / 0.8) * Math.min(1, (t1 - x) / 1.2); add(i, (Math.sin(2 * Math.PI * f * x) + 0.5 * Math.sin(2 * Math.PI * f * 1.5 * x) + 0.25 * Math.sin(2 * Math.PI * f * 2 * x)) * amp * e * (0.8 + 0.2 * Math.sin(x * 6))); } }

// start lights
[0.45, 0.75, 1.05, 1.35, 1.65].forEach(t => beep(t, 660, 0.22, 0.25));
beep(2.0, 1320, 0.45, 0.28);
noise(1.9, 1.0, 1.6, 300, 6000, x => Math.sin(x * Math.PI), 0.8);
kick(2.0, 0.8);
// warp section: engine-like drone + riser into the burst
drone(2.2, 5.1, 55, 0.12);
[2.55, 3.2, 3.85].forEach(t => { kick(t, 0.55); noise(t, 0.25, 0.9, 8000, 2000, x => Math.exp(-x * 6)); });
riser(3.6, 1.4, 0.22);
// burst + particles
kick(5.0, 1.0); noise(5.0, 1.6, 1.4, 9000, 300, x => Math.exp(-x * 3));
noise(5.6, 2.2, 0.7, 400, 5000, x => Math.sin(x * Math.PI), -0.6);
// glitch ticks
for (let k = 0; k < 10; k++) { const t = 8.2 + k * 0.07; noise(t, 0.04, 1.2, 12000, 12000, x => 1 - x); }
// flip whoosh
noise(8.95, 0.9, 1.3, 500, 7000, x => Math.sin(x * Math.PI), 1);
// green wipe + logo
noise(9.75, 1.0, 1.2, 200, 4000, x => Math.sin(x * Math.PI));
kick(10.8, 0.9);
[10.85, 11.03, 11.21].forEach((t, i) => noise(t, 0.3, 1.0, 6000, 1500, x => Math.exp(-x * 5), i - 1));
for (let i = 0; i < 6; i++) beep(11.75 + i * 0.07, 1760 + i * 110, 0.08, 0.06);
drone(10.8, 15, 41, 0.14);
// final shine
noise(13.3, 1.0, 0.8, 9000, 15000, x => Math.sin(x * Math.PI), 1);
beep(13.8, 2093, 1.2, 0.07); beep(13.8, 3136, 1.2, 0.04);

// master: limiter + fade out
let peak = 0; for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.6));
  buf.writeInt16LE(Math.round(Math.tanh(L[i] / peak * 1.3) * 0.85 * fade * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.tanh(R[i] / peak * 1.3) * 0.85 * fade * 32767), 46 + i * 4);
}
fs.writeFileSync(process.argv[2] || 'soundtrack.wav', buf);
