/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception
 * PumpkinWave 666: jack-o'-lantern graphics and the HAUNT LAB sound designer.
 * Included by screen.c after its drawing primitives. Control task only.
 *
 * HAUNT LAB (SEL on a DX7 track; SEL again opens the classic SCALING page):
 *   SELECT  page  WARBLE / GHOST / CURSE / TUNING / VAULT
 *   K1-K4   macros on the current page (each edits real DX7 voice parameters)
 *   PRESETS DX7 program, ALGORITHM DX7 algorithm (as on the other FM pages)
 *   SAVE    on VAULT: run the selected action (STORE asks twice for a used slot)
 */
#include "pumpkin_art.inc"

enum { HAUNT_PAGES = 5, HAUNT_TUNINGS = 9, HAUNT_FIRST_USER = 103, HAUNT_USER_SLOTS = 25 };
enum { HP_WARBLE, HP_GHOST, HP_CURSE, HP_TUNING, HP_VAULT };
static const char *const haunt_titles[HAUNT_PAGES] = {"1/5 WARBLE", "2/5 GHOST", "3/5 CURSE", "4/5 TUNING", "5/5 VAULT"};
/* Carrier masks (bit n = OP n+1) for DX7 algorithms 1..32. */
static const uint8_t haunt_carriers[32] = {
    0x05, 0x05, 0x09, 0x09, 0x15, 0x15, 0x05, 0x05, 0x05, 0x09, 0x09, 0x05, 0x05, 0x05, 0x05, 0x01,
    0x01, 0x01, 0x19, 0x0b, 0x1b, 0x1d, 0x1b, 0x1f, 0x1f, 0x0b, 0x0b, 0x25, 0x17, 0x27, 0x1f, 0x3f};
static const char *const haunt_tuning_names[HAUNT_TUNINGS] = {
    "12-TET", "HAUNTED", "DROWNED", "MOONSICK", "WEREWOLF", "JUST MIN", "SEPTIMAL", "RAST 1/4", "GAMELAN"};
/* Cents from 12-TET by pitch class, C first. WEREWOLF is quarter-comma
 * meantone with its howling G#-Eb wolf fifth; JUST MIN and SEPTIMAL are
 * 5- and 7-limit ratios on C; RAST lowers E and B by a quarter tone. */
static const int8_t haunt_tunings[HAUNT_TUNINGS][12] = {
    {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0},
    {0, 23, -17, 11, -26, 7, 19, -9, 27, -21, 13, -14},
    {0, -50, 0, -50, 0, 0, -50, 0, -50, 0, -50, 0},
    {0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44},
    {0, -24, -7, 10, -14, 3, -21, -3, -27, -10, 7, -17},
    {0, 12, 4, 16, -14, -2, -10, 2, 14, -16, 18, -12},
    {0, 19, 4, -33, -14, -2, -18, 2, -35, -16, -31, -12},
    {0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50},
    {0, 20, 40, 60, 80, 50, 30, 20, 40, 60, 80, 0}};
static const char *const haunt_actions[3] = {"STORE", "LOAD", "EXORCISE"};
static unsigned haunt_page, haunt_slot, haunt_action, haunt_confirm, haunt_mutations;
static uint8_t haunt_chaos[GROOVE_TRACKS] = {4, 4, 4, 4, 4, 4, 4, 4};
static uint8_t haunt_tune[GROOVE_TRACKS], haunt_alt[GROOVE_TRACKS], haunt_hold[GROOVE_TRACKS];
static uint8_t haunt_warp[GROOVE_TRACKS] = {100, 100, 100, 100, 100, 100, 100, 100};
static uint8_t haunt_snapshot[156];
static unsigned haunt_snapshot_track = 255;
static uint32_t haunt_seed = 0x666u;
static char haunt_names[5][11];
static unsigned haunt_names_slot = ~0U;

/* ---------- palette ---------- */
static uint16_t art_palette[16] = {
    0x0000, 0x3060, 0xd2e0, 0xf483, 0x91a0, 0x3bc4, 0x3e25, 0xdff7,
    0x0820, 0xef19, 0xd842, 0xab1f, 0x1844, 0x2fe7, 0x5d45, 0x0000};
/* Witch-light: the carved face and every candle burn green. */
static const uint16_t glow_g[8] = {0x0a21, 0x12e2, 0x23c3, 0x2c83, 0x3544, 0x3e25, 0x4ee5, 0x57c6};
static const uint16_t glow_y[8] = {0x3ca5, 0x5527, 0x6d8a, 0x860d, 0x968f, 0xaf12, 0xc774, 0xdff7};
static __attribute__((noinline)) unsigned candle_flicker(uint32_t now, unsigned salt)
{
    /* Deterministic candle noise: never fully dark, occasionally flaring. */
    uint32_t n = (now / 90U) * 2654435761U ^ (salt * 40503U);
    n ^= n >> 15; n *= 2246822519U; n ^= n >> 13;
    return 3U + (n & 3U) + ((n >> 8) % 7U == 0 ? 1U : 0U);
}
static void glow_set(unsigned level)
{
    if (level > 7) level = 7;
    art_palette[6] = glow_g[level];
    art_palette[7] = glow_y[level];
    art_palette[13] = level > 5 ? 0x2fe7 : 0x1625;
}
/* Indexed 4-bit sprite. Index 0 is transparent; everything else uses pal. */
static __attribute__((noinline)) void sprite(unsigned x, unsigned y, const uint8_t *art, unsigned w, unsigned h,
                                             unsigned scale, const uint16_t *pal)
{
    if (!scale || x >= FM1_SCREEN_WIDTH || y >= FM1_SCREEN_HEIGHT) return;
    unsigned W = w * scale, H = h * scale;
    if (W > FM1_SCREEN_WIDTH - x) W = FM1_SCREEN_WIDTH - x;
    if (H > FM1_SCREEN_HEIGHT - y) H = FM1_SCREEN_HEIGHT - y;
    if (!paint_rendering) { paint_mark(x, y, W, H); return; }
    if (y >= paint_top + PAINT_ROWS || y + H <= paint_top || x >= paint_end || x + W <= paint_x) return;
    unsigned first = y < paint_top ? paint_top : y, end = y + H < paint_top + PAINT_ROWS ? y + H : paint_top + PAINT_ROWS;
    unsigned left = x < paint_x ? paint_x : x, right = x + W < paint_end ? x + W : paint_end;
    unsigned stride = paint_end - paint_x;
    for (unsigned row = first; row < end; ++row) {
        unsigned sy = (row - y) / scale;
        uint16_t *pixel = paint_pixels + (row - paint_top) * stride + left - paint_x;
        for (unsigned col = left; col < right; ++col, ++pixel) {
            unsigned at = sy * w + (col - x) / scale;
            unsigned index = (art[at >> 1] >> ((at & 1U) ? 0 : 4)) & 15U;
            if (index) *pixel = pal[index];
        }
    }
}
/* Track badge: a little pumpkin in the track colour with its number. */
static void pumpkin_badge(unsigned x, unsigned y, unsigned t, unsigned selected, unsigned active)
{
    uint16_t pal[16];
    memcpy(pal, art_palette, sizeof pal);
    uint16_t body = selected ? colors[t] : PANEL;
    pal[2] = body;
    pal[3] = selected ? (uint16_t)(body | 0x2104) : 0x4129;
    pal[4] = (uint16_t)((body >> 1) & 0x7bef);
    pal[1] = selected ? 0x2840 : 0x1844;
    pal[5] = selected ? 0x3bc4 : 0x3a87;
    paint_fill(x, y, ART_BADGE_W, ART_BADGE_H + 2, BACK);
    sprite(x, y + 1, art_badge, ART_BADGE_W, ART_BADGE_H, 1, pal);
    number(x + 7, y + 6, (int)t + 1, 1, 1, selected ? BACK : colors[t], body);
    if (active) paint_fill(x + 2, y + 12, 3, 3, GREEN);
}
/* Small header pumpkin: its grin brightens with the output level. */
static void mini_pumpkin(unsigned x, unsigned y, unsigned level, uint32_t now, unsigned playing)
{
    if (paint_rendering && (y >= paint_top + PAINT_ROWS || y + ART_MINI_H <= paint_top)) return;
    unsigned glow = playing || level ? candle_flicker(now, 7) + level / 40U : 1U;
    glow_set(glow);
    uint32_t sig = glow | (level / 16U << 4);
    if (cache->haunt_cache[7] == sig) return;
    cache->haunt_cache[7] = sig;
    paint_fill(x, y, ART_MINI_W, ART_MINI_H, BACK);
    sprite(x, y, art_mini, ART_MINI_W, ART_MINI_H, 1, art_palette);
}
static void big_pumpkin(unsigned x, unsigned y, unsigned scale, unsigned face, unsigned glow)
{
    glow_set(glow);
    sprite(x, y, art_pumpkin, ART_PUMPKIN_W, ART_PUMPKIN_H, scale, art_palette);
    static const uint8_t *const faces[3] = {art_face_calm, art_face_evil, art_face_possessed};
    uint16_t pal[16]; memcpy(pal, art_palette, sizeof pal);
    pal[9] = 0xdffa; /* white-hot green pupils */
    sprite(x, y, faces[face % 3], ART_FACE_EVIL_W, ART_FACE_EVIL_H, scale, pal);
}

/* ---------- boot splash ---------- */
static __attribute__((noinline, cold, minsize)) void pumpkin_boot_draw(void)
{
    uint32_t t = frame_time - boot_started;
    unsigned glow = boot_phase < 3 ? boot_phase * 2U : candle_flicker(frame_time, 3) + 1U;
    uint32_t sig = glow | (boot_phase << 4) | ((t / 140U) << 8);
    if (cache->title_cache == sig) return;
    unsigned first = cache->title_cache == ~0U;
    cache->title_cache = sig;
    if (first) {
        paint_fill(0, 0, 240, 240, BACK);
        text(54, 124, "PUMPKINWAVE", 2, ACCENT, BACK);
        text(51, 180, "HAUNTED FM FOR THE FM-1", 1, DIM, BACK);
        text(36, 222, "V1.0 - BUILT ON FM1 OPEN " FM1_RELEASE_VERSION, 1, PANEL | 0x4208, BACK);
    }
    /* Pumpkin, drawn over a cleared frame so the flicker never smears. */
    paint_fill(72, 40, 96, 76, BACK);
    big_pumpkin(72, 40, 3, boot_phase >= 6 ? 2 : 1, glow);
    /* The number of the beast, in blood. */
    text(84, 144, "666", 4, boot_phase >= 4 ? 0xd8c5 : PANEL, BACK);
    /* Bats circle the pumpkin. */
    static const uint8_t bat_x[3] = {30, 186, 160}, bat_y[3] = {44, 60, 18};
    for (unsigned i = 0; i < 3; ++i) {
        unsigned frame = (t / 160U + i) & 1U, bx = bat_x[i] + ((t / 40U + i * 7U) % 12U), by = bat_y[i] + (frame ? 2U : 0U);
        paint_fill(bat_x[i], bat_y[i], 24, 12, BACK);
        uint16_t pal[16]; memcpy(pal, art_palette, sizeof pal); pal[12] = 0x6a0f;
        sprite(bx, by, frame ? art_bat_up : art_bat_down, ART_BAT_UP_W, ART_BAT_UP_H, 1, pal);
    }
    /* Eight candles light up as the instrument wakes. */
    for (unsigned i = 0; i < 8; ++i) {
        unsigned cx = 63 + i * 15;
        paint_fill(cx, 194, 7, 16, BACK);
        uint16_t pal[16]; memcpy(pal, art_palette, sizeof pal);
        if (i >= boot_phase) { pal[13] = pal[7] = pal[6] = BACK; }
        pal[9] = colors[i];
        sprite(cx, 198, art_candle, ART_CANDLE_W, ART_CANDLE_H, 1, pal);
        paint_fill(cx + 1, 203, 5, 6, colors[i]);
    }
}

/* ---------- DX7 helpers ---------- */
static unsigned op_base(unsigned n) { return (5U - n) * 21U; } /* n = 0 for OP1 */
static unsigned carriers_of(const uint8_t *p) { return haunt_carriers[p[134] & 31U]; }
static const uint8_t haunt_op_max[21] = {99,99,99,99,99,99,99,99,99,99,99,3,3,7,3,7,99,1,31,99,14};
static const uint8_t haunt_global_max[19] = {99,99,99,99,99,99,99,99,31,7,1,99,99,99,99,1,5,7,48};
static unsigned fm_max(unsigned parameter)
{
    return parameter < 126 ? haunt_op_max[parameter % 21U] : parameter < 145 ? haunt_global_max[parameter - 126] : 0;
}
/* Move one parameter to an absolute value through the normal edit path. */
static void fm_set(uint8_t *p, unsigned parameter, int value)
{
    int high = (int)fm_max(parameter);
    value = clamp(value, 0, high);
    if (value != p[parameter]) {
        groove_fm_edit(track, parameter, value - (int)p[parameter]);
        p[parameter] = (uint8_t)value;
    }
}
static uint32_t haunt_random(void)
{
    haunt_seed ^= haunt_seed << 13; haunt_seed ^= haunt_seed >> 17; haunt_seed ^= haunt_seed << 5;
    return haunt_seed;
}
static int haunt_spread(const uint8_t *p)
{
    int spread = 0;
    unsigned car = carriers_of(p);
    for (unsigned n = 0; n < 6; ++n)
        if (car & (1U << n)) {
            int d = (int)p[op_base(n) + 20] - 7; if (d < 0) d = -d;
            if (d > spread) spread = d;
        }
    return spread;
}
static int haunt_veil(const uint8_t *p)
{
    unsigned car = carriers_of(p), sum = 0, count = 0;
    for (unsigned n = 0; n < 6; ++n)
        if (!(car & (1U << n))) { sum += p[op_base(n) + 16]; ++count; }
    return count ? 99 - (int)(sum / count) : 99;
}
static int haunt_rot(const uint8_t *p)
{
    unsigned car = carriers_of(p), sum = 0, count = 0;
    for (unsigned n = 0; n < 6; ++n)
        if (!(car & (1U << n)) && !p[op_base(n) + 17]) { sum += p[op_base(n) + 19]; ++count; }
    return count ? (int)(sum / count) : 0;
}
static int haunt_swoop(const uint8_t *p) { return 50 - (int)p[133]; }
static unsigned haunt_first_carrier(const uint8_t *p)
{
    unsigned car = carriers_of(p);
    for (unsigned n = 0; n < 6; ++n) if (car & (1U << n)) return n;
    return 0;
}
static int haunt_tuning_apply(unsigned t)
{
    struct groove_tuning tuning;
    for (unsigned k = 0; k < GROOVE_TUNING_KEYS; ++k) {
        tuning.main[k] = (int8_t)clamp(haunt_tunings[haunt_tune[t] % HAUNT_TUNINGS][k] * haunt_warp[t] / 100, -127, 127);
        tuning.alt[k] = (int8_t)clamp(haunt_tunings[haunt_alt[t] % HAUNT_TUNINGS][k] * haunt_warp[t] / 100, -127, 127);
    }
    return groove_tuning_set(t, &tuning);
}
static unsigned haunt_tuning_matches(unsigned t)
{
    struct groove_tuning now;
    groove_tuning_get(t, &now);
    for (unsigned k = 0; k < GROOVE_TUNING_KEYS; ++k)
        if (now.main[k] != (int8_t)clamp(haunt_tunings[haunt_tune[t] % HAUNT_TUNINGS][k] * haunt_warp[t] / 100, -127, 127))
            return 0;
    return 1;
}
static void haunt_open(void)
{
    uint8_t p[156];
    if (!groove_fm_copy(track, p, NULL)) { memcpy(haunt_snapshot, p, sizeof p); haunt_snapshot_track = track; }
    haunt_confirm = 0; haunt_mutations = 0;
    haunt_seed ^= fm1_millis() * 2654435761U + 1U;
}
static void haunt_slot_names(void)
{
    unsigned first = haunt_slot < 2 ? 0 : haunt_slot > HAUNT_USER_SLOTS - 3 ? HAUNT_USER_SLOTS - 5 : haunt_slot - 2;
    if (first == haunt_names_slot) return;
    haunt_names_slot = first;
    for (unsigned i = 0; i < 5; ++i) {
        uint8_t p[156];
        groove_fm_program(p, HAUNT_FIRST_USER + first + i);
        memcpy(haunt_names[i], p + 145, 10); haunt_names[i][10] = 0;
    }
}
static unsigned haunt_slot_empty(unsigned slot)
{
    uint8_t p[156];
    groove_fm_program(p, HAUNT_FIRST_USER + slot);
    return !memcmp(p + 145, "USER ", 5);
}
static int haunt_store(unsigned slot)
{
    unsigned program = HAUNT_FIRST_USER + slot, bank = program / 32U;
    uint8_t patch[156];
    int r = groove_fm_copy(track, patch, NULL);
    if (r) return r;
    uint8_t *raw = malloc(4096);
    if (!raw) return GROOVE_PROJECT_MEMORY;
    r = groove_fm_library_read(bank, raw);
    if (!r) {
        groove_fm_pack(raw + (program % 32U) * 128U, patch);
        r = groove_fm_library_write(bank, raw);
    }
    free(raw);
    haunt_names_slot = ~0U;
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
    const int16_t *k = controls->encoders + 2;
    unsigned car = carriers_of(p);
    if (haunt_page == HP_WARBLE) {
        if (k[0]) {
            fm_set(p, 139, p[139] + fm_encoder_delta(2, k[0]));
            if (p[139] && p[143] < 3) fm_set(p, 143, 3);
        }
        if (k[1]) fm_set(p, 137, p[137] + fm_encoder_delta(3, k[1]));
        if (k[2]) {
            int spread = clamp(haunt_spread(p) + (k[2] > 0 ? 1 : -1), 0, 7), order = 0;
            unsigned lone = !(car & (car - 1U));
            for (unsigned n = 0; n < 6; ++n) {
                unsigned is_carrier = (car >> n) & 1U;
                int sign = (order++ & 1) ? -1 : 1;
                int amount = is_carrier || lone ? spread : spread / 2;
                fm_set(p, op_base(n) + 20, 7 + sign * amount);
            }
        }
        if (k[3]) fm_set(p, 142, (int)((p[142] + 6 + (k[3] > 0 ? 1 : 5)) % 6));
    } else if (haunt_page == HP_GHOST) {
        for (unsigned n = 0; n < 6; ++n) {
            unsigned b = op_base(n), is_carrier = (car >> n) & 1U;
            if (k[0]) fm_set(p, b + 0, p[b + 0] - fm_encoder_delta(2, k[0]) * 1);
            if (k[1]) fm_set(p, b + 3, p[b + 3] - fm_encoder_delta(3, k[1]));
            if (k[2] && !is_carrier) fm_set(p, b + 16, p[b + 16] - fm_encoder_delta(4, k[2]));
        }
        if (k[3]) {
            int s = clamp(haunt_swoop(p) + k[3], -30, 30), a = s < 0 ? -s : s;
            fm_set(p, 133, 50 - s);
            for (unsigned i = 130; i < 133; ++i) fm_set(p, i, 50);
            fm_set(p, 126, s ? 64 - a : 99);
            for (unsigned i = 127; i < 129; ++i) fm_set(p, i, 99);
            fm_set(p, 129, s ? 46 : 99);
        }
    } else if (haunt_page == HP_CURSE) {
        if (k[0]) fm_set(p, 135, p[135] + (k[0] > 0 ? 1 : -1));
        if (k[1])
            for (unsigned n = 0; n < 6; ++n)
                if (!(car & (1U << n)) && !p[op_base(n) + 17])
                    fm_set(p, op_base(n) + 19, p[op_base(n) + 19] + 2 * fm_encoder_delta(3, k[1]) + (int)n % 2);
        if (k[2]) haunt_chaos[track] = (uint8_t)clamp(haunt_chaos[track] + (k[2] > 0 ? 1 : -1), 1, 10);
        if (k[3]) {
            unsigned chaos = haunt_chaos[track], count = 2U + chaos / 2U;
            for (unsigned i = 0; i < count; ++i) {
                uint32_t r = haunt_random();
                unsigned n = r % 6U, b = op_base(n), what = (r >> 4) % 10U;
                int swing = (int)((r >> 8) % (chaos * 2U + 1U)) - (int)chaos;
                if (!swing) swing = (r >> 20) & 1U ? 1 : -1;
                switch (what) {
                case 0: case 1:
                    if (!(car & (1U << n))) fm_set(p, b + 16, p[b + 16] + swing * 3); break;
                case 2: if (chaos >= 6 && !(car & (1U << n))) fm_set(p, b + 18, p[b + 18] + (swing > 0 ? 1 : -1)); break;
                case 3: fm_set(p, b + 19, p[b + 19] + swing * 4); break;
                case 4: fm_set(p, b + 20, p[b + 20] + (swing > 0 ? 1 : -1)); break;
                case 5: fm_set(p, b + 1 + (r >> 24) % 3U, p[b + 1 + (r >> 24) % 3U] + swing * 3); break;
                case 6: fm_set(p, 135, p[135] + (swing > 0 ? 1 : -1)); break;
                case 7: fm_set(p, 139, p[139] + swing * 2); if (p[139] && p[143] < 2) fm_set(p, 143, 2); break;
                case 8: fm_set(p, 137, p[137] + swing * 3); break;
                default: if (chaos >= 9) fm_set(p, 134, (int)((r >> 12) % 32U)); else fm_set(p, b + 3, p[b + 3] + swing * 2); break;
                }
            }
            ++haunt_mutations;
        }
    } else if (haunt_page == HP_TUNING) {
        unsigned t = track, changed = 0;
        if (k[0]) { haunt_tune[t] = (uint8_t)clamp(haunt_tune[t] + (k[0] > 0 ? 1 : -1), 0, HAUNT_TUNINGS - 1); changed = 1; }
        if (k[1]) { haunt_warp[t] = (uint8_t)clamp(haunt_warp[t] + 5 * (k[1] > 0 ? 1 : -1), 0, 200); changed = 1; }
        if (k[2]) { haunt_alt[t] = (uint8_t)clamp(haunt_alt[t] + (k[2] > 0 ? 1 : -1), 0, HAUNT_TUNINGS - 1); changed = 1; }
        if (k[3]) { haunt_hold[t] = k[3] > 0; groove_tuning_alt_hold(t, haunt_hold[t]); }
        if (changed && haunt_tuning_apply(t)) { notice = "TUNING REJECTED"; notice_until = now + 1500U; }
    } else {
        if (k[0]) { haunt_slot = (unsigned)clamp((int)haunt_slot + (k[0] > 0 ? 1 : -1), 0, HAUNT_USER_SLOTS - 1); haunt_confirm = 0; }
        if (k[1]) { haunt_action = (unsigned)clamp((int)haunt_action + (k[1] > 0 ? 1 : -1), 0, 2); haunt_confirm = 0; }
        if (pressed & BUTTON(SAVE)) {
            int r = 0;
            if (haunt_action == 0) {
                if (!haunt_slot_empty(haunt_slot) && !haunt_confirm) {
                    haunt_confirm = 1; notice = "SLOT HAUNTED - SAVE AGAIN TO REPLACE"; notice_until = now + 2500U;
                    return;
                }
                r = haunt_store(haunt_slot);
                notice = r ? "VAULT WRITE FAILED" : "SOUL STORED IN THE VAULT";
            } else if (haunt_action == 1) {
                uint8_t q[156];
                groove_fm_program(q, HAUNT_FIRST_USER + haunt_slot);
                r = groove_fm_import(track, q);
                notice = r ? "LOAD FAILED" : "SOUL SUMMONED FROM THE VAULT";
            } else if (haunt_snapshot_track == track) {
                r = groove_fm_import(track, haunt_snapshot);
                notice = r ? "EXORCISM FAILED" : "EXORCISED - VOICE RESTORED";
            } else notice = "NOTHING TO EXORCISE ON THIS TRACK";
            haunt_confirm = 0; notice_until = now + 2000U;
        }
    }
}

/* ---------- drawing ---------- */
static void haunt_candle(unsigned col, int value, int high, uint32_t now)
{
    unsigned x = 118 + col * 29, top = 50, bottom = 120;
    unsigned span = bottom - top - 12;
    unsigned height = (unsigned)(clamp(value, 0, high) * (int)span / (high ? high : 1)) + 4U;
    paint_fill(x - 2, top, 24, bottom - top + 2, BACK);
    paint_fill(x + 9, top + 4, 1, bottom - top - 4, PANEL);
    paint_fill(x, bottom - height, 19, height, colors[col]);
    paint_fill(x + 2, bottom - height, 3, height, (uint16_t)(colors[col] | 0x2104));
    paint_fill(x + 15, bottom - height, 4, height, (uint16_t)((colors[col] >> 1) & 0x7bef));
    paint_fill(x - 2, bottom, 23, 2, 0x5a4b);
    uint16_t pal[16]; memcpy(pal, art_palette, sizeof pal);
    unsigned flame = candle_flicker(now, col + 11);
    pal[6] = glow_g[flame]; pal[7] = glow_y[flame]; pal[9] = colors[col];
    sprite(x + 2, bottom - height - 10, art_candle, ART_CANDLE_W, 4, 2, pal);
}
static int haunt_value(const uint8_t *p, unsigned col, int *high, char out[12])
{
    int v = 0; *high = 99;
    static const char *const waves[] = {"TRI", "SAWDN", "SAWUP", "SQR", "SINE", "S/H"};
    switch (haunt_page * 4 + col) {
    case 0: v = p[139]; decimal(out, v, 1); break;
    case 1: v = p[137]; decimal(out, v, 1); break;
    case 2: v = haunt_spread(p); *high = 7; decimal(out, v, 1); break;
    case 3: v = p[142] % 6; *high = 5; strcpy(out, waves[v]); break;
    case 4: v = 99 - p[op_base(haunt_first_carrier(p))]; decimal(out, v, 1); break;
    case 5: v = 99 - p[op_base(haunt_first_carrier(p)) + 3]; decimal(out, v, 1); break;
    case 6: v = haunt_veil(p); decimal(out, v, 1); break;
    case 7: v = haunt_swoop(p); *high = 30; decimal(out, v, 1); if (v < 0) v = -v; break;
    case 8: v = p[135]; *high = 7; decimal(out, v, 1); break;
    case 9: v = haunt_rot(p); decimal(out, v, 1); break;
    case 10: v = haunt_chaos[track]; *high = 10; decimal(out, v, 1); break;
    case 11: v = (int)(haunt_mutations % 100U); decimal(out, (int)haunt_mutations, 1); strcpy(out + strlen(out), "X"); break;
    case 12: v = haunt_tune[track]; *high = HAUNT_TUNINGS - 1;
        strcpy(out, haunt_tuning_matches(track) ? haunt_tuning_names[v] : "CUSTOM"); break;
    case 13: v = haunt_warp[track]; *high = 200; decimal(out, v, 1); strcat(out, "%"); break;
    case 14: v = haunt_alt[track]; *high = HAUNT_TUNINGS - 1; strcpy(out, haunt_tuning_names[v]); break;
    case 15: v = haunt_hold[track] ? 99 : 0; strcpy(out, haunt_hold[track] ? "ON" : "OFF"); break;
    case 16: v = (int)haunt_slot; *high = HAUNT_USER_SLOTS - 1; strcpy(out, "U"); decimal(out + 1, (int)haunt_slot + 1, 2); break;
    case 17: v = (int)haunt_action * 49; strcpy(out, haunt_actions[haunt_action]); break;
    default: out[0] = 0; break;
    }
    return v;
}
static const char *const haunt_labels[HAUNT_PAGES][4] = {
    {"WOW", "FLUTTER", "DRIFT", "WAVE"}, {"HAUNT", "LINGER", "VEIL", "SWOOP"},
    {"POSSESS", "ROT", "CHAOS", "MUTATE"}, {"TUNING", "WARP", "ALT TUNE", "ALT HOLD"}, {"SLOT", "ACTION", "", ""}};
static void haunt_viz(const uint8_t *p, uint32_t now)
{
    const unsigned X = 8, Y = 128, W = 224, H = 58;
    paint_fill(X, Y, W, H, BACK);
    frame(X, Y, W, H, PANEL);
    if (haunt_page == HP_WARBLE) {
        /* The pitch warble as it really moves: depth, speed and LFO shape. */
        int depth = p[139] * (p[143] + 1) / 8; if (depth > 26) depth = 26;
        unsigned speed = 1U + p[137] / 6U, wave = p[142] % 6U;
        int py = (int)(Y + H / 2);
        uint32_t phase0 = now / 33U * speed * 3U;
        for (unsigned i = 0; i < W - 4; ++i) {
            uint32_t ph = (phase0 + i * speed) & 255U;
            int s;
            if (wave == 0) s = ph < 128 ? (int)ph * 2 - 128 : 383 - (int)ph * 2;
            else if (wave == 1) s = 127 - (int)ph;
            else if (wave == 2) s = (int)ph - 128;
            else if (wave == 3) s = ph < 128 ? 120 : -120;
            else if (wave == 4) { int q = (int)ph - 128; s = q * (128 - (q < 0 ? -q : q)) / 32; }
            else { uint32_t n = ((phase0 + i * speed) >> 6) * 2654435761U; s = (int)((n >> 24) & 255U) - 128; }
            int y = (int)(Y + H / 2) - s * depth / 128;
            line((int)(X + 2 + i), py, (int)(X + 2 + i), y, GREEN);
            py = y;
        }
        text(X + 4, Y + 3, "PITCH WARBLE", 1, DIM, BACK);
    } else if (haunt_page == HP_GHOST) {
        /* Envelope of the first carrier plus the pitch swoop. */
        unsigned b = op_base(haunt_first_carrier(p));
        int r1 = p[b], r2 = p[b + 1], r4 = p[b + 3], l2 = p[b + 5];
        int a = 4 + (99 - r1) * 60 / 99, d = 4 + (99 - r2) * 40 / 99, rel = 4 + (99 - r4) * 70 / 99;
        int top = (int)Y + 8, base = (int)(Y + H) - 6, sus = base - (base - top) * l2 / 99;
        int x0 = (int)X + 4, x1 = x0 + a, x2 = x1 + d, x3 = (int)(X + W) - 8 - rel, x4 = (int)(X + W) - 8;
        line(x0, base, x1, top, ACCENT); line(x1, top, x2, sus, ACCENT);
        line(x2, sus, x3, sus, ACCENT); line(x3, sus, x4, base, ACCENT);
        int s = haunt_swoop(p);
        line(x0, (int)(Y + H / 2) + s / 2, x1 + 10, (int)(Y + H / 2), 0xab1f);
        line(x1 + 10, (int)(Y + H / 2), x3, (int)(Y + H / 2), 0xab1f);
        line(x3, (int)(Y + H / 2), x4, (int)(Y + H / 2) + s / 2, 0xab1f);
        text(X + 4, Y + 3, "VOLUME", 1, ACCENT, BACK);
        text(X + 52, Y + 3, "PITCH", 1, 0xab1f, BACK);
    } else if (haunt_page == HP_CURSE) {
        /* Six operators: height = output level, colour = role, label = ratio. */
        unsigned car = carriers_of(p);
        for (unsigned n = 0; n < 6; ++n) {
            unsigned b = op_base(n), x = X + 8 + n * 36, h = p[b + 16] * (H - 22) / 99;
            uint16_t c = (car >> n) & 1U ? ACCENT : 0xab1f;
            paint_fill(x, Y + H - 12 - h, 24, h ? h : 1, c);
            char label[12];
            if (p[b + 17]) strcpy(label, "FIX");
            else {
                unsigned coarse = p[b + 18], fine = p[b + 19];
                unsigned hundredths = coarse ? coarse * (100 + fine) : 50 + fine / 2;
                decimal(label, (int)(hundredths / 100), 1); strcat(label, ".");
                char frac[12]; decimal(frac, (int)(hundredths % 100 / 10), 1); strcat(label, frac);
            }
            text(x, Y + H - 10, label, 1, DIM, BACK);
            number(x + 8, Y + 4, (int)n + 1, 1, 1, c, BACK);
        }
        for (unsigned i = 0; i < p[135]; ++i)
            paint_fill(X + W - 10, Y + H - 14 - i * 6, 6, 4, i > 4 ? 0xd8c5 : AMBER);
    } else if (haunt_page == HP_TUNING) {
        struct groove_tuning t; groove_tuning_get(track, &t);
        int mid = (int)(Y + H / 2);
        paint_fill(X + 2, (unsigned)mid, W - 4, 1, PANEL);
        static const char names[] = "CCDDEFFGGAAB";
        for (unsigned k = 0; k < 12; ++k) {
            unsigned x = X + 6 + k * 18;
            int c = t.main[k], h = c * 22 / 127;
            if (h > 0) paint_fill(x, (unsigned)(mid - h), 12, (unsigned)h, ACCENT);
            else if (h < 0) paint_fill(x, (unsigned)mid, 12, (unsigned)-h, ACCENT);
            else paint_fill(x, (unsigned)mid - 1, 12, 3, DIM);
            int ha = t.alt[k] * 22 / 127;
            paint_fill(x + 13, (unsigned)(mid - (ha > 0 ? ha : 0)), 2, (unsigned)(ha < 0 ? -ha : ha) + 1, 0xab1f);
            char n[3] = {names[k], (0x54aU >> k) & 1U ? '#' : 0, 0};
            text(x + 2, Y + H - 9, n, 1, (0x54aU >> k) & 1U ? DIM : TEXT, BACK);
        }
    } else {
        haunt_slot_names();
        unsigned first = haunt_names_slot;
        for (unsigned i = 0; i < 5; ++i) {
            unsigned slot = first + i, y = Y + 4 + i * 10, selected = slot == haunt_slot;
            uint16_t bg = selected ? 0x4129 : BACK;
            paint_fill(X + 2, y - 1, W - 4, 10, bg);
            char label[6] = "U"; decimal(label + 1, (int)slot + 1, 2);
            text(X + 6, y, label, 1, selected ? ACCENT : DIM, bg);
            unsigned empty = !memcmp(haunt_names[i], "USER ", 5);
            text(X + 34, y, empty ? "- EMPTY GRAVE -" : haunt_names[i], 1, empty ? DIM : TEXT, bg);
            if (!empty) sprite(X + W - 16, y - 1, art_skull, ART_SKULL_W, ART_SKULL_H, 1, art_palette);
        }
    }
}
static __attribute__((noinline)) void haunt_draw(void)
{
    if (paint_rendering && paint_top < 30) return;
    const uint8_t *p = frame_patch;
    uint32_t now = frame_time;
    uint32_t title = haunt_page | (track << 4) | (haunt_confirm << 8);
    if (cache->haunt_cache[0] != title) {
        cache->haunt_cache[0] = title;
        paint_fill(0, 31, 240, 13, BACK);
        text(8, 34, "HAUNT LAB", 1, ACCENT, BACK);
        text(68, 34, "T", 1, colors[track], BACK);
        number(74, 34, (int)track + 1, 1, 1, colors[track], BACK);
        char name[11]; memcpy(name, p + 145, 10); name[10] = 0;
        text(88, 34, name, 1, TEXT, BACK);
        unsigned n = (unsigned)strlen(haunt_titles[haunt_page]);
        text(232 - n * 6, 34, haunt_titles[haunt_page], 1, AMBER, BACK);
    }
    /* Pumpkin mood follows how cursed the voice is. */
    int curse = p[135] * 6 + p[139] / 3 + haunt_spread(p) * 3 + (99 - haunt_veil(p)) / 3;
    unsigned face = curse < 30 ? 0 : curse < 70 ? 1 : 2;
    unsigned level = frame_views[track].audible ? frame_views[track].level : 0;
    unsigned glow = candle_flicker(now, 1) + level / 40U;
    uint32_t sig = face | (glow << 2);
    if (cache->haunt_cache[1] != sig) {
        cache->haunt_cache[1] = sig;
        paint_fill(6, 46, 100, 78, BACK);
        big_pumpkin(8, 47, 3, face, glow);
    }
    char values[4][12]; int v[4], high[4];
    for (unsigned c = 0; c < 4; ++c) v[c] = haunt_value(p, c, &high[c], values[c]);
    uint32_t candles = signature((now / 90U), v, sizeof v);
    if (cache->haunt_cache[2] != candles) {
        cache->haunt_cache[2] = candles;
        for (unsigned c = 0; c < 4; ++c) {
            if (haunt_page == HP_VAULT && c >= 2) { paint_fill(116 + c * 29, 48, 24, 75, BACK); continue; }
            haunt_candle(c, v[c], high[c], now);
        }
    }
    uint32_t viz = signature(haunt_page * 977U + (haunt_page == HP_WARBLE ? now / 66U : 0U) + haunt_slot * 31U, p, 145);
    viz = signature(viz, v, sizeof v);
    if (cache->haunt_cache[3] != viz) { cache->haunt_cache[3] = viz; haunt_viz(p, now); }
    if (paint_rendering && paint_top + PAINT_ROWS <= 188) return;
    for (unsigned c = 0; c < 4; ++c) knob(c, haunt_labels[haunt_page][c], values[c], colors[c]);
    if (notice && (int32_t)(frame_time - notice_until) >= 0) notice = NULL;
    const char *hint = notice ? notice : haunt_page == HP_VAULT ? "K1 SLOT  K2 ACTION  SAVE RUN IT"
                     : haunt_page == HP_CURSE ? "TURN K4 TO MUTATE  SELECT PAGE"
                     : "SELECT PAGE  PRESETS VOICE  SEL MORE";
    uint32_t hint_sig = signature(1, hint, (unsigned)strlen(hint));
    if (hint_sig != cache->hint_cache) {
        cache->hint_cache = hint_sig;
        paint_fill(6, 231, 228, 7, BACK);
        text(6, 231, hint, 1, DIM, BACK);
    }
}
