// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// PumpkinWave 666: build the 128-voice factory bank (103 haunted + 25 USER).
//   node tools/Generate-PumpkinWave-DX7.mjs [--normalize build/web/simulator.wasm] [--report]
// With --normalize, every voice is auditioned in the browser engine and its
// carrier levels are trimmed so that presets sit at a consistent loudness.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { expand, pack, carriers } from './pumpkin/dx7.mjs';
import { FACTORY, userVoice, USER_SLOTS } from './pumpkin/voices.mjs';

const args = process.argv.slice(2);
const wasmAt = args.indexOf('--normalize');
const voices = [...FACTORY];
for (let n = 1; n <= USER_SLOTS; ++n) voices.push(userVoice(n));
if (voices.length !== 128) throw new Error('bank must hold 128 voices, has ' + voices.length);

function windowPeakRms(x, frames = 4410) {
  let best = 0;
  for (let at = 0; at + frames * 2 <= x.length; at += frames) {
    let s = 0; for (let i = at; i < at + frames * 2; ++i) s += x[i] * x[i];
    best = Math.max(best, Math.sqrt(s / (frames * 2)));
  }
  return best;
}
let report = [];
if (wasmAt >= 0) {
  const { Sim, stats } = await import('./sim-node.mjs');
  const target = 0.07, ceiling = 0.6;
  for (const v of voices) {
    if (v.user) continue;
    const car = carriers(v.alg);
    let trim = 0, last = null;
    for (let pass = 0; pass < 5; ++pass) {
      const sim = new Sim(args[wasmAt + 1]);
      sim.render(4);
      const trial = structuredClone(v);
      trial.ops = trial.ops.map((o, i) => car[i] && o && o.l ? Object.assign({}, o, { l: Math.max(1, Math.min(99, o.l + trim)) }) : o);
      if (sim.patch(expand(trial))) throw new Error('import failed ' + v.name);
      sim.render(2);
      const note = v.note || 60;
      sim.midi(0x90, note, 100); const hold = sim.render(520);
      sim.midi(0x80, note, 0); sim.render(120);
      const loud = windowPeakRms(hold), peak = stats(hold).peak;
      last = { name: v.name, trim, rms: +loud.toFixed(4), peak: +peak.toFixed(3) };
      if (loud < 1e-5) { last.silent = true; break; }
      let db = 20 * Math.log10(target / loud);
      if (peak * 10 ** (db / 20) > ceiling) db = 20 * Math.log10(ceiling / peak);
      const steps = Math.round(db / 0.75);
      if (Math.abs(steps) <= 1) break;
      // Carriers clamp at 99 individually, so quiet voices also gain body from their softer carriers.
      const next = Math.max(-60, Math.min(trim + steps, 20));
      if (next === trim) break;
      trim = next;
    }
    v.ops = v.ops.map((o, i) => car[i] && o && o.l ? Object.assign({}, o, { l: Math.max(1, Math.min(99, o.l + trim)) }) : o);
    report.push(last);
  }
}
const raw = new Uint8Array(128 * 128);
voices.forEach((v, i) => raw.set(pack(expand(v)), i * 128));
for (const x of raw) if (x > 127) throw new Error('VMEM byte out of range');
// Same lossless VMEM encoding as tools/Generate-Factory-DX7.mjs.
const packed = [];
for (let i = 0; i < raw.length;) {
  let length = 2, distance = 0;
  for (let j = Math.max(0, i - 16383); j < i; j++) {
    let n = 0; while (n < 130 && i + n < raw.length && raw[j + n] === raw[i + n]) n++;
    if (n > length) { length = n; distance = i - j; }
  }
  if (distance) { packed.push(128 + length - 3, (distance & 127) | (distance >= 128 ? 128 : 0)); if (distance >= 128) packed.push(distance >> 7); i += length; }
  else packed.push(raw[i++]);
}
const decoded = [];
for (let i = 0; i < packed.length;) {
  const t = packed[i++];
  if (t < 128) decoded.push(t);
  else { const n = t - 128 + 3, lo = packed[i++], d = (lo & 127) | (lo >= 128 ? packed[i++] << 7 : 0); for (let k = 0; k < n; k++) decoded.push(decoded[decoded.length - d]); }
}
if (Buffer.compare(Buffer.from(decoded), Buffer.from(raw))) throw new Error('encoding round trip failed');
const sha = crypto.createHash('sha256').update(raw).digest('hex');
const lines = []; for (let i = 0; i < packed.length; i += 24) lines.push('    ' + packed.slice(i, i + 24).join(',') + ',');
const names = voices.map((v, i) => ` * ${String(i + 1).padStart(3)} ${v.name}`).join('\n');
const content = '/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception\n' +
  ' * PumpkinWave 666 factory DX7 bank: 103 haunted voices + 25 USER slots.\n' +
  ' * Original programming. Regenerate: node tools/Generate-PumpkinWave-DX7.mjs --normalize build/web/simulator.wasm\n' +
  ' * VMEM SHA-256: ' + sha + '\n *\n' + names + '\n */\n' +
  'static const uint8_t factory_packed[] = {\n' + lines.join('\n') + '\n};\n';
fs.writeFileSync(new URL('../app/fm_factory.inc', import.meta.url), content);
fs.writeFileSync(new URL('../presets/PumpkinWave666-ALL.vmem', import.meta.url), raw);
// Four standard 32-voice DX7 bank SysEx files (F0 43 00 09 20 00 ... checksum F7).
for (let b = 0; b < 4; ++b) {
  const body = raw.slice(b * 4096, b * 4096 + 4096);
  let sum = 0; for (const x of body) sum += x;
  const syx = Buffer.concat([Buffer.from([0xf0, 0x43, 0x00, 0x09, 0x20, 0x00]), Buffer.from(body), Buffer.from([(-sum) & 127, 0xf7])]);
  fs.writeFileSync(new URL(`../presets/PumpkinWave666-Bank${'ABCD'[b]}.syx`, import.meta.url), syx);
}
fs.writeFileSync(new URL('../presets/PRESETS.txt', import.meta.url),
  voices.map((v, i) => `${String(i + 1).padStart(3)}  ${'ABCD'[i >> 5]}${String((i & 31) + 1).padStart(2, '0')}  ${v.name}`).join('\n') + '\n');
if (args.includes('--report')) for (const r of report) console.log(JSON.stringify(r));
const silent = report.filter(r => r.silent).map(r => r.name);
console.log(`PumpkinWave bank: ${FACTORY.length} factory + ${USER_SLOTS} user, ${raw.length} VMEM bytes, ${packed.length} encoded.` +
  (silent.length ? ' SILENT: ' + silent.join(', ') : ''));
