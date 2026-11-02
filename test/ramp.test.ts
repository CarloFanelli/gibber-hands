import { describe, expect, it } from 'vitest';
import { rampTimeConstant } from '../src/synth/ramp';

/** Share of the step still left `ms` after an exponential ramp with time constant `tau` (seconds) began. */
const leftAfter = (ms: number, tau: number) => Math.exp(-ms / 1000 / tau);

describe('rampTimeConstant', () => {
  it('comes within 1% of the target in the given time, not before', () => {
    for (const ms of [15, 30, 100]) {
      const tau = rampTimeConstant(ms);
      expect(leftAfter(ms, tau)).toBeCloseTo(0.01, 10);
      expect(leftAfter(ms * 0.9, tau)).toBeGreaterThan(0.01);
    }
  });
});
