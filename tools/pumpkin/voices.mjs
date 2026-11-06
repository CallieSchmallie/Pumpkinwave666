// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// PumpkinWave 666 factory voices. Original programming, no copied DX7 data.
// 103 haunted voices + 25 USER slots = 128 programs (four banks of 32).
//
// Operator shorthand: { r: ratio | hz, l: output level, rt: [R1..R4], lv: [L1..L4],
//   det: -7..7, kvs: velocity 0..7, ams: AM sens 0..3, rd/ld + rc/lc: key scaling }

// ---------- envelope helpers ----------
const E = {
  organ: (rel = 62) => ({ rt: [99, 99, 99, rel], lv: [99, 99, 99, 0] }),
  pipe: (att = 78, rel = 46) => ({ rt: [att, 60, 99, rel], lv: [99, 96, 96, 0] }),
  swell: (att, rel, sus = 99) => ({ rt: [att, 50, 40, rel], lv: [99, sus, sus, 0] }),
  sus: (att, dec, sus, rel) => ({ rt: [att, dec, 30, rel], lv: [99, sus, sus, 0] }),
  pluck: (dec, rel = 40, tail = 0) => ({ rt: [99, dec, 30, rel], lv: [99, tail, 0, 0] }),
  // mid 0..99 is a 'body' amount: the level after the strike phase stays between 90 and 99.
  ring: (dec, dec2, rel, mid = 70) => ({ rt: [99, dec, dec2, rel], lv: [99, Math.round(90 + mid * 0.09), 0, 0] }),
  bloom: (att, dec, sus, rel) => ({ rt: [att, dec, 25, rel], lv: [99, sus, sus, 0] }),
};
const lfo = (wave, speed, pmd, pms = 3, delay = 0, amd = 0, sync = 0) => ({ wave, speed, pmd, pms, delay, amd, sync });
const off = { l: 0 };
const V = [];
const add = (name, def) => { V.push(Object.assign({ name }, def)); };

// =====================================================================
// 1-15  DRAMATIC ORGANS
// =====================================================================
// alg 32: six drawbar carriers; OP6 owns the feedback (grit/reed).
const bars = (list, env, extra = {}) => list.map(([r, l, det = 0, more = {}]) => Object.assign({ r, l, det, kvs: 0 }, env, extra, more));

add('CRYPTORGAN', { alg: 32, fb: 4, lfo: lfo('sine', 36, 5, 2, 0, 9),
  ops: bars([[0.5, 88], [1, 95, 1], [2, 86], [3, 74, -1], [4, 70], [8, 66]], E.organ(58), { ams: 1 }) });
add('PHANTOMPIP', { alg: 5, fb: 3, lfo: lfo('sine', 30, 4, 2, 30),
  ops: [ { r: 1, l: 96, ...E.pipe(76, 44), kvs: 0 }, { r: 1, l: 62, rt: [85, 50, 60, 44], lv: [99, 78, 72, 0], kvs: 0, rd: 20, rc: '-exp' },
         { r: 0.5, l: 90, ...E.pipe(70, 40), kvs: 0, det: 1 }, { r: 1, l: 40, rt: [80, 60, 60, 40], lv: [99, 70, 66, 0], kvs: 0 },
         { r: 2, l: 84, ...E.pipe(80, 46), kvs: 0, det: -1 }, { r: 2, l: 55, rt: [90, 50, 70, 46], lv: [99, 76, 70, 0], kvs: 0, rd: 30, rc: '-exp' } ] });
add('TOCCATA666', { alg: 32, fb: 5, lfo: lfo('tri', 34, 3, 2),
  ops: bars([[0.5, 90], [1, 96], [1.5, 78, 2], [2, 90, -1], [3, 82, 1], [4, 84]], E.pipe(88, 50)) });
add('BLOOD MASS', { alg: 32, fb: 6, lfo: lfo('sine', 28, 6, 3, 20, 6),
  ops: bars([[0.5, 92], [1, 94, 2], [1, 92, -2], [2, 84], [3, 70], [6, 64]], E.pipe(70, 38), { ams: 1 }) });
add('HAUNTMANOR', { alg: 32, fb: 3, lfo: lfo('sine', 42, 8, 3, 0, 16),
  ops: bars([[1, 95], [2, 88, 1], [3, 80], [4, 76, -1], [5, 62], [8, 70]], E.organ(55), { ams: 2 }) });
add('FUNERALHOM', { alg: 32, fb: 0, lfo: lfo('sine', 33, 9, 3, 40),
  ops: bars([[1, 96], [2, 70], [4, 60], [0.5, 76, 1], [1, 80, 3], [2, 58, -3]], E.swell(62, 40)) });
add('GOTHICREED', { alg: 5, fb: 6, lfo: lfo('tri', 34, 4, 2, 25),
  ops: [ { r: 1, l: 95, ...E.pipe(74, 44), kvs: 0 }, { r: 1, l: 74, ...E.pipe(80, 44), kvs: 0, rd: 25, rc: '-exp' },
         { r: 2, l: 80, ...E.pipe(74, 44), kvs: 0, det: 1 }, { r: 1, l: 66, ...E.pipe(80, 44), kvs: 0 },
         { r: 0.5, l: 86, ...E.pipe(70, 40), kvs: 0 }, { r: 1, l: 70, ...E.pipe(80, 40), kvs: 0 } ] });
add('CALLIOPE X', { alg: 32, fb: 7, lfo: lfo('sine', 46, 18, 4, 0, 10),
  ops: bars([[1, 96], [2, 86], [3, 72], [4, 76, 3], [1, 84, -4], [2, 70]], E.organ(64), { ams: 1 }) });
add('CREEPCARNI', { alg: 32, fb: 5, lfo: lfo('tri', 22, 22, 4),
  ops: bars([[1, 94], [2, 84, 2], [3, 76], [4, 70], [6, 60, -2], [1, 82, 5]], E.organ(60)) });
add('DRACULADEN', { alg: 32, fb: 2, lfo: lfo('sine', 38, 4, 2, 10, 14),
  ops: bars([[0.5, 94], [0.75, 70], [1, 92, 1], [1.5, 68], [2, 84, -1], [3, 66]], E.pipe(68, 34), { ams: 1 }) });
add('SEANCEHARM', { alg: 5, fb: 5, lfo: lfo('sine', 26, 7, 3, 0, 8),
  ops: [ { r: 1, l: 94, ...E.swell(58, 42), kvs: 1, ams: 1 }, { r: 1, l: 68, ...E.swell(66, 42), kvs: 1, rd: 20 },
         { r: 1, l: 88, ...E.swell(58, 42), kvs: 1, det: 3 }, { r: 2, l: 58, ...E.swell(66, 42), kvs: 1 },
         { r: 2, l: 80, ...E.swell(58, 42), kvs: 1, det: -2 }, { r: 3, l: 54, ...E.swell(66, 42), kvs: 1 } ] });
add('WEREWOLFB3', { alg: 32, fb: 7, lfo: lfo('sine', 40, 6, 3, 0, 18),
  ops: [ { r: 0.5, l: 92, ...E.organ(70), kvs: 0, ams: 2 }, { r: 1.5, l: 76, ...E.organ(70), kvs: 0, ams: 2 },
         { r: 1, l: 95, ...E.organ(70), kvs: 0, ams: 2 }, { r: 2, l: 80, ...E.organ(70), kvs: 0 },
         { r: 3, l: 86, rt: [99, 62, 99, 70], lv: [99, 0, 0, 0], kvs: 1 }, { r: 4, l: 72, ...E.organ(70), kvs: 0 } ] });
add('DUNGEONDRN', { alg: 32, fb: 5, lfo: lfo('tri', 10, 6, 3, 0, 20),
  ops: bars([[0.5, 96], [0.75, 86], [1, 90, 2], [1.5, 74, -2], [0.5, 80, 6], [2, 62]], E.swell(48, 32), { ams: 2 }) });
add('VOXDEMORTE', { alg: 32, fb: 6, lfo: lfo('tri', 44, 10, 3),
  ops: bars([[1, 96], [2, 90], [4, 74], [1, 82, 2], [3, 66], [8, 72]], E.organ(68), { kvs: 1 }) });
add('MAUSOLEUM', { alg: 32, fb: 3, lfo: lfo('sine', 18, 8, 3, 45, 10),
  ops: bars([[0.5, 92], [1, 90, 1], [2, 80], [3, 66, -1], [4, 70], [6, 52]], E.swell(56, 30), { ams: 1 }) });

// =====================================================================
// 16-33  WARBLY / VHS / TAPE
// =====================================================================
const strings = (att, rel) => ({ rt: [att, 45, 35, rel], lv: [99, 94, 90, 0] });
add('VHSSTRINGS', { alg: 5, fb: 6, lfo: lfo('sine', 16, 14, 4),
  ops: [ { r: 1, l: 92, ...strings(52, 44), kvs: 1 }, { r: 1, l: 74, ...strings(58, 44), kvs: 1, rd: 30, rc: '-exp' },
         { r: 1, l: 90, ...strings(52, 44), det: 4, kvs: 1 }, { r: 1, l: 72, ...strings(58, 44), det: 4, kvs: 1, rd: 30, rc: '-exp' },
         { r: 2, l: 76, ...strings(52, 44), det: -4, kvs: 1 }, { r: 1, l: 70, ...strings(58, 44), kvs: 1, rd: 30, rc: '-exp' } ] });
add('WOBBLETAPE', { alg: 5, fb: 4, lfo: lfo('tri', 12, 24, 4),
  ops: [ { r: 1, l: 94, ...E.swell(54, 40) }, { r: 1, l: 60, ...E.swell(50, 40), rd: 20 },
         { r: 1, l: 88, ...E.swell(54, 40), det: 6 }, { r: 2, l: 50, ...E.swell(50, 40) },
         { r: 0.5, l: 82, ...E.swell(54, 40), det: -3 }, { r: 1, l: 52, ...E.swell(50, 40) } ] });
add('SEASICK EP', { alg: 5, fb: 0, lfo: lfo('sine', 20, 16, 4),
  ops: [ { r: 1, l: 98, ...E.ring(42, 30, 46, 60), kvs: 3 }, { r: 1, l: 70, ...E.ring(52, 34, 50, 40), kvs: 4, rd: 40, rc: '-exp' },
         { r: 1, l: 92, ...E.ring(44, 30, 46, 58), det: 5, kvs: 3 }, { r: 14, l: 52, ...E.pluck(76, 50), kvs: 5 },
         { r: 0.5, l: 76, ...E.ring(40, 28, 44, 56), kvs: 2 }, { r: 1, l: 44, ...E.ring(52, 34, 50, 40), kvs: 4 } ] });
add('MELTCHOIR', { alg: 5, fb: 2, lfo: lfo('sine', 14, 20, 4, 0, 8),
  ops: [ { r: 1, l: 92, ...E.swell(46, 38), ams: 1 }, { r: 1, l: 52, ...E.swell(46, 38) },
         { r: 1, l: 86, ...E.swell(46, 38), det: 5 }, { r: 3, l: 48, ...E.swell(46, 38) },
         { r: 4, l: 70, ...E.swell(46, 38), det: -5 }, { r: 1, l: 38, ...E.swell(46, 38) } ] });
add('WARPED BOX', { alg: 5, fb: 0, lfo: lfo('tri', 14, 18, 5),
  ops: [ { r: 4, l: 96, ...E.ring(56, 36, 44, 46), kvs: 2 }, { r: 7, l: 58, ...E.pluck(60, 44), kvs: 3, rd: 20 },
         { r: 8, l: 80, ...E.ring(60, 40, 44, 40), det: 4, kvs: 2 }, { r: 3.5, l: 52, ...E.pluck(64, 44), kvs: 3 },
         { r: 2, l: 72, ...E.ring(52, 34, 40, 50), kvs: 2 }, { r: 1, l: 40, ...E.pluck(60, 44) } ] });
add('DROWNPIANO', { alg: 5, fb: 2, lfo: lfo('sine', 18, 12, 4, 0, 6),
  ops: [ { r: 1, l: 98, ...E.ring(40, 28, 40, 64), kvs: 3, ams: 1 }, { r: 1, l: 72, ...E.ring(58, 30, 44, 30), kvs: 4, rd: 30, rc: '-exp' },
         { r: 2, l: 80, ...E.ring(46, 30, 40, 50), det: 3, kvs: 3 }, { r: 1, l: 66, ...E.ring(62, 32, 44, 20), kvs: 4 },
         { r: 0.5, l: 84, ...E.ring(38, 26, 40, 60), det: -3, kvs: 3 }, { r: 3, l: 44, ...E.pluck(70, 44), kvs: 5 } ] });
add('VCR GHOST', { alg: 2, fb: 5, lfo: lfo('sh', 22, 6, 3, 0, 12),
  ops: [ { r: 1, l: 94, ...E.swell(50, 36), ams: 2 }, { r: 1, l: 66, ...E.swell(50, 36) },
         { r: 1, l: 86, ...E.swell(50, 36), det: 4, ams: 2 }, { r: 2, l: 56, ...E.swell(50, 36) },
         { r: 3, l: 44, ...E.swell(50, 36) }, { r: 5, l: 36, ...E.swell(50, 36) } ] });
add('WOW&FLUTTR', { alg: 5, fb: 3, lfo: lfo('sine', 54, 6, 4, 0, 4),
  ops: [ { r: 1, l: 94, ...E.sus(80, 40, 86, 44) }, { r: 1, l: 66, ...E.sus(80, 40, 70, 44), rd: 20 },
         { r: 1, l: 90, ...E.sus(80, 40, 86, 44), det: 3 }, { r: 2, l: 56, ...E.sus(80, 40, 70, 44) },
         { r: 2, l: 76, ...E.sus(80, 40, 86, 44), det: -3 }, { r: 1, l: 52, ...E.sus(80, 40, 70, 44) } ] });
add('BROKENDECK', { alg: 5, fb: 4, lfo: lfo('sh', 14, 14, 4),
  ops: [ { r: 1, l: 94, ...E.swell(62, 38) }, { r: 1, l: 64, ...E.swell(62, 38), rd: 20 },
         { r: 1, l: 88, ...E.swell(62, 38), det: 7 }, { r: 1, l: 60, ...E.swell(62, 38) },
         { r: 0.5, l: 80, ...E.swell(62, 38), det: -6 }, { r: 2, l: 48, ...E.swell(62, 38) } ] });
add('LULLABYROT', { alg: 5, fb: 0, lfo: lfo('sine', 12, 12, 5, 40),
  ops: [ { r: 2, l: 96, ...E.ring(50, 30, 40, 40), kvs: 2 }, { r: 2, l: 46, ...E.pluck(52, 40), kvs: 2 },
         { r: 4, l: 80, ...E.ring(56, 34, 40, 34), det: 2, kvs: 2 }, { r: 7.07, l: 40, ...E.pluck(60, 40), kvs: 3 },
         { r: 1, l: 76, ...E.ring(44, 28, 40, 46), kvs: 2 }, { r: 3, l: 36, ...E.pluck(52, 40) } ] });
add('SLASHERPNO', { alg: 5, fb: 1, lfo: lfo('sine', 30, 2, 2),
  ops: [ { r: 1, l: 98, ...E.ring(44, 24, 46, 70), kvs: 3 }, { r: 1, l: 70, ...E.ring(64, 30, 50, 40), kvs: 4, rd: 40, rc: '-exp' },
         { r: 2, l: 78, ...E.ring(50, 26, 46, 60), det: 2, kvs: 3 }, { r: 5, l: 60, ...E.pluck(72, 46), kvs: 5 },
         { r: 0.5, l: 82, ...E.ring(42, 24, 46, 70), det: -1, kvs: 3 }, { r: 1, l: 58, ...E.pluck(66, 46), kvs: 4 } ] });
add('MIDNIGHTPL', { alg: 5, fb: 6, lfo: lfo('tri', 26, 8, 3),
  ops: [ { r: 1, l: 94, ...E.sus(78, 46, 88, 46), kvs: 2 }, { r: 1, l: 76, rt: [70, 40, 30, 46], lv: [99, 80, 74, 0], kvs: 3, rd: 30 },
         { r: 1, l: 92, ...E.sus(78, 46, 88, 46), det: 5, kvs: 2 }, { r: 1, l: 74, rt: [70, 40, 30, 46], lv: [99, 80, 74, 0], kvs: 3, det: 5 },
         { r: 1, l: 90, ...E.sus(78, 46, 88, 46), det: -5, kvs: 2 }, { r: 1, l: 74, rt: [70, 40, 30, 46], lv: [99, 80, 74, 0], kvs: 3 } ] });
add('GIALLOLEAD', { alg: 16, fb: 6, lfo: lfo('sine', 34, 12, 4, 38),
  ops: [ { r: 1, l: 96, ...E.sus(90, 40, 92, 48), kvs: 2 }, { r: 1, l: 76, ...E.sus(80, 40, 80, 48), kvs: 3 },
         { r: 2, l: 66, ...E.sus(80, 40, 70, 48) }, { r: 1, l: 52, ...E.sus(80, 40, 60, 48), det: 3 },
         { r: 3, l: 50, ...E.sus(80, 40, 60, 48) }, { r: 1, l: 70, ...E.sus(80, 40, 70, 48) } ] });
add('SINKINGLED', { alg: 16, fb: 5, lfo: lfo('sine', 32, 10, 4, 30),
  peg: { rt: [99, 28, 99, 50], lv: [50, 41, 41, 50] },
  ops: [ { r: 1, l: 96, ...E.sus(92, 40, 92, 46), kvs: 2 }, { r: 1, l: 72, ...E.sus(80, 40, 76, 46) },
         { r: 2, l: 60, ...E.sus(80, 40, 64, 46) }, { r: 1, l: 50, ...E.sus(80, 40, 60, 46), det: 2 },
         { r: 1, l: 56, ...E.sus(80, 40, 60, 46) }, { r: 1, l: 68, ...E.sus(80, 40, 70, 46) } ] });
add('MOONWARBLE', { alg: 32, fb: 2, lfo: lfo('sine', 17, 20, 4, 20, 10),
  ops: [ { r: 1, l: 92, ...E.swell(48, 36), ams: 1 }, { r: 2, l: 76, ...E.swell(52, 36), det: 3 },
         { r: 3, l: 62, ...E.swell(56, 36) }, { r: 1, l: 84, ...E.swell(48, 36), det: -5 },
         { r: 4, l: 56, ...E.swell(60, 36) }, { r: 0.5, l: 74, ...E.swell(48, 36) } ] });
add('SEANCESTRG', { alg: 1, fb: 6, lfo: lfo('sine', 22, 10, 4, 10),
  ops: [ { r: 1, l: 94, ...strings(54, 42) }, { r: 1, l: 74, ...strings(56, 42), rd: 30, rc: '-exp' },
         { r: 1, l: 92, ...strings(54, 42), det: 5 }, { r: 1, l: 70, ...strings(56, 42), det: 5 },
         { r: 1, l: 60, ...strings(56, 42) }, { r: 1, l: 64, ...strings(56, 42) } ] });
add('ETHER WOW', { alg: 32, fb: 0, lfo: lfo('tri', 9, 26, 4, 0, 16),
  ops: [ { r: 1, l: 90, ...E.swell(40, 30), ams: 1 }, { r: 1, l: 86, ...E.swell(42, 30), det: 6 },
         { r: 2, l: 72, ...E.swell(44, 30), det: -6 }, { r: 3, l: 60, ...E.swell(46, 30), ams: 2 },
         { r: 5, l: 50, ...E.swell(48, 30) }, { r: 0.5, l: 76, ...E.swell(40, 30) } ] });
add('LOST VHS', { alg: 5, fb: 7, lfo: lfo('sh', 9, 10, 4, 0, 6),
  ops: [ { r: 1, l: 92, ...E.swell(56, 40), ams: 1 }, { r: 1, l: 58, ...E.swell(56, 40) },
         { r: 1, l: 84, ...E.swell(56, 40), det: -6 }, { r: 3, l: 40, ...E.swell(56, 40) },
         { r: 2, l: 74, ...E.swell(56, 40), det: 6 }, { r: 9, l: 48, ...E.swell(56, 40), rd: 40 } ] });

// =====================================================================
// 34-52  GHOSTLY: theremin, choirs, wind, wails
// =====================================================================
const theremin = (name, speed, pmd, pms, delay, peg, extra = {}) => add(name, Object.assign({ alg: 32, fb: 2,
  lfo: lfo('sine', speed, pmd, pms, delay), peg,
  ops: [ { r: 1, l: 98, ...E.swell(70, 48), kvs: 2 }, { r: 2, l: 66, ...E.swell(70, 48), kvs: 2, rd: 20 },
         { r: 3, l: 52, ...E.swell(70, 48), kvs: 2, rd: 30 }, off, off, { r: 1, l: 46, ...E.swell(70, 48), det: 1 } ] }, extra));
theremin('THEREMIN', 38, 14, 3, 40, { rt: [62, 99, 99, 50], lv: [50, 50, 50, 45] });
theremin('AETHERWAVE', 34, 22, 4, 20, { rt: [44, 99, 99, 36], lv: [50, 50, 50, 42] });
theremin('SAUCER MAN', 46, 30, 4, 0, { rt: [40, 30, 99, 30], lv: [53, 50, 50, 40] });
add('BANSHEE', { alg: 16, fb: 3, lfo: lfo('sine', 40, 24, 4, 30), peg: { rt: [38, 30, 99, 24], lv: [56, 49, 50, 34] },
  ops: [ { r: 1, l: 98, ...E.swell(64, 40), kvs: 2 }, { r: 1, l: 58, ...E.swell(60, 40) }, { r: 3, l: 54, ...E.swell(60, 40) },
         { r: 1, l: 40, ...E.swell(60, 40) }, { r: 2, l: 44, ...E.swell(60, 40) }, { r: 1, l: 52, ...E.swell(60, 40), det: 2 } ] });
const choir = (name, att, rel, f, lf, det) => add(name, { alg: 5, fb: 1, lfo: lf,
  ops: [ { r: 1, l: 94, ...E.swell(att, rel), kvs: 1, ams: 1 }, { r: 1, l: 50, ...E.swell(att + 4, rel) },
         { r: 1, l: 88, ...E.swell(att, rel), det, kvs: 1 }, { r: f[0], l: f[1], ...E.swell(att + 4, rel) },
         { r: f[2], l: 70, ...E.swell(att, rel), det: -det, kvs: 1 }, { r: 1, l: 30, ...E.swell(att + 4, rel) } ] });
choir('GHOSTCHOIR', 46, 38, [3, 46, 4], lfo('tri', 30, 5, 3, 30, 6), 4);
choir('SPECTREVOX', 52, 34, [2, 52, 5], lfo('sine', 26, 7, 3, 20, 8), 5);
choir('CRYPT CHOR', 40, 30, [4, 44, 3], lfo('tri', 22, 6, 3, 30, 10), 3);
choir('MOURNERS', 36, 26, [5, 40, 6], lfo('sine', 18, 8, 3, 10, 12), 6);
add('POLTERGST', { alg: 32, fb: 3, lfo: lfo('sh', 30, 40, 5),
  ops: [ { r: 1, l: 90, ...E.swell(56, 40) }, { r: 2.01, l: 72, ...E.swell(56, 40) }, { r: 3, l: 60, ...E.swell(56, 40), det: 3 },
         { r: 5, l: 48, ...E.swell(56, 40) }, off, { r: 0.5, l: 70, ...E.swell(56, 40) } ] });
add('SPECTRWIND', { alg: 1, fb: 7, lfo: lfo('tri', 6, 40, 6, 0, 22),
  ops: [ { r: 1, l: 84, ...E.swell(36, 30), ams: 1 }, { r: 2, l: 20, ...E.swell(36, 30) },
         { r: 1, l: 96, ...E.swell(34, 30), ams: 1, kvs: 0 }, { r: 3, l: 92, ...E.swell(30, 30) },
         { r: 3.1, l: 92, ...E.swell(30, 30) }, { r: 5.3, l: 99, ...E.organ(30) } ] });
add('HOWLINWIND', { alg: 1, fb: 7, lfo: lfo('tri', 4, 60, 7, 0, 24),
  ops: [ { r: 1, l: 82, ...E.swell(30, 26), ams: 1 }, off,
         { r: 0.5, l: 94, ...E.swell(28, 26), ams: 1 }, { r: 2.1, l: 90, ...E.swell(30, 26) },
         { r: 4.7, l: 94, ...E.swell(30, 26) }, { r: 6.9, l: 99, ...E.organ(30) } ] });
add('WHISPERS', { alg: 1, fb: 7, lfo: lfo('sh', 38, 4, 3, 0, 26),
  ops: [ off, off, { r: 2, l: 94, ...E.swell(48, 40), ams: 1 }, { r: 3.5, l: 80, ...E.swell(48, 40) },
         { r: 4.1, l: 94, ...E.swell(48, 40) }, { r: 7.3, l: 99, ...E.organ(40) } ] });
add('GLASSHARMO', { alg: 5, fb: 0, lfo: lfo('sine', 28, 4, 3, 20, 14),
  ops: [ { r: 1, l: 96, ...E.swell(60, 38), ams: 1, kvs: 2 }, { r: 1, l: 30, ...E.swell(60, 38) },
         { r: 3, l: 60, ...E.swell(62, 36), kvs: 2 }, { r: 1, l: 20, ...E.swell(60, 38) },
         { r: 1, l: 80, ...E.swell(60, 38), det: 3, ams: 1 }, { r: 5, l: 22, ...E.swell(60, 38) } ] });
add('ECTOPLASM', { alg: 5, fb: 4, lfo: lfo('sine', 20, 10, 4, 0, 14),
  ops: [ { r: 1, l: 94, ...E.bloom(44, 30, 86, 32), ams: 1 }, { r: 3.5, l: 58, ...E.bloom(54, 40, 50, 32) },
         { r: 2, l: 82, ...E.bloom(48, 30, 84, 32), det: 4 }, { r: 1.41, l: 54, ...E.bloom(50, 40, 50, 32) },
         { r: 0.5, l: 76, ...E.bloom(40, 30, 88, 32), det: -4 }, { r: 1, l: 46, ...E.bloom(40, 30, 50, 32) } ] });
add('WILLOWISP', { alg: 32, fb: 0, lfo: lfo('sine', 40, 12, 4, 0, 30),
  ops: [ { r: 4, l: 90, ...E.ring(46, 32, 36, 60), ams: 2 }, { r: 8, l: 70, ...E.ring(52, 36, 36, 50), det: 4, ams: 2 },
         { r: 6, l: 74, ...E.ring(50, 34, 36, 50), det: -3 }, { r: 2, l: 76, ...E.swell(54, 36) },
         { r: 12, l: 56, ...E.ring(58, 40, 36, 40) }, { r: 1, l: 58, ...E.swell(54, 36) } ] });
add('GRAVEMIST', { alg: 2, fb: 6, lfo: lfo('tri', 8, 12, 4, 0, 18),
  ops: [ { r: 1, l: 92, ...E.swell(36, 28), ams: 2 }, { r: 2, l: 50, ...E.swell(36, 28) },
         { r: 1, l: 88, ...E.swell(34, 28), det: 5 }, { r: 1, l: 60, ...E.swell(36, 28) },
         { r: 3, l: 46, ...E.swell(36, 28) }, { r: 7, l: 52, ...E.swell(36, 28) } ] });
add('BEYONDVEIL', { alg: 5, fb: 5, lfo: lfo('tri', 7, 16, 4, 0, 20),
  ops: [ { r: 1, l: 92, ...E.bloom(34, 22, 90, 26), ams: 2 }, { r: 1, l: 60, rt: [30, 24, 20, 26], lv: [70, 90, 60, 0] },
         { r: 1.5, l: 82, ...E.bloom(32, 22, 90, 26), det: 6 }, { r: 2, l: 54, rt: [28, 20, 22, 26], lv: [99, 50, 80, 0] },
         { r: 0.5, l: 82, ...E.bloom(30, 22, 90, 26), det: -6 }, { r: 3, l: 44, rt: [24, 30, 20, 26], lv: [40, 90, 70, 0] } ] });
add('LOST SOUL', { alg: 18, fb: 4, lfo: lfo('sine', 30, 20, 4, 50), peg: { rt: [30, 22, 99, 26], lv: [44, 52, 50, 38] },
  ops: [ { r: 1, l: 96, ...E.swell(58, 36), kvs: 2 }, { r: 1, l: 52, ...E.swell(58, 36) }, { r: 2, l: 46, ...E.swell(58, 36) },
         { r: 3, l: 50, ...E.swell(58, 36) }, { r: 1, l: 40, ...E.swell(58, 36) }, { r: 0.5, l: 48, ...E.swell(58, 36) } ] });
add('SHADOW PAD', { alg: 5, fb: 6, lfo: lfo('sine', 12, 8, 3, 0, 12),
  ops: [ { r: 0.5, l: 94, ...E.swell(40, 30), ams: 1 }, { r: 1, l: 62, ...E.swell(46, 30), rd: 30 },
         { r: 1, l: 88, ...E.swell(40, 30), det: 4 }, { r: 1, l: 58, ...E.swell(46, 30), det: 4 },
         { r: 1.5, l: 76, ...E.swell(40, 30), det: -4 }, { r: 1, l: 50, ...E.swell(46, 30) } ] });

// =====================================================================
// 53-66  BELLS, CHIMES, MUSIC BOXES
// =====================================================================
add('TUBULARDOM', { alg: 5, fb: 0, lfo: lfo('sine', 30, 0, 0, 0, 0),
  ops: [ { r: 1, l: 96, ...E.ring(56, 28, 30, 60), kvs: 3 }, { r: 3.5, l: 70, ...E.ring(60, 30, 30, 50), kvs: 3 },
         { r: 2, l: 84, ...E.ring(58, 28, 30, 56), det: 2, kvs: 3 }, { r: 5.6, l: 62, ...E.ring(66, 30, 30, 40), kvs: 3 },
         { r: 0.5, l: 80, ...E.ring(54, 26, 30, 60), kvs: 3 }, { r: 1.41, l: 52, ...E.ring(60, 30, 30, 40), kvs: 3 } ] });
add('DIRGE BELL', { alg: 5, fb: 0, trnsp: -12,
  ops: [ { r: 0.5, l: 96, ...E.ring(48, 22, 26, 70), kvs: 3 }, { r: 1.19, l: 74, ...E.ring(50, 24, 26, 50), kvs: 3 },
         { r: 1, l: 88, ...E.ring(52, 24, 26, 66), det: 3, kvs: 3 }, { r: 2.4, l: 66, ...E.ring(60, 28, 26, 44), kvs: 3 },
         { r: 2, l: 82, ...E.ring(54, 24, 26, 60), det: -3, kvs: 3 }, { r: 2.98, l: 70, ...E.ring(62, 30, 26, 40), kvs: 3 } ] });
add('MUSIC BOX', { alg: 5, fb: 0,
  ops: [ { r: 4, l: 96, ...E.ring(62, 40, 46, 40), kvs: 2 }, { r: 8, l: 50, ...E.pluck(66, 46), kvs: 3, rd: 30 },
         { r: 8, l: 74, ...E.ring(66, 44, 46, 30), kvs: 2 }, { r: 5, l: 40, ...E.pluck(70, 46), kvs: 3 },
         { r: 2, l: 66, ...E.ring(58, 36, 46, 40), kvs: 2 }, { r: 11, l: 34, ...E.pluck(72, 46), kvs: 3 } ] });
add('CURSED BOX', { alg: 5, fb: 0, lfo: lfo('sine', 16, 10, 5, 30),
  ops: [ { r: 4, l: 96, ...E.ring(58, 38, 44, 44), kvs: 2 }, { r: 6.3, l: 56, ...E.pluck(62, 44), kvs: 3 },
         { r: 4, l: 86, ...E.ring(60, 40, 44, 40), det: 5, kvs: 2 }, { r: 9.1, l: 48, ...E.pluck(66, 44), kvs: 3 },
         { r: 2, l: 70, ...E.ring(56, 36, 44, 40), det: -5, kvs: 2 }, { r: 3.3, l: 40, ...E.pluck(62, 44) } ] });
add('CELESTDOOM', { alg: 5, fb: 0,
  ops: [ { r: 2, l: 96, ...E.ring(60, 36, 44, 50), kvs: 3 }, { r: 2, l: 56, ...E.pluck(64, 44), kvs: 4, rd: 30 },
         { r: 4, l: 80, ...E.ring(62, 38, 44, 40), kvs: 3, det: 2 }, { r: 14, l: 38, ...E.pluck(78, 44), kvs: 4 },
         { r: 1, l: 66, ...E.ring(56, 34, 44, 50), kvs: 3 }, { r: 1, l: 36, ...E.pluck(60, 44) } ] });
add('BONECHIMES', { alg: 32, fb: 0, lfo: lfo('sine', 24, 4, 3),
  ops: [ { r: 3.07, l: 88, ...E.ring(50, 32, 36, 50), kvs: 3 }, { r: 5.11, l: 82, ...E.ring(54, 34, 36, 46), kvs: 3 },
         { r: 6.93, l: 76, ...E.ring(56, 34, 36, 40), kvs: 3 }, { r: 8.42, l: 70, ...E.ring(58, 36, 36, 36), kvs: 3 },
         { r: 11.2, l: 62, ...E.ring(62, 40, 36, 30), kvs: 3 }, { r: 2.01, l: 80, ...E.ring(48, 30, 36, 50), kvs: 3 } ] });
add('CRYSTSKULL', { alg: 5, fb: 0, lfo: lfo('sine', 26, 3, 3, 0, 8),
  ops: [ { r: 1, l: 96, ...E.ring(46, 26, 32, 70), kvs: 2, ams: 1 }, { r: 7, l: 52, ...E.ring(52, 30, 32, 30), kvs: 3 },
         { r: 3, l: 82, ...E.ring(48, 28, 32, 60), det: 3, kvs: 2 }, { r: 9.9, l: 44, ...E.ring(56, 34, 32, 30), kvs: 3 },
         { r: 5, l: 70, ...E.ring(50, 30, 32, 50), det: -3, kvs: 2 }, { r: 1, l: 30, ...E.ring(50, 30, 32, 30) } ] });
add('CLOCKTOWER', { alg: 5, fb: 0, trnsp: -12,
  ops: [ { r: 1, l: 96, ...E.ring(46, 22, 26, 70), kvs: 2 }, { r: 2.76, l: 72, ...E.ring(52, 26, 26, 50), kvs: 3 },
         { r: 2, l: 84, ...E.ring(48, 24, 26, 60), det: 2, kvs: 2 }, { r: 5.4, l: 60, ...E.ring(56, 28, 26, 40), kvs: 3 },
         { r: 3, l: 76, ...E.ring(50, 24, 26, 56), det: -2, kvs: 2 }, { r: 4.2, l: 56, ...E.ring(58, 30, 26, 40) } ] });
add('GLOCKGHOUL', { alg: 5, fb: 0,
  ops: [ { r: 4, l: 96, ...E.ring(58, 40, 40, 50), kvs: 3 }, { r: 14, l: 46, ...E.pluck(72, 40), kvs: 4 },
         { r: 8, l: 76, ...E.ring(62, 42, 40, 40), kvs: 3 }, { r: 3.5, l: 50, ...E.pluck(68, 40), kvs: 4 },
         { r: 11.9, l: 60, ...E.ring(66, 46, 40, 30), kvs: 3 }, { r: 1, l: 30, ...E.pluck(60, 40) } ] });
add('ICECAVEBEL', { alg: 5, fb: 0, lfo: lfo('sine', 22, 6, 4, 20),
  ops: [ { r: 2, l: 94, ...E.ring(40, 24, 28, 74), kvs: 2 }, { r: 5.19, l: 54, ...E.ring(46, 28, 28, 50), kvs: 3 },
         { r: 4, l: 82, ...E.ring(42, 24, 28, 70), det: 4, kvs: 2 }, { r: 7.07, l: 48, ...E.ring(48, 30, 28, 40), kvs: 3 },
         { r: 1, l: 78, ...E.swell(56, 30), kvs: 1 }, { r: 3, l: 30, ...E.swell(56, 30) } ] });
add('WITCHHOUR', { alg: 5, fb: 0,
  ops: [ { r: 1, l: 96, ...E.ring(50, 24, 28, 68), kvs: 3 }, { r: 3.5, l: 64, ...E.ring(54, 26, 28, 50), kvs: 3 },
         { r: 2.4, l: 82, ...E.ring(52, 26, 28, 60), kvs: 3 }, { r: 4.68, l: 56, ...E.ring(58, 28, 28, 40), kvs: 3 },
         { r: 3.6, l: 74, ...E.ring(54, 26, 28, 56), kvs: 3, det: 2 }, { r: 1, l: 40, ...E.ring(52, 26, 28, 40) } ] });
add('GAMELANGHO', { alg: 5, fb: 1, lfo: lfo('sine', 34, 4, 3),
  ops: [ { r: 1, l: 96, ...E.ring(52, 30, 36, 60), kvs: 3 }, { r: 2.7, l: 68, ...E.ring(56, 32, 36, 40), kvs: 3 },
         { r: 1, l: 90, ...E.ring(52, 30, 36, 60), det: 4, kvs: 3 }, { r: 3.9, l: 58, ...E.ring(58, 34, 36, 40), kvs: 3 },
         { r: 2, l: 70, ...E.ring(56, 32, 36, 50), det: -4, kvs: 3 }, { r: 5.1, l: 50, ...E.ring(60, 34, 36, 40) } ] });
add('BONE XYLO', { alg: 5, fb: 0,
  ops: [ { r: 1, l: 98, ...E.pluck(52, 54), kvs: 3 }, { r: 3.5, l: 66, ...E.pluck(66, 54), kvs: 4 },
         { r: 4, l: 80, ...E.pluck(58, 54), kvs: 3 }, { r: 10, l: 54, ...E.pluck(70, 54), kvs: 4 },
         { r: 3, l: 70, ...E.pluck(56, 54), kvs: 3, det: 2 }, { r: 1, l: 30, ...E.pluck(58, 54) } ] });
add('DEATHKNELL', { alg: 1, fb: 0, trnsp: -24,
  ops: [ { r: 1, l: 98, ...E.ring(42, 20, 24, 74), kvs: 2 }, { r: 1.4, l: 76, ...E.ring(46, 22, 24, 50), kvs: 3 },
         { r: 2.8, l: 82, ...E.ring(44, 20, 24, 66), kvs: 2 }, { r: 1.73, l: 70, ...E.ring(48, 22, 24, 50) },
         { r: 3.33, l: 60, ...E.ring(52, 24, 24, 40) }, { r: 0.5, l: 50, ...E.ring(50, 24, 24, 40) } ] });

// =====================================================================
// 67-80  70s / 80s HORROR SYNTH (slashers, giallo, video nasties)
// =====================================================================
const brassEnv = (a, rel) => ({ rt: [a, 40, 30, rel], lv: [99, 90, 86, 0] });
add('STALKRBASS', { alg: 16, fb: 6, trnsp: -12,
  ops: [ { r: 1, l: 98, ...E.sus(99, 50, 80, 64), kvs: 2 }, { r: 1, l: 80, ...E.ring(70, 40, 64, 50), kvs: 3 },
         { r: 2, l: 62, ...E.ring(76, 44, 64, 40), kvs: 3 }, { r: 1, l: 60, ...E.ring(70, 40, 64, 40) },
         { r: 1, l: 68, ...E.ring(72, 40, 64, 50), det: 3 }, { r: 1, l: 82, ...E.ring(72, 40, 64, 50) } ] });
add('CARPNTRDRN', { alg: 5, fb: 7, trnsp: -12, lfo: lfo('tri', 6, 6, 3, 0, 14),
  ops: [ { r: 1, l: 94, ...E.swell(46, 34), ams: 1 }, { r: 1, l: 76, ...E.swell(46, 34) },
         { r: 1, l: 92, ...E.swell(46, 34), det: 5 }, { r: 1, l: 74, ...E.swell(46, 34), det: 5 },
         { r: 0.5, l: 90, ...E.swell(46, 34), det: -5 }, { r: 1, l: 78, ...E.swell(46, 34) } ] });
add('PROPHDOOM', { alg: 5, fb: 6, lfo: lfo('tri', 30, 6, 3, 30),
  ops: [ { r: 1, l: 96, ...brassEnv(70, 46), kvs: 2 }, { r: 1, l: 78, rt: [60, 36, 30, 46], lv: [99, 84, 76, 0], kvs: 3 },
         { r: 1, l: 94, ...brassEnv(70, 46), det: 5, kvs: 2 }, { r: 1, l: 76, rt: [60, 36, 30, 46], lv: [99, 84, 76, 0], det: 5, kvs: 3 },
         { r: 0.5, l: 88, ...brassEnv(70, 46), det: -5, kvs: 2 }, { r: 1, l: 76, rt: [60, 36, 30, 46], lv: [99, 84, 76, 0], kvs: 3 } ] });
add('NIGHTSTALK', { alg: 1, fb: 5, trnsp: -12,
  ops: [ { r: 1, l: 98, ...E.ring(99, 46, 60, 70), kvs: 2 }, { r: 1, l: 82, ...E.ring(80, 50, 62, 50), kvs: 4 },
         { r: 1, l: 90, ...E.ring(99, 46, 60, 70), det: 3, kvs: 2 }, { r: 2, l: 70, ...E.ring(80, 50, 62, 40), kvs: 4 },
         { r: 1, l: 60, ...E.ring(80, 50, 62, 40) }, { r: 1, l: 66, ...E.ring(80, 50, 62, 40) } ] });
add('FOG SYNTH', { alg: 5, fb: 6, lfo: lfo('tri', 14, 8, 3, 0, 10),
  ops: [ { r: 1, l: 92, ...E.swell(44, 32), ams: 1 }, { r: 1, l: 58, ...E.swell(54, 32), rd: 30 },
         { r: 2, l: 82, ...E.swell(44, 32), det: 4 }, { r: 1, l: 54, ...E.swell(54, 32), det: 4 },
         { r: 1, l: 86, ...E.swell(44, 32), det: -4 }, { r: 1, l: 56, ...E.swell(54, 32) } ] });
add('DARK SEQ', { alg: 16, fb: 6, trnsp: -12,
  ops: [ { r: 1, l: 98, ...E.pluck(46, 62, 0), kvs: 3 }, { r: 1, l: 82, ...E.pluck(64, 62), kvs: 4 },
         { r: 2, l: 66, ...E.pluck(70, 62), kvs: 4 }, { r: 1, l: 60, ...E.pluck(66, 62) },
         { r: 3, l: 60, ...E.pluck(70, 62), det: 2 }, { r: 1, l: 80, ...E.pluck(64, 62) } ] });
add('BLOODBRASS', { alg: 18, fb: 6, lfo: lfo('sine', 32, 6, 3, 40),
  ops: [ { r: 1, l: 98, ...brassEnv(64, 48), kvs: 2 }, { r: 1, l: 80, rt: [56, 38, 30, 48], lv: [99, 84, 76, 0], kvs: 3 },
         { r: 1, l: 82, rt: [56, 38, 30, 48], lv: [99, 80, 74, 0], kvs: 3 }, { r: 1, l: 72, rt: [56, 38, 30, 48], lv: [99, 84, 76, 0], det: 3 },
         { r: 1, l: 66, rt: [56, 38, 30, 48], lv: [99, 84, 76, 0] }, { r: 2, l: 60, rt: [56, 38, 30, 48], lv: [99, 84, 76, 0] } ] });
add('OMINOUSWLL', { alg: 5, fb: 6, lfo: lfo('sine', 20, 4, 3, 0, 8),
  ops: [ { r: 1, l: 94, rt: [30, 99, 99, 34], lv: [99, 99, 99, 0], ams: 1 }, { r: 1, l: 82, rt: [24, 99, 99, 34], lv: [99, 99, 99, 0] },
         { r: 1, l: 92, rt: [30, 99, 99, 34], lv: [99, 99, 99, 0], det: 5 }, { r: 2, l: 70, rt: [24, 99, 99, 34], lv: [99, 99, 99, 0] },
         { r: 0.5, l: 88, rt: [30, 99, 99, 34], lv: [99, 99, 99, 0], det: -5 }, { r: 1, l: 72, rt: [26, 99, 99, 34], lv: [99, 99, 99, 0] } ] });
add('VAMPSTRING', { alg: 1, fb: 6, lfo: lfo('sine', 30, 7, 3, 40),
  ops: [ { r: 1, l: 94, ...strings(60, 46) }, { r: 1, l: 76, ...strings(62, 46), rd: 30, rc: '-exp' },
         { r: 1, l: 92, ...strings(60, 46), det: -4 }, { r: 1, l: 72, ...strings(62, 46), det: 4 },
         { r: 2, l: 56, ...strings(62, 46) }, { r: 1, l: 70, ...strings(62, 46) } ] });
add('ZOMBIEBASS', { alg: 1, fb: 7, trnsp: -24,
  ops: [ { r: 1, l: 98, ...E.sus(99, 40, 76, 60), kvs: 2 }, { r: 0.5, l: 76, ...E.ring(76, 40, 60, 50), kvs: 3 },
         { r: 1, l: 92, ...E.sus(99, 40, 76, 60), kvs: 2 }, { r: 1, l: 76, ...E.ring(76, 38, 60, 50), kvs: 3 },
         { r: 3, l: 60, ...E.ring(80, 40, 60, 40) }, { r: 1, l: 74, ...E.ring(80, 40, 60, 40) } ] });
add('SPLATRSTAB', { alg: 16, fb: 7,
  ops: [ { r: 1, l: 98, ...E.ring(99, 46, 56, 60), kvs: 3 }, { r: 1, l: 86, ...E.ring(90, 40, 60, 40), kvs: 4 },
         { r: 1.5, l: 74, ...E.ring(90, 40, 60, 40), kvs: 4 }, { r: 2, l: 70, ...E.ring(90, 40, 60, 40), det: 4 },
         { r: 3, l: 68, ...E.ring(90, 40, 60, 40) }, { r: 1, l: 86, ...E.ring(90, 40, 60, 40) } ] });
add('NOSFERASUB', { alg: 1, fb: 0, trnsp: -24, lfo: lfo('sine', 30, 2, 2),
  ops: [ { r: 1, l: 99, ...E.sus(99, 40, 92, 56), kvs: 1 }, { r: 1, l: 46, ...E.ring(80, 40, 50, 50), kvs: 3 },
         { r: 0.5, l: 80, ...E.sus(99, 40, 92, 56), kvs: 1 }, { r: 1, l: 40, ...E.ring(80, 40, 50, 50) }, off, off ] });
add('CREEP SAW', { alg: 5, fb: 7, lfo: lfo('tri', 24, 6, 3, 0),
  ops: [ { r: 1, l: 94, ...E.sus(90, 40, 90, 48), kvs: 2 }, { r: 1, l: 82, ...E.sus(90, 40, 90, 48) },
         { r: 1, l: 92, ...E.sus(90, 40, 90, 48), det: 6, kvs: 2 }, { r: 1, l: 80, ...E.sus(90, 40, 90, 48), det: 6 },
         { r: 1, l: 90, ...E.sus(90, 40, 90, 48), det: -6, kvs: 2 }, { r: 1, l: 80, ...E.sus(90, 40, 90, 48) } ] });
add('VIDEONASTY', { alg: 16, fb: 7, lfo: lfo('sh', 36, 8, 4),
  ops: [ { r: 1, l: 96, ...E.sus(92, 40, 90, 46), kvs: 2 }, { r: 1.01, l: 84, ...E.sus(90, 40, 86, 46) },
         { r: 2, l: 66, ...E.sus(90, 40, 80, 46) }, { r: 1, l: 66, ...E.sus(90, 40, 80, 46), det: 5 },
         { r: 0.5, l: 70, ...E.sus(90, 40, 80, 46) }, { r: 1, l: 84, ...E.sus(90, 40, 86, 46) } ] });

// =====================================================================
// 81-91  90s DARK: ambient, industrial, survival horror, X-ish whistle
// =====================================================================
add('SKEPTICWHS', { alg: 2, fb: 0, lfo: lfo('sine', 36, 16, 3, 50),
  ops: [ { r: 1, l: 98, ...E.swell(66, 44), kvs: 2 }, { r: 2, l: 30, ...E.swell(66, 44) },
         { r: 1, l: 38, ...E.swell(56, 44), kvs: 1 }, { r: 3.13, l: 74, ...E.swell(56, 44) },
         { r: 5.7, l: 80, ...E.swell(56, 44) }, { r: 8.1, l: 90, ...E.organ(44) } ] });
add('DARKAMBNT', { alg: 5, fb: 5, lfo: lfo('tri', 5, 10, 4, 0, 16),
  ops: [ { r: 0.5, l: 92, ...E.bloom(30, 24, 90, 24), ams: 2 }, { r: 1.5, l: 58, rt: [24, 20, 20, 24], lv: [70, 90, 60, 0] },
         { r: 1, l: 86, ...E.bloom(30, 24, 90, 24), det: 6 }, { r: 2.01, l: 52, rt: [22, 20, 20, 24], lv: [99, 60, 80, 0] },
         { r: 1.5, l: 76, ...E.bloom(30, 24, 90, 24), det: -6 }, { r: 3.5, l: 44, rt: [20, 30, 20, 24], lv: [40, 90, 70, 0] } ] });
add('INDUSCLANG', { alg: 5, fb: 4,
  ops: [ { r: 1, l: 98, ...E.ring(76, 40, 40, 40), kvs: 3 }, { r: 2.71, l: 84, ...E.ring(80, 44, 40, 30), kvs: 4 },
         { r: 1.41, l: 90, ...E.ring(74, 40, 40, 36), kvs: 3 }, { r: 3.83, l: 80, ...E.ring(82, 44, 40, 30), kvs: 4 },
         { r: 0.5, l: 82, ...E.ring(70, 40, 40, 40), kvs: 3 }, { r: 6.9, l: 76, ...E.ring(84, 46, 40, 30) } ] });
add('NOIR KEYS', { alg: 5, fb: 0, lfo: lfo('sine', 32, 4, 3, 0, 12),
  ops: [ { r: 1, l: 98, ...E.ring(44, 26, 46, 66), kvs: 3, ams: 1 }, { r: 1, l: 64, ...E.ring(60, 30, 50, 30), kvs: 4, rd: 40, rc: '-exp' },
         { r: 1, l: 90, ...E.ring(44, 26, 46, 64), det: 2, kvs: 3, ams: 1 }, { r: 14, l: 48, ...E.pluck(80, 50), kvs: 5 },
         { r: 0.5, l: 70, ...E.ring(42, 24, 46, 60), kvs: 3 }, { r: 1, l: 52, ...E.ring(60, 30, 50, 30), kvs: 4 } ] });
add('PSX FOG', { alg: 5, fb: 6, lfo: lfo('tri', 10, 6, 3, 0, 18),
  ops: [ { r: 1, l: 92, ...E.swell(38, 30), ams: 2 }, { r: 3, l: 46, ...E.swell(38, 30) },
         { r: 1.5, l: 82, ...E.swell(38, 30), det: 4 }, { r: 1, l: 56, ...E.swell(38, 30) },
         { r: 0.5, l: 84, ...E.swell(38, 30), det: -4 }, { r: 2, l: 50, ...E.swell(38, 30) } ] });
add('PSX CHOIR', { alg: 5, fb: 1, lfo: lfo('tri', 26, 4, 3, 30, 4),
  ops: [ { r: 1, l: 94, ...E.swell(54, 40), kvs: 1 }, { r: 1, l: 46, ...E.swell(54, 40) },
         { r: 2, l: 82, ...E.swell(54, 40), det: 3, kvs: 1 }, { r: 3, l: 40, ...E.swell(54, 40) },
         { r: 5, l: 62, ...E.swell(54, 40), det: -3 }, { r: 1, l: 34, ...E.swell(54, 40) } ] });
add('METALSCRAP', { alg: 1, fb: 7, lfo: lfo('sh', 44, 30, 6),
  ops: [ { r: 1.41, l: 92, ...E.swell(70, 36), kvs: 2 }, { r: 3.17, l: 88, ...E.swell(70, 36) },
         { r: 2.23, l: 86, ...E.swell(70, 36) }, { r: 5.71, l: 84, ...E.swell(70, 36) },
         { r: 7.89, l: 86, ...E.swell(70, 36) }, { r: 11.3, l: 92, ...E.organ(36) } ] });
add('RESIDENTBR', { alg: 16, fb: 5, lfo: lfo('sine', 34, 5, 3, 40),
  ops: [ { r: 1, l: 98, ...brassEnv(60, 46), kvs: 2 }, { r: 1, l: 78, rt: [50, 40, 30, 46], lv: [99, 82, 76, 0], kvs: 3 },
         { r: 2, l: 62, rt: [50, 40, 30, 46], lv: [99, 82, 76, 0] }, { r: 1, l: 60, rt: [50, 40, 30, 46], lv: [99, 82, 76, 0], det: 3 },
         { r: 3, l: 54, rt: [50, 40, 30, 46], lv: [99, 82, 76, 0] }, { r: 1, l: 72, rt: [50, 40, 30, 46], lv: [99, 82, 76, 0] } ] });
add('CYBERGHOST', { alg: 32, fb: 3, lfo: lfo('square', 40, 6, 5, 0, 20),
  ops: [ { r: 1, l: 90, ...E.swell(66, 40), ams: 1 }, { r: 2, l: 76, ...E.swell(66, 40), det: 4 }, { r: 3, l: 66, ...E.swell(66, 40), ams: 1 },
         { r: 5, l: 56, ...E.swell(66, 40) }, { r: 8, l: 50, ...E.swell(66, 40), ams: 1 }, { r: 0.5, l: 70, ...E.swell(66, 40) } ] });
add('VOID DRONE', { alg: 5, fb: 7, trnsp: -12, lfo: lfo('tri', 3, 8, 4, 0, 22),
  ops: [ { r: 0.5, l: 94, ...E.swell(32, 24), ams: 2 }, { r: 0.5, l: 80, ...E.swell(32, 24) },
         { r: 0.75, l: 86, ...E.swell(32, 24), det: 6 }, { r: 1, l: 72, ...E.swell(32, 24) },
         { r: 1, l: 84, ...E.swell(32, 24), det: -6 }, { r: 1.5, l: 70, ...E.swell(32, 24) } ] });
add('SANITARIUM', { alg: 2, fb: 6, lfo: lfo('sh', 18, 6, 4, 0, 20),
  ops: [ { r: 1, l: 94, ...E.swell(46, 34), ams: 2 }, { r: 3.14, l: 60, ...E.swell(46, 34) },
         { r: 1.41, l: 82, ...E.swell(46, 34), det: 4 }, { r: 2.23, l: 54, ...E.swell(46, 34) },
         { r: 1.73, l: 52, ...E.swell(46, 34) }, { r: 4.33, l: 54, ...E.swell(46, 34) } ] });

// =====================================================================
// 92-103  HAUNTED SOUND EFFECTS
// =====================================================================
add('THUNDERCLP', { alg: 1, fb: 7, trnsp: -24, lfo: lfo('sh', 22, 6, 4, 0, 20),
  ops: [ { hz: 42, l: 96, rt: [92, 26, 22, 28], lv: [99, 80, 0, 0], ams: 1, kvs: 3 }, { hz: 31, l: 52, rt: [90, 30, 24, 28], lv: [99, 70, 0, 0] },
         { hz: 70, l: 92, rt: [96, 24, 20, 28], lv: [99, 76, 0, 0], ams: 1, kvs: 3 }, { hz: 96, l: 70, rt: [99, 30, 24, 28], lv: [99, 80, 0, 0] },
         { hz: 170, l: 82, ...E.organ(28) }, { hz: 260, l: 99, ...E.organ(28) } ] });
add('CREAKYDOOR', { alg: 16, fb: 6, lfo: lfo('sh', 74, 18, 5), peg: { rt: [22, 26, 20, 40], lv: [44, 56, 52, 40] },
  ops: [ { r: 1, l: 94, rt: [76, 30, 20, 40], lv: [99, 92, 0, 0], kvs: 2 }, { r: 1.5, l: 80, rt: [70, 30, 20, 40], lv: [99, 90, 60, 0] },
         { r: 2.02, l: 74, rt: [76, 30, 20, 40], lv: [99, 90, 0, 0] }, { r: 1, l: 64, ...E.organ(40) },
         { r: 1.01, l: 70, ...E.organ(40) }, { r: 0.5, l: 76, ...E.organ(40) } ] });
add('HEARTBEAT', { alg: 1, fb: 0, trnsp: -12, peg: { rt: [80, 99, 99, 99], lv: [50, 50, 50, 66] },
  ops: [ { r: 0.5, l: 99, rt: [99, 58, 40, 64], lv: [99, 0, 0, 0], kvs: 3 }, { r: 1, l: 58, ...E.pluck(80, 64), kvs: 3 },
         { r: 1, l: 86, rt: [99, 64, 40, 64], lv: [99, 0, 0, 0], kvs: 3 }, { r: 0.5, l: 40, ...E.pluck(80, 64) }, off, off ] });
add('BAT SWARM', { alg: 32, fb: 4, lfo: lfo('sh', 78, 50, 6, 0, 24),
  ops: [ { r: 8, l: 80, ...E.swell(80, 46), ams: 1 }, { r: 11, l: 74, ...E.swell(80, 46), ams: 1, det: 5 },
         { r: 13.6, l: 70, ...E.swell(80, 46), ams: 1 }, { r: 6.5, l: 74, ...E.swell(80, 46), ams: 1, det: -5 },
         { r: 17, l: 60, ...E.swell(80, 46), ams: 1 }, { r: 9.3, l: 70, ...E.swell(80, 46), ams: 1 } ] });
add('CAULDRON', { alg: 5, fb: 2, lfo: lfo('sh', 48, 70, 6, 0, 18),
  ops: [ { r: 1, l: 94, ...E.swell(80, 40), ams: 1 }, { r: 2, l: 66, ...E.swell(80, 40) },
         { r: 1.5, l: 84, ...E.swell(80, 40), ams: 1, det: 4 }, { r: 3, l: 60, ...E.swell(80, 40) },
         { r: 0.5, l: 80, ...E.swell(80, 40), ams: 1 }, { r: 1, l: 60, ...E.swell(80, 40) } ] });
add('RAVENCAW', { alg: 16, fb: 6, peg: { rt: [70, 40, 99, 60], lv: [58, 46, 46, 50] }, lfo: lfo('sh', 70, 14, 4),
  ops: [ { r: 1, l: 96, rt: [90, 50, 40, 60], lv: [99, 80, 0, 0], kvs: 3 }, { r: 2, l: 86, rt: [90, 50, 40, 60], lv: [99, 80, 0, 0] },
         { r: 3, l: 80, rt: [90, 50, 40, 60], lv: [99, 80, 0, 0] }, { r: 4.1, l: 70, rt: [90, 50, 40, 60], lv: [99, 80, 0, 0] },
         { r: 1.5, l: 76, rt: [90, 50, 40, 60], lv: [99, 80, 0, 0] }, { r: 2.1, l: 84, ...E.organ(60) } ] });
add('SCREAMQUEN', { alg: 16, fb: 5, lfo: lfo('sine', 50, 30, 5, 10), peg: { rt: [44, 34, 99, 30], lv: [62, 66, 66, 30] },
  ops: [ { r: 1, l: 96, ...E.swell(80, 40), kvs: 2 }, { r: 1, l: 70, ...E.swell(80, 40) }, { r: 3, l: 66, ...E.swell(80, 40) },
         { r: 5, l: 56, ...E.swell(80, 40) }, { r: 2, l: 60, ...E.swell(80, 40) }, { r: 7.1, l: 64, ...E.swell(80, 40) } ] });
add('CHAINRATTL', { alg: 32, fb: 6, lfo: lfo('sh', 72, 12, 5, 0, 30),
  ops: [ { r: 3.91, l: 84, ...E.ring(70, 50, 50, 40), ams: 1, kvs: 3 }, { r: 5.67, l: 80, ...E.ring(72, 50, 50, 40), ams: 1, kvs: 3 },
         { r: 7.3, l: 76, ...E.ring(74, 50, 50, 40), ams: 1, kvs: 3 }, { r: 9.6, l: 72, ...E.ring(76, 50, 50, 40), ams: 1 },
         { r: 12.4, l: 66, ...E.ring(78, 50, 50, 40), ams: 1 }, { r: 15.2, l: 70, ...E.ring(80, 50, 50, 40), ams: 1 } ] });
add('AIRRAIDSIR', { alg: 16, fb: 3, lfo: lfo('tri', 3, 99, 6), peg: { rt: [16, 99, 99, 18], lv: [50, 50, 50, 36] },
  ops: [ { r: 1, l: 96, ...E.swell(40, 24) }, { r: 1, l: 56, ...E.swell(40, 24) }, { r: 2, l: 46, ...E.swell(40, 24) },
         { r: 1, l: 40, ...E.swell(40, 24), det: 4 }, { r: 3, l: 40, ...E.swell(40, 24) }, { r: 1, l: 52, ...E.swell(40, 24) } ] });
add('GHOSTTRAIN', { alg: 5, fb: 7, lfo: lfo('square', 44, 2, 2, 0, 26), trnsp: -12,
  ops: [ { r: 1, l: 90, ...E.swell(46, 30), ams: 1 }, { r: 1.5, l: 70, ...E.swell(46, 30) },
         { r: 1.2, l: 86, ...E.swell(46, 30), ams: 1 }, { r: 1.8, l: 66, ...E.swell(46, 30) },
         { r: 2, l: 80, ...E.swell(46, 30), ams: 1 }, { r: 15, l: 90, ...E.swell(46, 30) } ] });
add('SPOOKY WOO', { alg: 32, fb: 1, lfo: lfo('sine', 34, 34, 4, 30), peg: { rt: [30, 26, 99, 22], lv: [62, 48, 50, 30] },
  ops: [ { r: 1, l: 98, ...E.swell(64, 34), kvs: 2 }, { r: 2, l: 58, ...E.swell(64, 34) }, { r: 1, l: 66, ...E.swell(64, 34), det: 2 },
         off, off, off ] });
add('CRYPT SLAM', { alg: 1, fb: 7, trnsp: -24, peg: { rt: [99, 70, 99, 99], lv: [60, 46, 50, 50] },
  ops: [ { r: 0.5, l: 99, rt: [99, 50, 40, 50], lv: [99, 0, 0, 0], kvs: 3 }, { r: 1.41, l: 82, ...E.pluck(70, 50), kvs: 3 },
         { r: 1, l: 94, rt: [99, 44, 40, 50], lv: [99, 0, 0, 0], kvs: 3 }, { r: 1.7, l: 90, ...E.pluck(52, 50) },
         { r: 2.3, l: 88, ...E.pluck(48, 50) }, { r: 3.1, l: 99, ...E.pluck(40, 50) } ] });

// =====================================================================
// SCI-FI: these replace sounds that rendered as near-duplicates of their
// neighbours (audio fingerprint distance < 0.9; see tools/pumpkin/README).
// Each keeps its slot so every other program number stays put.
// =====================================================================
const SCIFI = {
  FUNERALHOM: ['MOTHERSHIP', { alg: 5, fb: 6, trnsp: -12, lfo: lfo('tri', 4, 4, 3, 0, 14),
    ops: [ { r: 0.5, l: 94, ...E.swell(30, 26), ams: 1 }, { r: 1, l: 70, ...E.swell(30, 26) },
           { r: 0.75, l: 88, ...E.swell(32, 26), det: 5 }, { r: 1.5, l: 60, ...E.swell(32, 26) },
           { r: 1, l: 86, ...E.swell(34, 26), det: -5 }, { r: 2.01, l: 55, ...E.swell(34, 26) } ] }],
  CREEPCARNI: ['MAINFRAME', { alg: 32, fb: 2, lfo: lfo('square', 42, 60, 6),
    ops: [ { r: 2, l: 96, ...E.organ(70) }, { r: 4, l: 70, ...E.organ(70), det: 2 }, { r: 1, l: 62, ...E.organ(70) }, off, off, off ] }],
  MELTCHOIR: ['CRYOSLEEP', { alg: 5, fb: 0, lfo: lfo('sine', 18, 5, 3, 0, 10),
    ops: [ { r: 1, l: 94, ...E.swell(36, 30), ams: 1 }, { r: 3, l: 40, ...E.swell(40, 30) },
           { r: 3, l: 74, ...E.swell(40, 30), det: 3 }, { r: 7, l: 30, ...E.swell(44, 30) },
           { r: 1, l: 84, ...E.swell(36, 30), det: -4 }, { r: 1, l: 45, ...E.swell(40, 30) } ] }],
  DROWNPIANO: ['SONAR PING', { alg: 5, fb: 0, peg: { rt: [40, 99, 99, 99], lv: [50, 50, 50, 52] },
    ops: [ { r: 1, l: 99, ...E.ring(36, 22, 30, 90), kvs: 2 }, { r: 1, l: 22, ...E.pluck(60, 40) },
           { r: 2, l: 58, ...E.ring(44, 26, 30, 70), kvs: 2 }, { r: 1, l: 12, ...E.pluck(60, 40) },
           { r: 1, l: 82, ...E.ring(36, 22, 30, 90), det: 2, kvs: 2 }, off ] }],
  'VCR GHOST': ['TRACTORBEM', { alg: 2, fb: 5, lfo: lfo('square', 30, 0, 0, 0, 24), peg: { rt: [12, 99, 99, 30], lv: [62, 62, 62, 50] },
    ops: [ { r: 1, l: 96, ...E.swell(60, 40), ams: 1 }, { r: 1, l: 70, ...E.swell(60, 40) },
           { r: 2, l: 80, ...E.swell(60, 40), ams: 1 }, { r: 1, l: 60, ...E.swell(60, 40) },
           { r: 3, l: 50, ...E.swell(60, 40) }, { r: 1, l: 60, ...E.swell(60, 40) } ] }],
  BROKENDECK: ['WARP DRIVE', { alg: 1, fb: 7, lfo: lfo('tri', 20, 4, 3), peg: { rt: [18, 30, 99, 40], lv: [66, 66, 66, 38] },
    ops: [ { r: 1, l: 94, ...E.swell(60, 40) }, { r: 2, l: 64, ...E.swell(60, 40) },
           { r: 1, l: 84, ...E.swell(56, 40), det: 4 }, { r: 2.1, l: 72, ...E.swell(56, 40) },
           { r: 3.3, l: 70, ...E.swell(56, 40) }, { r: 5.3, l: 82, ...E.organ(40) } ] }],
  SEANCESTRG: ['ORBITALPAD', { alg: 5, fb: 3, lfo: lfo('tri', 9, 8, 3, 0, 8),
    ops: [ { r: 1, l: 94, ...E.bloom(40, 26, 88, 30), ams: 1 }, { r: 1.41, l: 46, ...E.bloom(46, 30, 60, 30) },
           { r: 2, l: 80, ...E.bloom(42, 26, 86, 30), det: 4 }, { r: 2.76, l: 40, ...E.bloom(48, 30, 60, 30) },
           { r: 0.5, l: 84, ...E.bloom(40, 26, 90, 30), det: -4 }, { r: 1, l: 50, ...E.bloom(44, 30, 60, 30) } ] }],
  AETHERWAVE: ['UFO WOBBLE', { alg: 32, fb: 3, lfo: lfo('sine', 62, 30, 5),
    ops: [ { r: 1, l: 98, ...E.swell(70, 44) }, { r: 1.5, l: 72, ...E.swell(70, 44) }, { r: 3, l: 52, ...E.swell(70, 44) }, off, off, off ] }],
  'SAUCER MAN': ['ALIENSIGNL', { alg: 1, fb: 3, lfo: lfo('square', 55, 34, 5, 0, 26),
    ops: [ { r: 1, l: 96, ...E.organ(60), ams: 1 }, { r: 3.7, l: 58, ...E.organ(60) },
           { r: 2, l: 76, ...E.organ(60), ams: 1 }, { r: 5.1, l: 52, ...E.organ(60) }, { r: 1, l: 40, ...E.organ(60) }, { r: 7.3, l: 40, ...E.organ(60) } ] }],
  'LOST SOUL': ['ANDROIDVOX', { alg: 32, fb: 7, lfo: lfo('sh', 30, 22, 4),
    ops: [ { r: 1, l: 90, ...E.organ(56) }, { r: 3, l: 76, ...E.organ(56) }, { r: 5, l: 70, ...E.organ(56) },
           { r: 7, l: 60, ...E.organ(56) }, { r: 2.01, l: 64, ...E.organ(56) }, { r: 1, l: 88, ...E.organ(56) } ] }],
  'SEASICK EP': ['STARFIELD', { alg: 5, fb: 2, lfo: lfo('sine', 46, 5, 3, 0, 10),
    ops: [ { r: 1, l: 98, ...E.ring(52, 30, 44, 60), kvs: 3, ams: 1 }, { r: 5, l: 62, ...E.pluck(62, 44), kvs: 4 },
           { r: 4, l: 80, ...E.ring(56, 32, 44, 50), det: 5, kvs: 3 }, { r: 9.1, l: 44, ...E.pluck(70, 44), kvs: 4 },
           { r: 8, l: 70, ...E.ring(60, 36, 44, 40), det: -5, kvs: 3, ams: 1 }, { r: 1, l: 30, ...E.pluck(60, 44) } ] }],
  'DARK SEQ': ['PLASMABASS', { alg: 16, fb: 7, trnsp: -12, peg: { rt: [80, 99, 99, 99], lv: [50, 50, 50, 57] },
    ops: [ { r: 1, l: 98, ...E.sus(99, 40, 80, 60), kvs: 2 }, { r: 0.5, l: 84, ...E.ring(80, 40, 60, 50), kvs: 3 },
           { r: 1, l: 76, ...E.ring(70, 40, 60, 50), kvs: 3 }, { r: 2, l: 66, ...E.ring(76, 44, 60, 40) },
           { r: 1.01, l: 70, ...E.ring(70, 40, 60, 40) }, { r: 1, l: 86, ...E.ring(70, 40, 60, 40) } ] }],
  VAMPSTRING: ['QUASARBELL', { alg: 5, fb: 0, lfo: lfo('sine', 30, 4, 3),
    ops: [ { r: 1, l: 96, ...E.ring(40, 20, 26, 70), kvs: 3 }, { r: 1.414, l: 70, ...E.ring(46, 24, 26, 50), kvs: 3 },
           { r: 2.756, l: 80, ...E.ring(44, 22, 26, 60), kvs: 3 }, { r: 1, l: 40, ...E.ring(50, 26, 26, 40) },
           { r: 5.4, l: 60, ...E.ring(52, 28, 26, 40), kvs: 3 }, { r: 3.3, l: 40, ...E.ring(56, 30, 26, 40) } ] }],
  'NOIR KEYS': ['CIRCUITRY', { alg: 1, fb: 4, lfo: lfo('sh', 70, 8, 4),
    ops: [ { r: 1, l: 98, ...E.pluck(56, 50), kvs: 3 }, { r: 1.73, l: 88, ...E.pluck(62, 50), kvs: 4 },
           { r: 3, l: 80, ...E.pluck(58, 50), kvs: 3 }, { r: 2.41, l: 72, ...E.pluck(64, 50) },
           { r: 1.5, l: 60, ...E.pluck(64, 50) }, { r: 4.7, l: 66, ...E.pluck(60, 50) } ] }],
  RESIDENTBR: ['LASER ZAP', { alg: 16, fb: 6, peg: { rt: [44, 99, 99, 99], lv: [24, 24, 24, 86] },
    ops: [ { r: 1, l: 98, ...E.pluck(50, 50), kvs: 2 }, { r: 1, l: 80, ...E.pluck(50, 50) },
           { r: 2, l: 66, ...E.pluck(54, 50) }, { r: 1, l: 60, ...E.pluck(54, 50) },
           { r: 3, l: 60, ...E.pluck(54, 50) }, { r: 1, l: 76, ...E.pluck(50, 50) } ] }],
};
for (const [old, [name, def]] of Object.entries(SCIFI)) {
  const at = V.findIndex(v => v.name === old);
  if (at < 0) throw new Error('no preset to replace: ' + old);
  V[at] = Object.assign({ name, scifi: true }, def);
}

export const FACTORY = V;
export const USER_SLOTS = 128 - V.length;
/** Blank USER voice: a single soft sine, easy to start sculpting from. */
export function userVoice(n) {
  return { name: 'USER ' + String(n).padStart(2, '0'), alg: 1, fb: 0, user: true,
    ops: [ { r: 1, l: 90, rt: [95, 40, 50, 50], lv: [99, 90, 86, 0], kvs: 2 }, { r: 1, l: 0 }, { r: 1, l: 0 }, { r: 1, l: 0 }, { r: 1, l: 0 }, { r: 1, l: 0 } ] };
}
