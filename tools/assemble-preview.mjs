// SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
// Assemble build/preview/index.html from sdk/Update.html.in (as Build-Web.ps1 -LocalPreview does).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = process.argv[2] || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = f => fs.readFileSync(path.join(root, f), 'utf8');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const version = /#define FM1_RELEASE_VERSION "([^"]+)"/.exec(rd('app/version.h'))[1];
const wasm = fs.readFileSync(path.join(root, 'build/web/simulator.wasm'));
const sim = {schema:1, release_version:version, sha256:sha(wasm), source_sha256:sha(wasm),
  sample_bank:'synthesized-demo', data:wasm.toString('base64')};
let web = rd('sdk/Update.html.in');
web = web.replace(/<a\b[^>]*href="\/\*FM1_SOURCE_URL\*\/"[^>]*>(.*?)<\/a>/g, '<span>$1 (local preview)</span>');
const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const notices = ['APP: GPLv3 with the FM1 SDK linking exception; no warranty. SDK and firmware resources have separate redistribution terms in THIRD_PARTY.md. Source: local preview'];
for (const f of ['THIRD_PARTY.md','LICENSE.md']) notices.push(`\n===== ${f} =====\n` + rd(f));
const rep = {
  '/*FM1_SOURCE_URL*/': '',
  '/*FM1_PAYLOAD*/': 'const FM1_PACKAGE = null;',
  '/*FM1_SIMULATOR*/': 'const FM1_SIMULATOR = ' + JSON.stringify(sim) + ';',
  '/*FM1_I18N*/': rd('sdk/I18n.js'),
  '/*FM1_SCRIPT*/': rd('sdk/WebUpdate.js'),
  '/*FM1_SIM_SCRIPT*/': rd('sdk/Simulator.js'),
  '/*FM1_SAMPLE_SCRIPT*/': rd('sdk/Samples.js'),
  '/*FM1_NOTICES*/': esc(notices.join('\n')),
};
for (const [k, v] of Object.entries(rep)) web = web.split(k).join(v);
if (/\/\*FM1_[A-Z_]+\*\//.test(web)) throw new Error('Unexpanded HTML placeholder');
fs.mkdirSync(path.join(root, 'build/preview'), {recursive:true});
fs.writeFileSync(path.join(root, 'build/preview/index.html'), web);
console.log('Preview: build/preview/index.html', (web.length/1024|0) + ' KiB');
