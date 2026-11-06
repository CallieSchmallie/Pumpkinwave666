/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception */
#include "instrument.h"
#include "fm_patch.h"
#include "drum808.h"
#include "sampledrum.h"
#include <string.h>

/* PumpkinWave 666 arrangements (modified from FM1 Open V14). Small musical recipes expand into the normal
 * editable project format, avoiding sixteen 4 KiB images in program Flash.
 * No random generation, engine allocation or live-state changes happen here.
 * Notes are MIDI pitches; masks read from bit 0 (the first sixteenth note).
 * Unused tracks stay empty, muted, and use the small PSG engine. */
enum { KEYS, BASS, ARP, LEAD, PAD, BEAT, PERC, STAB };
/* PumpkinWave 666 factory DX7 programs used by the demo arrangements. */
enum { CRYPTORGAN = 0, TOCCATA = 2, CALLIOPE = 7, CARNIVAL = 8, SEANCE_HARM = 10, WEREWOLF = 11,
       DUNGEON = 12, VHS_STRINGS = 15, SEASICK = 17, SLASHER = 25, GIALLO = 27, MOON = 29,
       THEREMIN = 33, BANSHEE = 36, GHOST_CHOIR = 37, GLASS = 45, WISP = 47, VEIL = 49,
       TUBULAR = 52, MUSIC_BOX = 54, CURSED_BOX = 55, BONE_CHIMES = 57, CLOCK = 59, XYLO = 64,
       KNELL = 65, STALKER_BASS = 66, DRONE = 67, PROPHET = 68, NIGHT_BASS = 69, DARK_SEQ = 71,
       BLOOD_BRASS = 72, VAMP_STRINGS = 74, ZOMBIE = 75, SPLATTER = 76, NOSFERATU = 77, CREEP = 78,
       WHISTLE = 80, CLANG = 82, PSX_FOG = 84, PSX_CHOIR = 85, SCRAPE = 86, VOID = 89 };
struct part {
    uint8_t source : 3, role : 3;
    uint8_t tone, level, sends;
};
struct scene {
    char name[13];
    uint8_t bpm, root, minor, swing, rhythm, motif, count;
    uint8_t decay, delay_steps, feedback, fx_level;
    struct part part[5];
};
#define FM(tone, role, level, rev, dly) {GROOVE_DX7, role, tone, level, rev + 16*dly}
#define AC(tone, role, level, rev, dly) {GROOVE_303, role, tone, level, rev + 16*dly}
#define PS(tone, role, level, rev, dly) {GROOVE_PSG, role, tone, level, rev + 16*dly}
#define PL(tone, role, level, rev, dly) {GROOVE_PLUCK, role, tone, level, rev + 16*dly}
#define DR(level) {GROOVE_808, BEAT, 0, level, 0}
#define SA(role, level) {GROOVE_SAMPLE, role, 0, level, 1}
/* Sixteen haunted sketches across 70s organ horror, 80s slasher synths and
 * 90s survival-horror fog. Original material; delay_steps counts sixteenths. */
static const struct scene scenes[GROOVE_FACTORY_PROJECTS] = {
    {"CRYPT ORGAN",   76,38,1, 0,5,1,4, 96,3,40,84, {FM(CRYPTORGAN,KEYS,98,6,1), FM(NOSFERATU,BASS,92,0,0), FM(KNELL,LEAD,74,7,4), SA(PERC,64)}},
    {"SLASHER NITE", 120,40,1, 0,4,0,4, 70,3,46,78, {FM(SLASHER,ARP,92,4,3), FM(DRONE,PAD,80,5,0), FM(STALKER_BASS,BASS,94,0,0), DR(78)}},
    {"VHS GHOSTS",    84,41,1,10,2,2,4, 88,2,44,82, {FM(VHS_STRINGS,PAD,88,6,0), FM(SEASICK,KEYS,96,5,1), FM(THEREMIN,LEAD,86,6,4), FM(DARK_SEQ,BASS,86,0,0)}},
    {"GIALLO RUN",   132,36,1, 0,1,1,4, 52,2,40,72, {AC(1,BASS,42,0,1), FM(GIALLO,LEAD,86,3,3), FM(PROPHET,STAB,76,4,2), DR(84)}},
    {"HAUNTED RINK", 104,43,0, 8,3,4,5, 62,2,30,74, {FM(CALLIOPE,LEAD,86,4,2), FM(CARNIVAL,KEYS,84,4,0), FM(XYLO,ARP,80,3,1), FM(ZOMBIE,BASS,90,0,0), DR(74)}},
    {"MUSIC BOX",     66,45,1, 0,0,3,3, 98,2,54,92, {FM(CURSED_BOX,LEAD,96,7,5), FM(MUSIC_BOX,ARP,84,6,4), FM(VEIL,PAD,82,7,0)}},
    {"SEANCE",        70,38,1, 0,5,2,3, 99,1,48,94, {FM(SEANCE_HARM,PAD,92,7,0), FM(GHOST_CHOIR,KEYS,86,7,2), FM(GLASS,LEAD,84,7,5)}},
    {"WEREWOLF B3",  112,40,1,12,6,5,4, 46,1,26,70, {FM(WEREWOLF,STAB,96,3,0), AC(0,BASS,38,0,0), DR(82), FM(BLOOD_BRASS,LEAD,76,3,1)}},
    {"PSX FOG",       90,41,1, 6,2,3,4, 92,2,50,88, {FM(PSX_FOG,PAD,88,7,0), FM(PSX_CHOIR,KEYS,84,6,1), FM(WHISTLE,LEAD,84,7,4), SA(BEAT,72)}},
    {"BELL TOWER",    72,36,1, 0,5,3,4, 99,2,46,86, {FM(TUBULAR,LEAD,80,7,4), FM(CLOCK,ARP,66,6,3), FM(DUNGEON,PAD,74,6,0), FM(NOSFERATU,BASS,80,0,0)}},
    {"CHIP CRYPT",   142,36,1, 0,3,4,4, 42,2,24,66, {PS(0,LEAD,64,2,2), PS(1,BASS,80,0,0), DR(76), FM(BONE_CHIMES,ARP,70,3,1)}},
    {"NIGHT STALKR", 118,36,1, 0,1,0,4, 72,2,38,76, {FM(NIGHT_BASS,BASS,96,0,0), FM(VAMP_STRINGS,PAD,76,5,0), AC(2,ARP,28,2,3), DR(84)}},
    {"RUST CHAPEL",  128,38,1, 6,6,4,4, 48,2,44,72, {AC(2,BASS,38,0,1), FM(CLANG,STAB,78,3,3), SA(BEAT,84), FM(SCRAPE,LEAD,62,4,4)}},
    {"WITCH DRIFT",   80,43,0, 5,4,5,4, 80,2,36,84, {PL(1,ARP,90,6,2), FM(MOON,PAD,80,6,0), FM(BANSHEE,LEAD,80,6,3), FM(ZOMBIE,BASS,84,0,0)}},
    {"THRILL NIGHT", 116,40,1,12,6,5,4, 44,1,24,68, {FM(SPLATTER,STAB,96,2,0), AC(0,BASS,37,0,0), SA(BEAT,84), FM(CREEP,LEAD,74,3,1)}},
    {"DEAD AIR",      60,36,1, 0,0,3,2, 99,3,60,96, {FM(VOID,PAD,94,7,0), FM(WISP,LEAD,86,7,6)}}
};
#undef FM
#undef AC
#undef PS
#undef PL
#undef DR
#undef SA

/* Kick, backbeat, closed hat, open hat and a small percussion response. */
static const uint16_t beats[8][5] = {
    {0x0101,0x1010,0x5555,0x4000,0x0080},
    {0x1111,0x1010,0x4444,0x0400,0x8000},
    {0x0401,0x1010,0x4545,0x0000,0x8000},
    {0x0141,0x1010,0x5555,0x4000,0x0080},
    {0x0101,0x1010,0x0505,0x0000,0x4400},
    {0x0100,0x0100,0x5555,0x0000,0x4080},
    {0x0841,0x1010,0x5555,0x4000,0x0080},
    {0x0409,0x1010,0x4545,0x0400,0x2080}
};
static const uint16_t bass_masks[6] = {0x1525,0x6d6b,0x0501,0x1101,0x5555,0x4929};
static const int8_t melodies[6][16] = {
    {0,-1,2,-1,4,-1,2,1, 0,-1,4,-1,5,4,2,-1},
    {0,0,-1,4,0,-1,2,0, 5,-1,4,2,-1,0,2,-1},
    {-1,-1,2,-1,4,-1,-1,2, -1,1,-1,-1,0,-1,-1,-1},
    {4,-1,-1,-1,2,-1,1,-1, 0,-1,-1,2,5,-1,-1,-1},
    {0,2,4,5,4,-1,2,-1, 1,2,4,-1,5,4,2,-1},
    {-1,0,-1,2,-1,4,2,-1, 5,-1,4,2,-1,1,0,-1}
};
static unsigned bar_root(const struct scene *s, unsigned bar)
{
    static const uint8_t progression[4][4] = {{0,1,8,7},{0,8,5,7},{0,6,1,7},{0,3,8,11}};
    return s->root + progression[s->minor + 2*(s->motif & 1U)][bar];
}
static unsigned bar_minor(const struct scene *s, unsigned bar)
{
    static const uint8_t quality[4][4] = {{1,0,0,0},{1,0,1,0},{1,1,0,0},{1,0,0,0}};
    return quality[s->minor + 2*(s->motif & 1U)][bar];
}
static void preset(struct groove_preset *p, const struct part *v)
{
    p->type = v->source; p->volume = v->level; p->modified = 1;
    p->controls.envelope[2] = 100;
    if (v->source == GROOVE_DX7) {
        groove_fm_factory(p->data, v->tone); p->program = v->tone; p->modified = 0;
    }
    else if (v->source == GROOVE_303) {
        static const uint8_t bass[4][BASS303_NPARAMS] = {
            {45,24,32,52,62,0,64,96,0,1,14,5},
            {60,66,73,56,74,0,64,94,6,1,26,10},
            {65,44,58,39,65,0,64,92,0,1,14,8},
            {34,18,20,62,42,1,64,100,0,1,20,5}
        };
        memcpy(p->data, bass[v->tone], BASS303_NPARAMS);
        p->program = p->data[BASS303_WAVE]; p->controls.mono = 1;
    } else if (v->source == GROOVE_808) {
        /* Public D8_PRESET_BYTES format: selectors, then two parameter sets.
         * Sound selectors must match each set for a lossless store/load. */
        unsigned at = D8_NUM;
        for (unsigned variant = 0; variant < 2; ++variant)
            for (unsigned part = 0; part <= D8_NUM; ++part)
                for (int i = 0; i < drum808_nparams((int)part); ++i) {
                    const fm1_param_t *d = drum808_param((int)part, i);
                    static const uint8_t levels[D8_NUM] = {70,52,46,42,38,36,46,28,25,30,29};
                    static const uint8_t pans[D8_NUM] = {64,64,49,64,79,54,72,80,47,77,72};
                    unsigned value = d->def;
                    if (!strcmp(d->name, "Sound")) value = variant;
                    if (part < D8_NUM) {
                        if (!strcmp(d->name, "Level")) value = levels[part];
                        else if (!strcmp(d->name, "Pan")) value = pans[part];
                        else if (!strcmp(d->name, "Rev")) value = part == D8_SD || part == D8_CP ? 24 : 9;
                        else if (!strcmp(d->name, "Dly")) value = part == D8_RS ? 12 : 0;
                        else if (!strcmp(d->name, "Decay") && part == D8_SD) value = 84;
                    }
                    p->data[at++] = (uint8_t)value;
                }
    } else if (v->source == GROOVE_SAMPLE) {
        p->sampler_pads = SAMPLE_DRUM_PADS;
        for (unsigned pad = 0; pad < SAMPLE_DRUM_PADS; ++pad) {
            uint8_t *pot = p->data + pad * SAMPLE_DRUM_PARAMS;
            for (unsigned i = 0; i < SAMPLE_DRUM_PARAMS; ++i) pot[i] = sampledrum_param(i)->def;
            static const uint8_t levels[SAMPLE_DRUM_PADS] = {105,83,75,83,72,73,58,62};
            pot[SAMPLE_DRUM_LEVEL] = levels[pad];
            pot[SAMPLE_DRUM_VELOCITY_LPF] = pad == 0 ? 12 : 30;
            if (pad == 6 || pad == 7) pot[SAMPLE_DRUM_CHOKE] = 1;
        }
    } else if (v->source == GROOVE_PLUCK) {
        static const uint8_t pluck[3][4] = {{88,70,24,48},{103,52,24,66},{79,89,24,42}};
        memcpy(p->data, pluck[v->tone], 4);
    } else {
        p->program = p->data[0] = v->tone; p->data[1] = 16;
        p->data[2] = 24; p->data[3] = v->role == BASS ? 20 : 38;
    }
    p->data[209] = v->sends;
}
const char *groove_factory_name(unsigned index)
{
    return index < GROOVE_FACTORY_PROJECTS ? scenes[index].name : NULL;
}
int groove_factory_build(unsigned index, struct groove_project *p)
{
    if (!p || index >= GROOVE_FACTORY_PROJECTS) return GROOVE_PROJECT_INVALID;
    const struct scene *s = &scenes[index];
    memset(p, 0, sizeof *p);
    memset(p->name, ' ', sizeof p->name); memcpy(p->name, s->name, strlen(s->name));
    p->tempo = s->bpm; p->mute = (uint8_t)(255U << s->count);
    unsigned delay = FM1_SAMPLE_RATE * 60U * s->delay_steps / (s->bpm * 32U);
    p->effects[0] = s->decay;
    p->effects[1] = (uint8_t)((delay - 166U + 7U) / 14U);
    p->effects[2] = s->feedback; p->effects[3] = s->fx_level;
    groove_sequence_defaults(&p->sequence); p->sequence.swing = s->swing;
    static const uint8_t open_chords[2][8] = {{4,4,11,14},{4,3,10,14}};
    memcpy(p->sequence.chord[12], open_chords, sizeof open_chords);
    groove_project_arp_defaults(p);
    for (unsigned t = 0; t < GROOVE_TRACKS; ++t) {
        const struct part empty = {GROOVE_PSG,LEAD,0,100,0};
        const struct part *v = t < s->count ? &s->part[t] : &empty;
        preset(&p->preset[t], v);
        if (t >= s->count) continue;
        for (unsigned bar = 0; bar < 4; ++bar) {
            unsigned root = bar_root(s, bar), minor = bar_minor(s, bar);
            for (unsigned i = 0; i < 16; ++i) {
                struct groove_step *n = &p->step[t][bar * 16 + i];
                unsigned bit = 1U << i, chord = 0, gate = 7, tie = 0, pitch = root + 24;
                if (v->role == BEAT || v->role == PERC) {
                    const uint16_t *b = beats[s->rhythm];
                    unsigned sample = v->source == GROOVE_SAMPLE;
                    if (v->role == BEAT && (b[0] & bit)) n->drums |= 1U;
                    if (b[1] & bit) n->drums |= (uint16_t)(1U << (v->role == PERC && sample ? 2 : 1));
                    if (b[2] & bit) n->drums |= (uint16_t)(1U << (sample ? 6 : 10));
                    if (b[3] & bit) {
                        n->drums &= (uint16_t)~(1U << (sample ? 6 : 10));
                        n->drums |= (uint16_t)(1U << (sample ? 7 : 9));
                    }
                    if ((b[4] & bit) && (bar & 1U)) n->drums |= (uint16_t)(1U << (sample ? 2 : 5));
                    if (bar == 3 && i == 15) n->drums |= (uint16_t)(1U << (sample ? 4 : 3));
                    if (n->drums) n->velocity = (uint8_t)((n->drums & 3U) ? 100 : i % 4 == 0 ? 74 : 59 + (bar & 1U)*4);
                    continue;
                }
                if (v->role == BASS) {
                    if (!(bass_masks[s->motif] & bit)) continue;
                    pitch = root + (i == 14 ? 12U : i == 7 || i == 11 ? 7U : 0U);
                    gate = 12;
                } else if (v->role == KEYS || v->role == PAD || v->role == STAB) {
                    unsigned mask = v->role == STAB ? 0x0444 : v->role == KEYS ? 0x0909 : 0x0001;
                    if (!(mask & bit)) continue;
                    pitch = root + 12; chord = minor ? 2 : 1;
                    if (v->role == KEYS && v->source == GROOVE_DX7) chord = 13U + minor;
                    if (v->role == PAD) { gate = 15; tie = 1; }
                    else if (v->role == KEYS) { gate = 12; tie = i == 0 || i == 8; }
                    else gate = 9;
                } else if (v->role == ARP) {
                    if (i & 1U) continue;
                    const unsigned offsets[4] = {0,minor ? 3U : 4U,7,12};
                    pitch = root + 24 + offsets[(i / 2 + bar) % 4];
                    gate = 9;
                } else {
                    int degree = melodies[s->motif][i];
                    if (degree < 0) continue;
                    static const uint8_t scale[2][7] = {{0,1,4,5,7,8,12},{0,3,5,6,7,11,12}}; /* hijaz, blues-harmonic minor */
                    pitch = root + 24 + scale[minor][degree]; gate = 11;
                }
                n->note = (uint8_t)pitch;
                n->velocity = (uint8_t)(i % 4 == 0 ? 100 : i % 2 == 0 ? 88 : 76);
                n->drums = (uint16_t)(chord | (gate << 5) | (tie << 12));
            }
        }
    }
    return groove_project_valid(p) ? 0 : GROOVE_PROJECT_INVALID;
}
