/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
 * PumpkinWave 666: jack-o'-lantern graphics and the HAUNT LAB sound designer.
 * Included by screen.c after its drawing primitives. Control task only.
 * The FM-1 app image has only a few KiB to spare, so this file is written for
 * size: mirrored half-sprites, table-driven macros and no per-page diagrams.
 *
 * HAUNT LAB (SEL on a DX7 track; SEL again opens the classic SCALING page):
 *   SELECT  page  WARBLE / GHOST / CURSE / VAULT
 *   K1-K4   macros on the current page (each edits real DX7 voice parameters)
 *   PRESETS DX7 program, ALGORITHM DX7 algorithm (as on the other FM pages)
 *   SAVE    on VAULT: run the selected action (STORE asks twice for a used slot)
 */
#include "pumpkin_art.inc"

enum { HAUNT_PAGES = 4, HAUNT_TUNINGS = 6, HAUNT_FIRST_USER = 103, HAUNT_USER_SLOTS = 25 };
enum { HP_WARBLE, HP_GHOST, HP_CURSE, HP_VAULT };
/* Carrier masks (bit n = OP n+1) for DX7 algorithms 1..32. */
static const uint8_t haunt_carriers[32] = {
    0x05, 0x05, 0x09, 0x09, 0x15, 0x15, 0x05, 0x05, 0x05, 0x09, 0x09, 0x05, 0x05, 0x05, 0x05, 0x01,
    0x01, 0x01, 0x19, 0x0b, 0x1b, 0x1d, 0x1b, 0x1f, 0x1f, 0x0b, 0x0b, 0x25, 0x17, 0x27, 0x1f, 0x3f};
/* Cents from 12-TET by pitch class, C first. WEREWOLF is quarter-comma
 * meantone with its howling G#-Eb wolf fifth; SEPTIMAL uses 7-limit ratios. */
static const int8_t haunt_tunings[HAUNT_TUNINGS][12] = {
    {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
    {0, 23, -17, 11, -26, 7, 19, -9, 27, -21, 13, -14},
    {0, -50, 0, -50, 0, 0, -50, 0, -50, 0, -50, 0},
    {0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44},
    {0, -24, -7, 10, -14, 3, -21, -3, -27, -10, 7, -17},
    {0, 19, 4, -33, -14, -2, -18, 2, -35, -16, -31, -12}};
/* Every name list is fixed-width so one table serves labels and values. */
static const char haunt_words[][9] = {
    "WOW", "FLUTTER", "DRIFT", "WAVE", "HAUNT", "LINGER", "VEIL", "SWOOP",
    "POSSESS", "ROT", "TUNING", "MUTATE", "SLOT", "ACTION", "", "",
    "TRI", "SAWDN", "SAWUP", "SQR", "SINE", "S/H",
    "12-TET", "HAUNTED", "DROWNED", "MOONSICK", "WEREWOLF", "SEPTIMAL",
    "STORE", "LOAD", "EXORCISE", "WARBLE", "GHOST", "CURSE", "VAULT"};
enum { W_WAVES = 16, W_TUNINGS = 22, W_ACTIONS = 28, W_PAGES = 31 };
static unsigned haunt_page, haunt_slot, haunt_action, haunt_confirm, haunt_mutations;
static uint8_t haunt_tune[GROOVE_TRACKS];
static uint8_t haunt_snapshot[156];
static unsigned haunt_snapshot_track = 255;
static uint32_t haunt_seed = 0x666u;

/* ---------- palette and sprites ---------- */
/* Witch-light: the carved face and every candle burn green. */
static uint16_t art_palette[16] = {
    0x0000, 0x3060, 0xd2e0, 0xf483, 0x91a0, 0x3bc4, 0x3e25, 0xdff7,
    0x0820, 0xdffa, 0xd842, 0xab1f, 0x1844, 0x2fe7, 0x5d45, 0x0000};
static unsigned candle_flicker(uint32_t now, unsigned salt)
{
    uint32_t n = (now / 90U) * 2654435761U ^ (salt * 40503U);
    n ^= n >> 15; n *= 2246822519U;
    return 3U + ((n >> 13) & 3U) + ((n >> 21) % 7U == 0);
}
static uint16_t green(unsigned level, unsigned core)
{
    /* Interpolated ramp: dim swamp green up to white-hot witch-light. */
    if (level > 7) level = 7;
    unsigned r = core ? 7 + level * 3 : 1 + level, g = core ? 37 + level * 3 : 9 + level * 6, b = core ? 5 + level * 3 : 1 + level;
    return (uint16_t)((r << 11) | (g << 5) | b);
}
/* Indexed 4-bit sprite stored as its left half and mirrored. Index 0 is clear. */
static __attribute__((noinline)) void sprite(unsigned x, unsigned y, const uint8_t *art, unsigned half,
                                             unsigned h, unsigned scale, const uint16_t *pal)
{
    unsigned W = half * 2 * scale, H = h * scale;
    if (!paint_rendering) { paint_mark(x, y, W, H); return; }
    if (y >= paint_top + PAINT_ROWS || y + H <= paint_top || x >= paint_end || x + W <= paint_x) return;
    unsigned first = y < paint_top ? paint_top : y, end = y + H < paint_top + PAINT_ROWS ? y + H : paint_top + PAINT_ROWS;
    unsigned left = x < paint_x ? paint_x : x, right = x + W < paint_end ? x + W : paint_end;
    for (unsigned row = first; row < end; ++row) {
        uint16_t *pixel = paint_pixels + (row - paint_top) * (paint_end - paint_x) + left - paint_x;
        for (unsigned col = left; col < right; ++col, ++pixel) {
            unsigned sx = (col - x) / scale;
            if (sx >= half) sx = 2 * half - 1 - sx;
            unsigned at = (row - y) / scale * half + sx;
            unsigned index = (art[at >> 1] >> ((at & 1U) ? 0 : 4)) & 15U;
            if (index) *pixel = pal[index];
        }
    }
}
/* Track badge: a little pumpkin in the track colour with its number. */
static void pumpkin_badge(unsigned x, unsigned y, unsigned t, unsigned selected, unsigned active)
{
    uint16_t pal[16], body = selected ? colors[t] : PANEL;
    memcpy(pal, art_palette, sizeof pal);
    pal[2] = body; pal[3] = selected ? (uint16_t)(body | 0x2104) : 0x4129;
    pal[4] = (uint16_t)((body >> 1) & 0x7bef);
    paint_fill(x, y, 18, 16, BACK);
    sprite(x, y + 1, art_badge, ART_BADGE_W, ART_BADGE_H, 1, pal);
    number(x + 7, y + 6, (int)t + 1, 1, 1, selected ? BACK : colors[t], body);
    if (active) paint_fill(x + 2, y + 12, 3, 3, GREEN);
}
static void big_pumpkin(unsigned x, unsigned y, unsigned possessed, unsigned glow)
{
    art_palette[6] = green(glow, 0); art_palette[7] = green(glow, 1);
    paint_fill(x, y, 96, 75, BACK);
    sprite(x, y, art_pumpkin, ART_PUMPKIN_W, ART_PUMPKIN_H, 3, art_palette);
    sprite(x, y, possessed ? art_face_possessed : art_face_evil, ART_PUMPKIN_W, ART_PUMPKIN_H, 3, art_palette);
}
static void candle(unsigned x, unsigned bottom, unsigned height, uint16_t wax, unsigned flame)
{
    paint_fill(x, bottom - height, 9, height, wax);
    paint_fill(x + 3, bottom - height - 7, 3, 7, green(flame, 0));
    paint_fill(x + 4, bottom - height - 5, 1, 3, green(flame, 1));
}

/* ---------- boot splash ---------- */
static __attribute__((noinline, cold, minsize)) void pumpkin_boot_draw(void)
{
    unsigned glow = boot_phase < 3 ? boot_phase * 2U : candle_flicker(frame_time, 3) + 1U;
    uint32_t sig = glow | (boot_phase << 4);
    if (cache->title_cache == sig) return;
    if (cache->title_cache == ~0U) {
        paint_fill(0, 0, 240, 240, BACK);
        text(54, 124, "PUMPKINWAVE", 2, ACCENT, BACK);
        text(51, 180, "HAUNTED FM FOR THE FM-1", 1, DIM, BACK);
        text(36, 222, "V1.0 - BUILT ON FM1 OPEN " FM1_RELEASE_VERSION, 1, PANEL | 0x4208, BACK);
    }
    cache->title_cache = sig;
    big_pumpkin(72, 40, boot_phase >= 6, glow);
    text(84, 144, "666", 4, boot_phase >= 4 ? 0xd8c5 : PANEL, BACK);
    for (unsigned i = 0; i < 8; ++i) {
        paint_fill(64 + i * 15, 194, 9, 16, BACK);
        candle(64 + i * 15, 210, 8, colors[i], i < boot_phase ? candle_flicker(frame_time, i) : 0);
    }
}

/* ---------- DX7 helpers ---------- */
static unsigned op_base(unsigned n) { return (5U - n) * 21U; } /* n = 0 for OP1 */
/* Move one parameter to an absolute value through the normal edit path;
 * groove_fm_edit clamps to the parameter's own range. */
static void fm_set(uint8_t *p, unsigned parameter, int value)
{
    if (value < 0) value = 0;
    if (value != p[parameter]) {
        groove_fm_edit(track, parameter, value - (int)p[parameter]);
        uint8_t q[156];
        if (!groove_fm_copy(track, q, NULL)) p[parameter] = q[parameter];
    }
}
/* Mean of one operator field over carriers (want=1) or modulators (want=0). */
static int op_mean(const uint8_t *p, unsigned field, unsigned want)
{
    unsigned car = haunt_carriers[p[134] & 31U], sum = 0, count = 0;
    for (unsigned n = 0; n < 6; ++n)
        if (((car >> n) & 1U) == want) { sum += p[op_base(n) + field]; ++count; }
    return count ? (int)(sum / count) : 0;
}
static int haunt_spread(const uint8_t *p)
{
    int spread = 0;
    for (unsigned n = 0; n < 6; ++n) {
        int d = (int)p[op_base(n) + 20] - 7; if (d < 0) d = -d;
        if (d > spread) spread = d;
    }
    return spread;
}
static void haunt_open(void)
{
    if (!groove_fm_copy(track, haunt_snapshot, NULL)) haunt_snapshot_track = track;
    haunt_confirm = haunt_mutations = 0;
    haunt_seed ^= fm1_millis() * 2654435761U + 1U;
}
static int haunt_store(unsigned slot)
{
    unsigned program = HAUNT_FIRST_USER + slot;
    uint8_t patch[156], *raw;
    int r = groove_fm_copy(track, patch, NULL);
    if (r) return r;
    if (!(raw = malloc(4096))) return GROOVE_PROJECT_MEMORY;
    r = groove_fm_library_read(program / 32U, raw);
    if (!r) {
        groove_fm_pack(raw + (program % 32U) * 128U, patch);
        r = groove_fm_library_write(program / 32U, raw);
    }
    free(raw);
    return r;
}

/* ---------- controls ---------- */
static void haunt_controls(const struct fm1_controls *controls, uint32_t pressed, uint32_t now)
{
    if (groove_source_type(track) != GROOVE_DX7) { page = OVERVIEW; return; }
    int turn = controls->encoders[0];
    if (turn) {
        haunt_page = (unsigned)clamp((int)haunt_page + (turn > 0 ? 1 : -1), 0, HAUNT_PAGES - 1);
        haunt_confirm = 0; cache->shown_page = ~0U;
    }
    uint8_t p[156];
    if (groove_fm_copy(track, p, NULL)) return;
    unsigned car = haunt_carriers[p[134] & 31U];
    for (unsigned c = 0; c < 4; ++c) {
        int k = controls->encoders[2 + c], step = k > 0 ? 1 : -1;
        if (!k) continue;
        int d = fm_encoder_delta(2 + c, (int16_t)k);
        switch (haunt_page * 4 + c) {
        case 0: fm_set(p, 139, p[139] + d); if (p[143] < 3) fm_set(p, 143, 3); break;  /* WOW */
        case 1: fm_set(p, 137, p[137] + d); break;                                    /* FLUTTER */
        case 2: {                                                                     /* DRIFT */
            int spread = clamp(haunt_spread(p) + step, 0, 7);
            for (unsigned n = 0; n < 6; ++n)
                fm_set(p, op_base(n) + 20, 7 + ((n & 1U) ? -1 : 1) * ((car >> n) & 1U ? spread : spread / 2));
            break;
        }
        case 3: fm_set(p, 142, (int)(p[142] + 6U + (unsigned)(step > 0 ? 1 : 5)) % 6); break; /* WAVE */
        case 4: case 5: case 6:                                  /* HAUNT attack, LINGER release, VEIL */
            for (unsigned n = 0; n < 6; ++n) {
                unsigned b = op_base(n);
                if (c == 0) fm_set(p, b, p[b] - d);
                else if (c == 1) fm_set(p, b + 3, p[b + 3] - d);
                else if (!((car >> n) & 1U)) fm_set(p, b + 16, p[b + 16] - d);
            }
            break;
        case 7: {                                                /* SWOOP: pitch EG scoop and droop */
            int s = clamp(50 - (int)p[133] + k, -30, 30);
            fm_set(p, 133, 50 - s);
            fm_set(p, 126, s ? 64 - (s < 0 ? -s : s) : 99);
            fm_set(p, 129, s ? 46 : 99);
            for (unsigned i = 130; i < 133; ++i) fm_set(p, i, 50);
            break;
        }
        case 8: fm_set(p, 135, p[135] + step); break;            /* POSSESS: feedback */
        case 9:                                                   /* ROT: inharmonic modulators */
            for (unsigned n = 0; n < 6; ++n)
                if (!((car >> n) & 1U) && !p[op_base(n) + 17]) fm_set(p, op_base(n) + 19, p[op_base(n) + 19] + 2 * d + (int)(n & 1U));
            break;
        case 10: {                                                /* TUNING */
            haunt_tune[track] = (uint8_t)clamp(haunt_tune[track] + step, 0, HAUNT_TUNINGS - 1);
            struct groove_tuning t;
            memcpy(t.main, haunt_tunings[haunt_tune[track]], 12); memcpy(t.alt, t.main, 12);
            groove_tuning_set(track, &t);
            break;
        }
        case 11: {                                                /* MUTATE: CW mild, CCW wild */
            unsigned chaos = step > 0 ? 3 : 9;
            for (unsigned i = 0; i < 2U + chaos / 2U; ++i) {
                uint32_t r = haunt_seed ^= haunt_seed << 13, b = op_base((r >> 3) % 6U);
                haunt_seed ^= haunt_seed >> 17; haunt_seed ^= haunt_seed << 5;
                int swing = (int)((r >> 8) % (chaos * 2U + 1U)) - (int)chaos;
                static const uint8_t field[8] = {16, 19, 20, 1, 2, 3, 16, 19};
                unsigned what = (r >> 16) % 10U;
                if (what < 8) fm_set(p, b + field[what], p[b + field[what]] + swing * (field[what] == 20 ? 1 : 3));
                else fm_set(p, what == 8 ? 135U : 137U, p[what == 8 ? 135 : 137] + (what == 8 ? step : swing * 3));
            }
            if (chaos > 3 && (haunt_seed & 7U) == 0) fm_set(p, 134, (int)(haunt_seed >> 8) % 32);
            ++haunt_mutations;
            break;
        }
        case 12: haunt_slot = (unsigned)clamp((int)haunt_slot + step, 0, HAUNT_USER_SLOTS - 1); haunt_confirm = 0; break;
        case 13: haunt_action = (unsigned)clamp((int)haunt_action + step, 0, 2); haunt_confirm = 0; break;
        }
    }
    if (haunt_page == HP_VAULT && (pressed & BUTTON(SAVE))) {
        uint8_t q[156];
        int r = 0;
        notice_until = now + 2000U;
        groove_fm_program(q, HAUNT_FIRST_USER + haunt_slot);
        if (haunt_action == 0) {
            if (memcmp(q + 145, "USER ", 5) && !haunt_confirm) {
                haunt_confirm = 1; notice = "SLOT HAUNTED - SAVE AGAIN TO REPLACE";
                return;
            }
            r = haunt_store(haunt_slot);
            notice = r ? "VAULT WRITE FAILED" : "SOUL STORED IN THE VAULT";
        } else if (haunt_action == 1) {
            r = groove_fm_import(track, q);
            notice = r ? "LOAD FAILED" : "SOUL SUMMONED FROM THE VAULT";
        } else {
            r = haunt_snapshot_track == track ? groove_fm_import(track, haunt_snapshot) : -1;
            notice = r ? "NOTHING TO EXORCISE HERE" : "EXORCISED - VOICE RESTORED";
        }
        haunt_confirm = 0;
    }
}

/* ---------- drawing ---------- */
static int haunt_value(const uint8_t *p, unsigned c, char out[12])
{
    int v = 0;
    const char *word = NULL;
    switch (haunt_page * 4 + c) {
    case 0: v = p[139]; break;
    case 1: v = p[137]; break;
    case 2: v = haunt_spread(p) * 14; decimal(out, v / 14, 1); return v;
    case 3: v = p[142] % 6; word = haunt_words[W_WAVES + v]; v *= 19; break;
    case 4: v = 99 - op_mean(p, 0, 1); break;
    case 5: v = 99 - op_mean(p, 3, 1); break;
    case 6: v = 99 - op_mean(p, 16, 0); break;
    case 7: v = 50 - (int)p[133]; decimal(out, v, 1); return (v < 0 ? -v : v) * 3;
    case 8: v = p[135]; decimal(out, v, 1); return v * 14;
    case 9: v = op_mean(p, 19, 0); break;
    case 10: v = haunt_tune[track]; word = haunt_words[W_TUNINGS + v]; v *= 19; break;
    case 11: decimal(out, (int)haunt_mutations, 1); strcat(out, "X"); return (int)(haunt_mutations * 9U % 100U);
    case 12: v = (int)haunt_slot * 4; out[0] = 'U'; decimal(out + 1, (int)haunt_slot + 1, 2); return v;
    case 13: v = (int)haunt_action * 49; word = haunt_words[W_ACTIONS + haunt_action]; break;
    default: out[0] = 0; return -1;
    }
    if (word) strcpy(out, word); else decimal(out, v, 1);
    return v;
}
static __attribute__((noinline)) void haunt_draw(void)
{
    if (paint_rendering && paint_top < 30) return;
    const uint8_t *p = frame_patch;
    uint32_t now = frame_time;
    if (cache->haunt_cache[0] != haunt_page + track * 8U) {
        cache->haunt_cache[0] = haunt_page + track * 8U;
        char name[11]; memcpy(name, p + 145, 10); name[10] = 0;
        paint_fill(0, 31, 240, 13, BACK);
        text(8, 34, "HAUNT LAB", 1, ACCENT, BACK);
        number(68, 34, (int)track + 1, 1, 1, colors[track], BACK);
        text(80, 34, name, 1, TEXT, BACK);
        number(178, 34, (int)haunt_page + 1, 1, 1, AMBER, BACK);
        text(190, 34, haunt_words[W_PAGES + haunt_page], 1, AMBER, BACK);
    }
    /* The pumpkin is possessed once the voice is cursed enough. */
    unsigned possessed = p[135] * 6 + p[139] / 3 + haunt_spread(p) * 3 > 60;
    unsigned glow = candle_flicker(now, 1) + (frame_views[track].audible ? frame_views[track].level / 40U : 0U);
    if (cache->haunt_cache[1] != (possessed | glow << 1)) {
        cache->haunt_cache[1] = possessed | glow << 1;
        big_pumpkin(8, 47, possessed, glow);
    }
    char values[4][12]; int v[4];
    for (unsigned c = 0; c < 4; ++c) v[c] = haunt_value(p, c, values[c]);
    uint32_t sig = signature(now / 90U, v, sizeof v);
    if (cache->haunt_cache[2] != sig) {
        cache->haunt_cache[2] = sig;
        paint_fill(110, 44, 130, 80, BACK);
        for (unsigned c = 0; c < 4; ++c)
            if (v[c] >= 0) candle(120 + c * 29, 120, 4U + (unsigned)clamp(v[c], 0, 99) * 56U / 99U, colors[c], candle_flicker(now, c + 11));
    }
    /* WARBLE shows the live pitch wobble; VAULT the selected slot's voice. */
    sig = haunt_page == HP_WARBLE ? signature(now / 66U, p + 137, 7) : haunt_page * 64U + haunt_slot;
    if (cache->haunt_cache[3] != sig) {
        cache->haunt_cache[3] = sig;
        paint_fill(8, 128, 224, 58, BACK);
        frame(8, 128, 224, 58, PANEL);
        if (haunt_page == HP_WARBLE) {
            int depth = p[139] * (p[143] + 1) / 8, py = 157;
            if (depth > 26) depth = 26;
            unsigned speed = 1U + p[137] / 6U;
            for (unsigned i = 0; i < 220; ++i) {
                unsigned ph = (now / 33U * speed * 3U + i * speed) & 255U;
                int s = p[142] % 6U == 3 ? (ph < 128 ? 120 : -120) : ph < 128 ? (int)ph * 2 - 128 : 383 - (int)ph * 2;
                int y = 157 - s * depth / 128;
                line((int)(10 + i), py, (int)(10 + i), y, GREEN);
                py = y;
            }
        } else if (haunt_page != HP_VAULT) {
            text(16, 146, haunt_page == HP_GHOST ? "FADE IN, LINGER, VEIL, SWOOP" : "FEEDBACK, ROT, TUNING, MUTATE", 1, DIM, BACK);
            text(16, 162, haunt_page == HP_GHOST ? "ALL OPERATORS, ONE TURN" : "K4 RIGHT MILD, LEFT WILD", 1, DIM, BACK);
        } else {
            uint8_t q[156];
            groove_fm_program(q, HAUNT_FIRST_USER + haunt_slot);
            q[155] = 0;
            text(16, 140, memcmp(q + 145, "USER ", 5) ? (const char *)q + 145 : "EMPTY GRAVE", 2, TEXT, BACK);
        }
    }
    if (paint_rendering && paint_top + PAINT_ROWS <= 188) return;
    for (unsigned c = 0; c < 4; ++c) knob(c, haunt_words[haunt_page * 4 + c], values[c], colors[c]);
    if (notice && (int32_t)(frame_time - notice_until) >= 0) notice = NULL;
    const char *hint = notice ? notice : haunt_page == HP_VAULT ? "K1 SLOT  K2 ACTION  SAVE RUN IT" : "SELECT PAGE  PRESETS VOICE  SEL MORE";
    if (cache->hint_cache != (uint32_t)(uintptr_t)hint) {
        cache->hint_cache = (uint32_t)(uintptr_t)hint;
        paint_fill(6, 231, 228, 7, BACK);
        text(6, 231, hint, 1, DIM, BACK);
    }
}
