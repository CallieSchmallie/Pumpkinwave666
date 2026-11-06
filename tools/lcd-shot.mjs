// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// Drive the simulator headlessly and save LCD screenshots as PNG.
//   node tools/lcd-shot.mjs out_dir script...
// Script steps: wait:ms  btn:index  hold:index:ms  enc:index:delta  key:index:ms
//               open:page  midi:hex,hex,..  boot  shot:name  prog:n
import fs from 'node:fs';
import zlib from 'node:zlib';
import { Sim } from './sim-node.mjs';
const [out, ...steps] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const sim = new Sim(new URL('../build/web/simulator.wasm', import.meta.url).pathname);
const ms = n => sim.render(Math.ceil(n * 44.1 / sim.frames));
function png(path, px) {
  const raw = Buffer.alloc(240 * (240 * 3 + 1));
  for (let y = 0; y < 240; ++y) {
    raw[y * 721] = 0;
    for (let x = 0; x < 240; ++x) {
      const v = px[y * 240 + x], at = y * 721 + 1 + x * 3;
      raw[at] = ((v >> 11) & 31) * 255 / 31; raw[at + 1] = ((v >> 5) & 63) * 255 / 63; raw[at + 2] = (v & 31) * 255 / 31;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; ++k) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = ~0; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(240, 0); ihdr.writeUInt32BE(240, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
ms(50);
for (const step of steps) {
  const [k, a, b] = step.split(':');
  if (k === 'wait') ms(+a);
  else if (k === 'boot') { sim.c.sim_boot(2); ms(10); }
  else if (k === 'btn') { sim.control(0, +a, 1); ms(40); sim.control(0, +a, 0); ms(40); }
  else if (k === 'hold') { sim.control(0, +a, 1); ms(+b); sim.control(0, +a, 0); ms(40); }
  else if (k === 'enc') { sim.control(2, +a, +b); ms(20); sim.control(2, +a, 0); ms(20); }
  else if (k === 'key') { sim.control(1, +a, 1); ms(+b || 300); sim.control(1, +a, 0); ms(30); }
  else if (k === 'keydown') { sim.control(1, +a, 1); ms(30); }
  else if (k === 'open') { sim.c.sim_open(+a); ms(60); }
  else if (k === 'prog') { sim.midi(0xc0, +a); ms(30); }
  else if (k === 'midi') { sim.midi(...a.split(',').map(x => parseInt(x, 16))); ms(10); }
  else if (k === 'shot') { ms(80); png(`${out}/${a}.png`, sim.pixels()); }
  else throw new Error('bad step ' + step);
}
