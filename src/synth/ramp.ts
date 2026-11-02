/**
 * Ramp timing for the engine. No Gibber import here, so tests run without the browser bundle.
 */

/** "Start audio" and "Stop audio" fade the volume in or out over this long, in ms. */
export const TOGGLE_RAMP_MS = 30;
/** An exponential ramp never lands on its target: it counts as there once within 1% of it. */
const SETTLED = 0.01;

/** Time constant, in seconds, of an exponential ramp that comes within 1% of its target in `ms`. */
export function rampTimeConstant(ms: number): number {
  return ms / 1000 / Math.log(1 / SETTLED);
}
