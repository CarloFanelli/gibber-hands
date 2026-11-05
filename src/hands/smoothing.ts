/**
 * One Euro filter for the palm center (Casiez et al., 2012): heavy smoothing when the hand is still,
 * almost none when it moves fast. An EMA steady enough when still would lag 2+ frames when moving.
 */
import type { Point } from './types';

/** Tuned values: cutoff when still (Hz), how fast the cutoff rises with speed, and the speed estimate's cutoff (Hz). */
const MIN_CUTOFF_HZ = 1;
const BETA = 20;
const SPEED_CUTOFF_HZ = 1;

export interface PointFilter {
  /** `t` in milliseconds; must increase between calls. */
  filter(p: Point, t: number): Point;
  /** The next point passes through unfiltered. */
  reset(): void;
}

export function createPointFilter(): PointFilter {
  const x = createOneEuro();
  const y = createOneEuro();
  return {
    filter(p, t) {
      return { x: x.filter(p.x, t), y: y.filter(p.y, t) };
    },
    reset() {
      x.reset();
      y.reset();
    }
  };
}

function createOneEuro() {
  let last: { value: number; speed: number; t: number } | null = null;

  return {
    filter(value: number, t: number) {
      const dt = last ? (t - last.t) / 1000 : 0;
      if (!last || dt <= 0) {
        last = { value, speed: 0, t };
        return value;
      }
      const speed = lowPass(last.speed, (value - last.value) / dt, alpha(SPEED_CUTOFF_HZ, dt));
      const cutoff = MIN_CUTOFF_HZ + BETA * Math.abs(speed);
      last = { value: lowPass(last.value, value, alpha(cutoff, dt)), speed, t };
      return last.value;
    },
    reset() {
      last = null;
    }
  };
}

function alpha(cutoffHz: number, dt: number) {
  const tau = 1 / (2 * Math.PI * cutoffHz);
  return 1 / (1 + tau / dt);
}

function lowPass(previous: number, next: number, a: number) {
  return previous + a * (next - previous);
}
