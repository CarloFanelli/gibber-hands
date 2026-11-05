/**
 * Ramp timing for the engine. No Gibber import here, so tests run without the browser bundle.
 */

/** "Start audio" and "Stop audio" fade the volume in or out over this long, in ms. */
export const TOGGLE_RAMP_MS = 30;
/** An exponential ramp never lands on its target: it counts as there once within 1% of it. */
const SETTLED = 0.01;

/** A note change slides over this long while sound plays, in ms. Tuned by ear. */
export const PITCH_SLIDE_MS = 40;
/** Cutoff changes ramp over this long, in ms. Tuned by ear. */
export const CUTOFF_RAMP_MS = 15;
/** A preset switch crossfades the old and the new sound over this long, in ms. */
export const CROSSFADE_MS = 60;
/** The reverb or echo amount glides to a new value over this long, in ms. Tuned by ear. */
export const EFFECT_RAMP_MS = 50;
/**
 * The echo's time glides to a new tempo over this long, in ms: a jump would click. Echoes ringing meanwhile
 * bend in pitch; a shorter glide bends them further. Tuned by ear.
 */
export const ECHO_TIME_RAMP_MS = 250;

/**
 * Length, in samples, of a Gibberish slide that comes within 1% of its target in `ms`. The slide moves
 * 1/length of the remaining way each sample, so 1 jumps at once.
 */
export function slideSamples(ms: number, sampleRate: number): number {
  const samples = (ms / 1000) * sampleRate;
  return Math.max(1, 1 / (1 - SETTLED ** (1 / samples)));
}
