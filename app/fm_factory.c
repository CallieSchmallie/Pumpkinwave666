/* SPDX-License-Identifier: GPL-3.0-only WITH GPL-3.0-linking-exception */
#include "fm_patch.h"
#include "fm_factory.inc"

/* Expand once during startup, before the audio owners are running. MIDI
 * program changes then read SRAM without decompression or heap allocation. */
static uint8_t factory_raw[FM1_FM_PROGRAMS*128];
static unsigned factory_ready;
/* PumpkinWave: the bank is encoded byte-column first (byte k of all 128
 * voices, then byte k+1), which packs similar parameters together. Stream
 * position i is voice i%128, byte i/128: swap the two 7-bit halves. */
#define FACTORY_AT(i) (factory_raw[(((i) & 127U) << 7) | ((i) >> 7)])
static FM1_DSP_CODE void factory_init(void)
{
    if (factory_ready) return;
    unsigned i=0;
    for (unsigned at=0;at<sizeof factory_packed;) {
        unsigned token=factory_packed[at++];
        if (token<128) { FACTORY_AT(i)=(uint8_t)token; ++i; }
        else {
            unsigned low=factory_packed[at++],distance=low&127U;
            if (low&128U) distance|=(unsigned)factory_packed[at++]<<7;
            for (unsigned n=token-128+3;n;--n,++i) FACTORY_AT(i)=FACTORY_AT(i-distance);
        }
    }
    factory_ready=1;
}
FM1_DSP_CODE const uint8_t *groove_fm_factory_raw(unsigned program)
{
    factory_init();
    return factory_raw+(program%FM1_FM_PROGRAMS)*128;
}
FM1_DSP_CODE void groove_fm_factory(uint8_t p[156], unsigned program)
{
    groove_fm_unpack(p,groove_fm_factory_raw(program));
}
