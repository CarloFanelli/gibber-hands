import { describe, expect, it } from 'vitest';
import { rampTimeConstant, slideSamples } from '../src/synth/ramp';

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

describe('slideSamples', () => {
  /** Share of the step a one-pole slide of `n` samples still has left after `samples` samples. */
  const leftAfterSamples = (samples: number, n: number) => (1 - 1 / n) ** samples;

  it('comes within 1% of the target in the given time, not before', () => {
    for (const ms of [15, 40]) {
      const n = slideSamples(ms, 48_000);
      const samples = (ms / 1000) * 48_000;
      expect(leftAfterSamples(samples, n)).toBeCloseTo(0.01, 10);
      expect(leftAfterSamples(samples * 0.9, n)).toBeGreaterThan(0.01);
    }
  });

  it('jumps at once for 0 ms', () => {
    expect(slideSamples(0, 44_100)).toBe(1);
  });
});
