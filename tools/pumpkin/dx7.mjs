// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// PumpkinWave 666: tiny DX7 voice DSL -> expanded 156-byte patch -> 128-byte VMEM.
// Operators are written OP1..OP6 (OP1 first); the DX7 layout stores OP6 first.

// msfa algorithm table (OP6..OP1). Output bus 0 => carrier.
const ALG = [
  [0xc1,0x11,0x11,0x14,0x01,0x14],[0x01,0x11,0x11,0x14,0xc1,0x14],[0xc1,0x11,0x14,0x01,0x11,0x14],
  [0x41,0x11,0x94,0x01,0x11,0x14],[0xc1,0x14,0x01,0x14,0x01,0x14],[0x41,0x94,0x01,0x14,0x01,0x14],
  [0xc1,0x11,0x05,0x14,0x01,0x14],[0x01,0x11,0xc5,0x14,0x01,0x14],[0x01,0x11,0x05,0x14,0xc1,0x14],
  [0x01,0x05,0x14,0xc1,0x11,0x14],[0xc1,0x05,0x14,0x01,0x11,0x14],[0x01,0x05,0x05,0x14,0xc1,0x14],
  [0xc1,0x05,0x05,0x14,0x01,0x14],[0xc1,0x05,0x11,0x14,0x01,0x14],[0x01,0x05,0x11,0x14,0xc1,0x14],
  [0xc1,0x11,0x02,0x25,0x05,0x14],[0x01,0x11,0x02,0x25,0xc5,0x14],[0x01,0x11,0x11,0xc5,0x05,0x14],
  [0xc1,0x14,0x14,0x01,0x11,0x14],[0x01,0x05,0x14,0xc1,0x14,0x14],[0x01,0x14,0x14,0xc1,0x14,0x14],
  [0xc1,0x14,0x14,0x14,0x01,0x14],[0xc1,0x14,0x14,0x01,0x14,0x04],[0xc1,0x14,0x14,0x14,0x04,0x04],
  [0xc1,0x14,0x14,0x04,0x04,0x04],[0xc1,0x05,0x14,0x01,0x14,0x04],[0x01,0x05,0x14,0xc1,0x14,0x04],
  [0x04,0xc1,0x11,0x14,0x01,0x14],[0xc1,0x14,0x01,0x14,0x04,0x04],[0x04,0xc1,0x11,0x14,0x04,0x04],
  [0xc1,0x14,0x04,0x04,0x04,0x04],[0xc4,0x04,0x04,0x04,0x04,0x04]];
/** carriers(alg) -> boolean[6], index 0 = OP1 */
export function carriers(alg) {
  const row = ALG[alg - 1];
  return [5, 4, 3, 2, 1, 0].map(i => (row[i] & 3) === 0);
}
export const WAVE = { tri: 0, sawdn: 1, sawup: 2, square: 3, sine: 4, sh: 5 };
export const CURVE = { '-lin': 0, '-exp': 1, '+exp': 2, '+lin': 3 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));

function ratioToCoarseFine(r) {
  if (r < 1) return { fc: 0, ff: clamp((r / 0.5 - 1) * 100, 0, 99) };
  let fc = Math.floor(r); if (fc > 31) fc = 31;
  return { fc, ff: clamp((r / fc - 1) * 100, 0, 99) };
}
function fixedToCoarseFine(hz) {
  const decade = clamp(Math.floor(Math.log10(Math.max(1, hz))), 0, 3);
  return { fc: decade, ff: clamp(Math.log10(hz / 10 ** decade) * 100, 0, 99) };
}
/**
 * op({ r: ratio | hz: fixed, l: level, rt: [r1..r4], lv: [l1..l4], det: -7..7,
 *      kvs, ams, bp, ld, rd, lc, rc, rs })
 */
export function expand(v) {
  const p = new Uint8Array(156);
  const ops = v.ops;
  for (let i = 0; i < 6; ++i) {
    const o = Object.assign({ l: 0, r: 1, rt: [99, 99, 99, 99], lv: [99, 99, 99, 0], det: 0, kvs: 2, ams: 0,
      bp: 39, ld: 0, rd: 0, lc: '-lin', rc: '-lin', rs: 0 }, ops[i] || {});
    const q = (5 - i) * 21; // OP1 -> offset 105
    o.rt.forEach((x, k) => p[q + k] = clamp(x, 0, 99));
    o.lv.forEach((x, k) => p[q + 4 + k] = clamp(x, 0, 99));
    p[q + 8] = clamp(o.bp, 0, 99); p[q + 9] = clamp(o.ld, 0, 99); p[q + 10] = clamp(o.rd, 0, 99);
    p[q + 11] = CURVE[o.lc]; p[q + 12] = CURVE[o.rc]; p[q + 13] = clamp(o.rs, 0, 7);
    p[q + 14] = clamp(o.ams, 0, 3); p[q + 15] = clamp(o.kvs, 0, 7); p[q + 16] = clamp(o.l, 0, 99);
    const cf = o.hz ? fixedToCoarseFine(o.hz) : ratioToCoarseFine(o.r);
    p[q + 17] = o.hz ? 1 : 0; p[q + 18] = cf.fc; p[q + 19] = cf.ff; p[q + 20] = clamp(7 + o.det, 0, 14);
  }
  const peg = Object.assign({ rt: [99, 99, 99, 99], lv: [50, 50, 50, 50] }, v.peg || {});
  peg.rt.forEach((x, k) => p[126 + k] = clamp(x, 0, 99));
  peg.lv.forEach((x, k) => p[130 + k] = clamp(x, 0, 99));
  const lfo = Object.assign({ speed: 35, delay: 0, pmd: 0, amd: 0, sync: 0, wave: 'tri', pms: 3 }, v.lfo || {});
  p[134] = clamp(v.alg - 1, 0, 31); p[135] = clamp(v.fb || 0, 0, 7); p[136] = v.oks === 0 ? 0 : 1;
  p[137] = clamp(lfo.speed, 0, 99); p[138] = clamp(lfo.delay, 0, 99); p[139] = clamp(lfo.pmd, 0, 99);
  p[140] = clamp(lfo.amd, 0, 99); p[141] = lfo.sync ? 1 : 0; p[142] = WAVE[lfo.wave]; p[143] = clamp(lfo.pms, 0, 7);
  p[144] = clamp(24 + (v.trnsp || 0), 0, 48);
  const name = (v.name + '          ').slice(0, 10).toUpperCase();
  for (let k = 0; k < 10; ++k) p[145 + k] = name.charCodeAt(k);
  p[155] = 63;
  return p;
}
/** Port of groove_fm_pack (app/fm_library.c). */
export function pack(p) {
  const b = new Uint8Array(128);
  for (let op = 0; op < 6; ++op) {
    const v = op * 17, q = op * 21;
    for (let k = 0; k < 11; ++k) b[v + k] = p[q + k];
    b[v + 11] = p[q + 11] | (p[q + 12] << 2); b[v + 12] = p[q + 13] | (p[q + 20] << 3);
    b[v + 13] = p[q + 14] | (p[q + 15] << 2); b[v + 14] = p[q + 16];
    b[v + 15] = p[q + 17] | (p[q + 18] << 1); b[v + 16] = p[q + 19];
  }
  for (let k = 0; k < 8; ++k) b[102 + k] = p[126 + k];
  b[110] = p[134]; b[111] = p[135] | (p[136] << 3);
  for (let k = 0; k < 4; ++k) b[112 + k] = p[137 + k];
  b[116] = p[141] | (p[142] << 1) | (p[143] << 4);
  for (let k = 0; k < 11; ++k) b[117 + k] = p[144 + k];
  return b;
}
