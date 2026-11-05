import { describe, expect, it } from 'vitest';
import { CUTOFF_RAMP_MS, EFFECT_RAMP_MS, PITCH_SLIDE_MS, TOGGLE_RAMP_MS, slideSamples } from '../src/synth/ramp';

describe('slideSamples', () => {
  /** Share of the step a one-pole slide of `n` samples still has left after `samples` samples. */
  const leftAfterSamples = (samples: number, n: number) => (1 - 1 / n) ** samples;

  it('slides a note over 40 ms, ramps the cutoff over 15 ms and the effect amount over 50 ms', () => {
    expect([PITCH_SLIDE_MS, CUTOFF_RAMP_MS, EFFECT_RAMP_MS]).toEqual([40, 15, 50]);
  });

  it('comes within 1% of the target in the given time, not before', () => {
    // The volume ramps too: squeeze 15 ms, Start and Stop 30 ms, a fist 30 ms, a lost hand 100 ms.
    for (const ms of [CUTOFF_RAMP_MS, PITCH_SLIDE_MS, TOGGLE_RAMP_MS, EFFECT_RAMP_MS, 100]) {
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
