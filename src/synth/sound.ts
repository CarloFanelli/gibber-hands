/**
 * The fixed settings of the sound, shared by the engine and the live code snippet. No Gibber import
 * here, so the snippet and its tests run without the browser bundle.
 */

/**
 * Output gain at full volume. Measured over every note and cutoff: the loudest, C4 at 6.4 kHz, peaks
 * at about −6 dBFS, 3 dB under the −3 dBFS limit.
 */
export const FULL_VOLUME = 1.4;
/** Filter resonance in Gibberish's ladder model (0..1): clearly resonant, well short of self-oscillation. */
export const RESONANCE = 0.5;
/** Gibberish's Freeverb: `wet1` is the reverb, `wet2` the other channel's reverb, `dry` the voice itself. */
export const REVERB = { wet1: 0.3, wet2: 0, dry: 0.7 };
