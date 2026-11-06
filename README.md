# PumpkinWave 666

Haunted firmware for the **M-VAVE FM-1**. It is a fork of M-VAVE's official
open-source firmware (**FM1 Open V14**) and keeps everything that firmware does:
the 8-track, 64-step sequencer, the six engines (DX7, 303, 808, PSG, pluck and
sampler), MIDI, Bluetooth and the workbench. It adds:

* **Jack-o'-lantern UI.** A boot splash with a flickering pumpkin, bats and candles
  that light up one by one. The palette is midnight purple, pumpkin orange,
  slime green and candlelight. The tracks are little pumpkins, and a header
  pumpkin glows with the output level.
* **103 haunted DX7 presets plus 25 empty USER slots** (128 programs). The
  sounds draw on 70s, 80s and 90s horror: warbly tape, dramatic organs and
  ghostly noises. Every voice is original programming and was
  level-matched by auditioning it in the engine.
* **HAUNT LAB**, a sound-design page with 5 pages of macros. Each macro edits
  the real DX7 voice parameters. It also has 9 alternative tunings and an
  on-device VAULT that stores your own voices in the 25 user slots.
* **16 haunted demo projects**, re-scored around the new voices.

> **Status: unofficial and use at your own risk.** The browser build of this exact
> source compiles with `-Wall -Wextra -Werror` and has been tested in
> the simulator: all screens, the HAUNT LAB controls, VAULT store/load/exorcise
> and rendered audio of every preset and demo (levels and spectra checked). The device `.fwsc` **has not been
> compiled or flashed yet**. That needs the Windows-only JieLi toolchain (see Build).
> The app source passes a device-configuration compile check against the SDK
> headers, and every engine symbol it calls is in `sdk/lib/libfm1_engine.a`.
> Keep M-VAVE's stock **FM-1 V15** firmware ready (m-vave.com/download).
> The workbench can always return to it.

## Try it without hardware

Open `PumpkinWave666-Preview.html` in desktop Chrome or Edge. This is the
whole firmware compiled to WebAssembly inside the FM1 workbench, with
a PumpkinWave skin. Play the bone-white keys or your computer keyboard, turn
the orange knobs, and press **HAUNT LAB** (or the panel's **SEL** button).

## Controls added by PumpkinWave

Everything from FM1 Open still works (see `README.FM1-OPEN.md` and the workbench help).

### HAUNT LAB: press SEL on a DX7 track
Press SEL again to reach the classic operator SCALING page. HOME exits.
Keys keep playing while you sculpt.

| Control | Action |
|---|---|
| SELECT | Page: WARBLE, GHOST, CURSE, TUNING, VAULT |
| K1-K4 | The four macros on the current page (the candles show their levels) |
| PRESETS | Change DX7 program, as on the other FM pages |
| ALGORITHM | Change DX7 algorithm |
| SAVE | On VAULT, runs the selected action; elsewhere it saves the project as usual |

| Page | K1 | K2 | K3 | K4 |
|---|---|---|---|---|
| 1 WARBLE | **WOW**: LFO pitch depth (raises PMS to 3 when needed) | **FLUTTER**: LFO speed | **DRIFT**: detune spread, alternating ± across operators | **WAVE**: TRI, SAW down, SAW up, SQR, SINE, S/H ("broken VCR") |
| 2 GHOST | **HAUNT**: slower attack on every operator | **LINGER**: longer release | **VEIL**: lowers the modulators, so the sound gets purer and more ghostly | **SWOOP**: pitch-EG scoop in and droop out (+ from below, - from above) |
| 3 CURSE | **POSSESS**: feedback 0-7 | **ROT**: drifts the modulator ratios inharmonic (clang, bells) | **CHAOS**: mutation strength 1-10 | **MUTATE**: each detent mutates the voice; CHAOS 6+ can change ratios, 9+ the algorithm |
| 4 TUNING | **TUNING**: main scale | **WARP**: 0-200 % of the scale's cents | **ALT TUNE**: second scale for ALT steps | **ALT HOLD**: live alt tuning on/off |
| 5 VAULT | **SLOT**: U01-U25 (programs 104-128) | **ACTION**: STORE, LOAD, EXORCISE | - | - |

The screen under the candles shows the live pitch warble (WARBLE), the volume
envelope and pitch swoop (GHOST), the six operators' levels and ratios (CURSE),
the cents deviation per key (TUNING) or the user slots (VAULT). The big
pumpkin's face turns from calm to evil to possessed as the voice gets more
cursed (feedback, warble, drift, modulation). Its glow follows the output level.

**VAULT.** STORE writes the track's current DX7 voice into a user slot of the
independent DX7 library. Overwriting a used slot asks for a second SAVE.
LOAD brings a slot back onto the track. EXORCISE restores the voice as it was
when you entered HAUNT LAB, so you can undo a whole run of macro or
MUTATE edits at once. Rename a voice with the stock EDIT+REC name page before storing.

**Tunings.** 12-TET, HAUNTED (fixed random detune), DROWNED (quarter-tone flats),
MOONSICK (stretched), WEREWOLF (quarter-comma meantone with its howling wolf
fifth), JUST MIN (5-limit), SEPTIMAL (7-limit), RAST 1/4 and GAMELAN. They use
the engine's per-track tuning API, so they are saved with projects.

## Presets

| Programs | Family |
|---|---|
| 1-15 | Dramatic organs: cathedral pipes, toccata plenum, calliope, combo, harmonium, gritty B3 |
| 16-33 | Warbly 70s/80s: VHS string machines, tape wow and flutter, seasick EPs, giallo and slasher keys |
| 34-52 | Ghostly: theremins, choirs, banshee wails, wind, whispers, glass harmonica, veils |
| 53-66 | Bells and boxes: tubular doom, dirge bells, cursed music boxes, chimes, bone xylophone |
| 67-80 | 80s horror synth: stalker basses, drones, brass, strings, stabs, sub basses |
| 81-91 | 90s dark: X-style whistle, dark ambient, industrial clang, PS1-era fog and choirs |
| 92-103 | Haunted FX: thunder, creaking door, heartbeat, bats, cauldron, raven, siren, ghost train |
| 104-128 | USER 01-25: blank sine voices for your own sounds (VAULT, or the workbench DX7 library) |

<details><summary>Full list</summary>

| # | Bank | Name |
|---|---|---|
| 1 | A01 | CRYPTORGAN |
| 2 | A02 | PHANTOMPIP |
| 3 | A03 | TOCCATA666 |
| 4 | A04 | BLOOD MASS |
| 5 | A05 | HAUNTMANOR |
| 6 | A06 | FUNERALHOM |
| 7 | A07 | GOTHICREED |
| 8 | A08 | CALLIOPE X |
| 9 | A09 | CREEPCARNI |
| 10 | A10 | DRACULADEN |
| 11 | A11 | SEANCEHARM |
| 12 | A12 | WEREWOLFB3 |
| 13 | A13 | DUNGEONDRN |
| 14 | A14 | VOXDEMORTE |
| 15 | A15 | MAUSOLEUM |
| 16 | A16 | VHSSTRINGS |
| 17 | A17 | WOBBLETAPE |
| 18 | A18 | SEASICK EP |
| 19 | A19 | MELTCHOIR |
| 20 | A20 | WARPED BOX |
| 21 | A21 | DROWNPIANO |
| 22 | A22 | VCR GHOST |
| 23 | A23 | WOW&FLUTTR |
| 24 | A24 | BROKENDECK |
| 25 | A25 | LULLABYROT |
| 26 | A26 | SLASHERPNO |
| 27 | A27 | MIDNIGHTPL |
| 28 | A28 | GIALLOLEAD |
| 29 | A29 | SINKINGLED |
| 30 | A30 | MOONWARBLE |
| 31 | A31 | SEANCESTRG |
| 32 | A32 | ETHER WOW |
| 33 | B01 | LOST VHS |
| 34 | B02 | THEREMIN |
| 35 | B03 | AETHERWAVE |
| 36 | B04 | SAUCER MAN |
| 37 | B05 | BANSHEE |
| 38 | B06 | GHOSTCHOIR |
| 39 | B07 | SPECTREVOX |
| 40 | B08 | CRYPT CHOR |
| 41 | B09 | MOURNERS |
| 42 | B10 | POLTERGST |
| 43 | B11 | SPECTRWIND |
| 44 | B12 | HOWLINWIND |
| 45 | B13 | WHISPERS |
| 46 | B14 | GLASSHARMO |
| 47 | B15 | ECTOPLASM |
| 48 | B16 | WILLOWISP |
| 49 | B17 | GRAVEMIST |
| 50 | B18 | BEYONDVEIL |
| 51 | B19 | LOST SOUL |
| 52 | B20 | SHADOW PAD |
| 53 | B21 | TUBULARDOM |
| 54 | B22 | DIRGE BELL |
| 55 | B23 | MUSIC BOX |
| 56 | B24 | CURSED BOX |
| 57 | B25 | CELESTDOOM |
| 58 | B26 | BONECHIMES |
| 59 | B27 | CRYSTSKULL |
| 60 | B28 | CLOCKTOWER |
| 61 | B29 | GLOCKGHOUL |
| 62 | B30 | ICECAVEBEL |
| 63 | B31 | WITCHHOUR |
| 64 | B32 | GAMELANGHO |
| 65 | C01 | BONE XYLO |
| 66 | C02 | DEATHKNELL |
| 67 | C03 | STALKRBASS |
| 68 | C04 | CARPNTRDRN |
| 69 | C05 | PROPHDOOM |
| 70 | C06 | NIGHTSTALK |
| 71 | C07 | FOG SYNTH |
| 72 | C08 | DARK SEQ |
| 73 | C09 | BLOODBRASS |
| 74 | C10 | OMINOUSWLL |
| 75 | C11 | VAMPSTRING |
| 76 | C12 | ZOMBIEBASS |
| 77 | C13 | SPLATRSTAB |
| 78 | C14 | NOSFERASUB |
| 79 | C15 | CREEP SAW |
| 80 | C16 | VIDEONASTY |
| 81 | C17 | SKEPTICWHS |
| 82 | C18 | DARKAMBNT |
| 83 | C19 | INDUSCLANG |
| 84 | C20 | NOIR KEYS |
| 85 | C21 | PSX FOG |
| 86 | C22 | PSX CHOIR |
| 87 | C23 | METALSCRAP |
| 88 | C24 | RESIDENTBR |
| 89 | C25 | CYBERGHOST |
| 90 | C26 | VOID DRONE |
| 91 | C27 | SANITARIUM |
| 92 | C28 | THUNDERCLP |
| 93 | C29 | CREAKYDOOR |
| 94 | C30 | HEARTBEAT |
| 95 | C31 | BAT SWARM |
| 96 | C32 | CAULDRON |
| 97 | D01 | RAVENCAW |
| 98 | D02 | SCREAMQUEN |
| 99 | D03 | CHAINRATTL |
| 100 | D04 | AIRRAIDSIR |
| 101 | D05 | GHOSTTRAIN |
| 102 | D06 | SPOOKY WOO |
| 103 | D07 | CRYPT SLAM |

</details>

The bank is also in `presets/` as four standard 32-voice DX7 SysEx files
(`PumpkinWave666-BankA..D.syx`) and a raw 128-voice VMEM image. You can load
them into the stock FM-1 firmware, FM1 Open or Dexed.

**Demo projects** (HOME, then FACTORY): CRYPT ORGAN, SLASHER NITE, VHS GHOSTS,
GIALLO RUN, HAUNTED RINK, MUSIC BOX, SEANCE, WEREWOLF B3, PSX FOG, BELL TOWER,
CHIP CRYPT, NIGHT STALKR, RUST CHAPEL, WITCH DRIFT, THRILL NIGHT, DEAD AIR.
They use minor, phrygian and tritone progressions and hijaz or harmonic-minor
melodies. All material is original.

## Build

### Firmware for the FM-1 (Windows)
These are the same requirements as FM1 Open V14 (details in `README.FM1-OPEN.md`):
Windows x64, PowerShell and **JieLi toolchain 2.5.3** (`FM1_PI32_TOOLCHAIN=C:\JL\pi32`).
The `sdk/` folder is byte-identical to M-VAVE's V14 kit, so the SDK payload checks pass.

```powershell
$env:FM1_PI32_TOOLCHAIN = 'C:\JL\pi32'
# Quick device image only:
./sdk/Build.ps1 -FirmwareOnly -Toolchain 'C:\JL\pi32'
# Workbench with the firmware embedded (what you flash from):
$env:FM1_SOURCE_URL = 'https://<where you publish this source zip>'
.\build.bat --web
.\build.bat --package
node tools/theme-workbench.mjs build/official-web/FM1-Official-Open-Source.html   # optional skin
```
Open `build/official-web/FM1-Official-Open-Source.html` in Chrome or Edge, connect
the FM-1 by USB and use **Device update**. Back up projects, voices and samples
first, and keep the unit powered while it writes. If anything goes wrong, use
the same page to return to stock V15.

### Browser preview (Linux/macOS)
```sh
FM1_WASI_SDK=/path/to/wasi-sdk-27.0-x86_64-linux ./tools/build-web.sh   # -> build/preview/index.html
```

### Regenerating content
* Presets: edit `tools/pumpkin/voices.mjs`, then
  `node tools/Generate-PumpkinWave-DX7.mjs --normalize build/web/simulator.wasm`.
  This writes `app/fm_factory.inc` and `presets/`. Each voice is auditioned in
  the engine and its carrier levels are trimmed toward a common loudness.
* Pixel art: edit `tools/pumpkin/art.py`, then `python3 tools/pumpkin/art.py`
  (writes `app/pumpkin_art.inc`; `--png dir` exports previews).
* `tools/lcd-shot.mjs` takes LCD screenshots headlessly and `tools/sim-node.mjs` renders audio.

## What changed versus FM1 Open V14
* `app/pumpkin_ui.inc` (new): sprites, boot splash, badges and the HAUNT LAB.
* `app/pumpkin_art.inc` (new, generated): 4-bit pixel art.
* `app/screen.c`: palette, page hook, SEL routing, SAVE on VAULT, header pumpkin,
  overview badges and a longer boot.
* `app/fm_factory.inc`: the PumpkinWave 128-voice bank in place of the V15 factory bank.
* `app/presets.c`: 16 haunted demo projects that use bank programs; old recipe voices removed.
* `tools/`: generators, Linux web build, headless simulator tools and the workbench skin.
* `sdk/` is unchanged.

`PumpkinWave666-vs-FM1Open-V14.patch` holds the complete source diff.

## License
APP code: GPLv3 with the FM1 SDK linking exception (same as FM1 Open; see
`LICENSE.md`). The SDK binaries keep M-VAVE's terms (`THIRD_PARTY.md`). The
PumpkinWave voices, pixel art and demo arrangements are original and released
under the same GPLv3 terms. Unofficial and not affiliated with M-VAVE.
