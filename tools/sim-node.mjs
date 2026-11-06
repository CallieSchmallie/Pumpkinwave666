// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// Headless driver for build/web/simulator.wasm: audition DX7 patches offline.
import fs from 'node:fs';
export class Sim {
  constructor(wasmPath) {
    const c = new WebAssembly.Instance(new WebAssembly.Module(fs.readFileSync(wasmPath)), {}).exports;
    c._initialize(); c.sim_boot(1); this.c = c;
    this.frames = c.sim_block_frames();
  }
  buf() { return new Uint8Array(this.c.memory.buffer, this.c.sim_file(), 8192); }
  midi(...bytes) { this.buf().set(bytes); return this.c.sim_midi(bytes.length); }
  patch(p156) { this.buf().set(p156); return this.c.sim_patch_import(); }
  exportPatch() { const r = this.c.sim_patch_export(); return r ? null : this.buf().slice(0, 156); }
  control(kind, index, value) { this.c.sim_control(kind, index, value); }
  render(blocks) {
    const out = new Float32Array(blocks * this.frames * 2);
    for (let b = 0; b < blocks; ++b) {
      const at = this.c.sim_render();
      out.set(new Float32Array(this.c.memory.buffer, at, this.frames * 2), b * this.frames * 2);
    }
    return out;
  }
  pixels() { return new Uint16Array(this.c.memory.buffer, this.c.sim_pixels(), 240 * 240).slice(); }
}
export function stats(x) {
  let peak = 0, sum = 0;
  for (const v of x) { const a = Math.abs(v); if (a > peak) peak = a; sum += v * v; }
  return { peak, rms: Math.sqrt(sum / x.length) };
}
export function wav(path, x, rate = 44100) {
  const n = x.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; ++i) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(path, b);
}
