// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// PumpkinWave 666 skin for an assembled FM1 workbench/preview HTML file.
// The SDK template (sdk/Update.html.in) stays byte-identical so the official
// SDK payload check in sdk/Build.ps1 keeps passing; the skin is applied after.
//   node tools/theme-workbench.mjs build/preview/index.html
//   node tools/theme-workbench.mjs build/official-web/FM1-Official-Open-Source.html
import fs from 'node:fs';
const file = process.argv[2];
if (!file) { console.error('usage: theme-workbench.mjs <html>'); process.exit(2); }
let html = fs.readFileSync(file, 'utf8');
const must = (from, to) => { if (!html.includes(from)) throw new Error('theme anchor missing: ' + from.slice(0, 60)); html = html.split(from).join(to); };
const pumpkinSvg = '<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M16 9c-2-4 1-6 3-6" fill="none" stroke="#6bbf3a" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="16" cy="19" rx="13" ry="10" fill="#e8730c"/><path d="M11 10c-3 4-3 14 0 19M21 10c3 4 3 14 0 19" stroke="#a84a05" stroke-width="1.6" fill="none"/><path d="M8 16l5 2-5 2zM24 16l-5 2 5 2zM8 23c3 3 13 3 16 0l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" fill="#ffd84a"/></svg>';
must('<title>FM1 工作台</title>', '<title>PumpkinWave 666</title>');
html = html.replace(/<div class="brand"><svg[\s\S]*?<\/svg><b>FM1<span>M-VAVE<\/span><\/b><\/div>/,
  `<div class="brand">${pumpkinSvg}<b>PumpkinWave 666<span>HAUNTED FIRMWARE FOR THE M-VAVE FM-1</span></b></div>`);
must('<button data-sim data-sim-page="15" disabled>当前轨音色</button>',
  '<button data-sim data-sim-page="18" disabled>HAUNT LAB</button><button data-sim data-sim-page="15" disabled>当前轨音色</button>');
must("16:'预设列表：", "18:'HAUNT LAB: SELECT turns pages WARBLE / GHOST / CURSE / TUNING / VAULT. K1-K4 are macros on real DX7 parameters, PRESETS changes the voice, ALGORITHM the algorithm. On VAULT, SAVE stores, loads or exorcises. SEL again opens the classic SCALING page.',\n        16:'预设列表：");
const css = `<style id="pumpkinwave-skin">
:root{--accent:#ff8a1a;--muted:#b09bbd;--line:#3d2650;background:#0c0611;color:#f3e7d8}
body{background:radial-gradient(ellipse at 50% -10%,#3a1450 0%,#1a0a24 38%,transparent 70%),#0c0611}
.brand{color:#ff8a1a}.brand b{color:#ffe6c4;letter-spacing:-.02em}.brand b span{color:#b98fcf}.site-header h1{color:#d7b9e6}
.release-badge{color:#ffb566;border-color:#5a3270}
button{background:#22112d;border-color:#4b2c5e;color:#f4e6d6}button:hover{background:#341845;border-color:#ff8a1a}
button.primary{background:#ff8a1a;color:#2b0d00;border-color:#ff8a1a}button.primary:hover{background:#ffb04d}
nav button[aria-selected=true],.app-nav button[aria-selected=true]{color:#ffc27a;border-bottom-color:#ff8a1a}
.preset-home,.sim-details,.library-group,#tab-library,#tab-update,.manual-index,.manual-chapter,section{background:#160b1f;border-color:#3d2650}
.preset-home-head strong{color:#ffd9a6}.track-tile{background:#1e0f29;border-color:#43285a}.track-tile.selected{border-color:#ff8a1a;background:#3a1b22}
.track-level{background:linear-gradient(to right,#ff8a1a var(--level,0%),#3a2347 var(--level,0%))}.track-steps i{background:#3b2349}.track-steps i.on{background:#ff8a1a}.track-steps i.play{background:#9dff5c}
select,input[type=text],input[type=file],input[type=number]{background:#12091a;border-color:#4b2c5e;color:#f3e7d8}
.sim-device{background:linear-gradient(125deg,#2c1d33 0%,#1d1124 46%,#130a18 100%);border-color:#5d3a70;box-shadow:inset 0 1px 1px #c79be066,inset 0 -4px 0 #0c0510,0 4px 0 #050207,0 22px 40px #000a,0 0 60px #ff6a0018}
.device-brand{color:#ff9a2e}.case-mark,.screen-caption{color:#a084b2}
.encoder>span{color:#ffd2a0}.encoder .dial{background:radial-gradient(circle at 37% 25%,#ffb860 0%,#ea7410 40%,#9c3f04 76%,#4a1900 94%);border-color:#2a0c00}
.dial i{background:#2a0b00;box-shadow:none}
.panel-button{background:linear-gradient(#3d2349,#2b1736);color:#ffd9ab;border-color:#120716;border-top-color:#b07ac860}
.panel-button:hover{background:linear-gradient(#55305f,#3e2148)}.panel-button small{color:#c79a6b}
.panel-button.lit{background:linear-gradient(#b4500d,#7d3006);color:#fff3dc;border-top-color:#ffc27a}
.keyboard{background:linear-gradient(#130a18,#1a0f20);border-color:#0b0510}
.piano-key{background:linear-gradient(110deg,#3b2447,#2a1734 55%,#1f1027);color:#b48fc6;border-color:#0b0510}
.piano-key.black{background:linear-gradient(110deg,#2a1832,#1b0f22 55%,#150b1a)}
.piano-key>i{background:#6c4282}.piano-key.lit>i,.piano-key.held>i{background:#ffb347;box-shadow:0 0 .65cqw #ff8a1aaa}
.piano-key.held{background:linear-gradient(#8a3c10,#5c2408)}
.screen-bezel{background:#0a050d;border-color:#000}.sim-status{color:#ffd0a0}.lcd-target:hover,.lcd-target:focus-visible{background:#ff8a1a22;outline-color:#ff8a1a}
.lcd-value{color:#ffb04d}.sim-health:before{background:#9dff5c}
.piano-key.white{background:linear-gradient(110deg,#e9dcc6,#cdb99c 58%,#a8916f)!important;color:#5a3a1a!important;border-color:#2a1a10!important}
.piano-key.white>i{background:#8a5a2a}.piano-key.white.held,.piano-key.white:hover{background:linear-gradient(#ffb04d,#e0700f)!important}
button[aria-pressed=true]{color:#ffe2bd!important;border-color:#ff8a1a!important;background:#4a1f0c!important}
#sim-save-device{background:#3a1b22!important;border-color:#a2402a!important;color:#ffd2b0!important}
</style>
`;
if (!html.includes('pumpkinwave-skin')) {
  const at = html.indexOf('<header class="site-header">');
  if (at < 0) throw new Error('no site header');
  html = html.slice(0, at) + css + html.slice(at);
}
html = html.replace(/<div class="device-brand">FM.1 ?<span>WORKBENCH/, '<div class="device-brand">PUMPKINWAVE 666 <span>FM-1 HAUNTED FIRMWARE');
must("3:'SEL：DX7 算子键盘缩放；其他音源打开音高参数页。'", "3:'SEL: on a DX7 track opens the HAUNT LAB sound designer; press again for classic operator scaling. Other engines open their pitch page.'");
fs.writeFileSync(file, html);
console.log('PumpkinWave skin applied:', file);
