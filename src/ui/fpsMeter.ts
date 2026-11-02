/**
 * Tracking frame rate, counted over one-second windows. No reading until a full second has passed,
 * and again after frames stopped for longer than that (background tab, camera lost).
 */

const WINDOW_MS = 1000;

export interface FpsMeter {
  /** Called once per processed frame; returns frames per second, or null when there is no reading yet. */
  tick(t: number): number | null;
}

export function createFpsMeter(): FpsMeter {
  let windowStart = 0;
  let frames = 0;
  let lastTick = Number.NEGATIVE_INFINITY;
  let reading: number | null = null;

  return {
    tick(t) {
      if (t - lastTick > WINDOW_MS) {
        windowStart = t;
        frames = 0;
        reading = null;
      }
      lastTick = t;
      frames++;
      if (t - windowStart >= WINDOW_MS) {
        reading = Math.round(((frames - 1) * 1000) / (t - windowStart));
        windowStart = t;
        frames = 1;
      }
      return reading;
    }
  };
}
