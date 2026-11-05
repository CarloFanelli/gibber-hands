import { describe, expect, it } from 'vitest';
import { DRUM_PATTERNS, STEPS, drumSteps, stepSamples, type Drum, type DrumLayers, type DrumPattern } from '../src/synth/drumPatterns';

const [ROCK, HOUSE, HIP_HOP, BREAKBEAT] = DRUM_PATTERNS as [DrumPattern, DrumPattern, DrumPattern, DrumPattern];
const LAYERS = [1, 2, 3, 4] as const;
/** The beats of a bar, as steps. */
const BEATS = [0, 4, 8, 12];

/** The steps where `drum` plays in `pattern`, with `layers` drum layers playing. */
function stepsOf(pattern: DrumPattern, drum: Drum, layers: DrumLayers): number[] {
  return drumSteps(pattern, layers).flatMap((hits, step) => (hits.some((h) => h.drum === drum) ? [step] : []));
}
/** The drums heard in `pattern` with `layers` drum layers playing. */
const drumsOf = (pattern: DrumPattern, layers: DrumLayers) => new Set(drumSteps(pattern, layers).flat().map((h) => h.drum));

describe('DRUM_PATTERNS', () => {
  it('lists Rock, House, Hip-hop and Breakbeat, left to right, each at its own tempo', () => {
    expect(DRUM_PATTERNS.map((p) => [p.name, p.bpm])).toEqual([
      ['Rock', 110],
      ['House', 124],
      ['Hip-hop', 90],
      ['Breakbeat', 130]
    ]);
  });

  it('writes each part with one mark per step of the bar', () => {
    for (const { parts } of DRUM_PATTERNS) for (const { steps } of parts) expect(steps).toMatch(new RegExp(`^[xo.]{${STEPS}}$`));
  });

  it('plays Rock with the snare on 2 and 4 and eighth-note hi-hats', () => {
    expect(stepsOf(ROCK, 'snare', 2)).toEqual([4, 12]);
    expect(stepsOf(ROCK, 'hat', 3)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
  });

  it('plays House with the kick on every beat and an off-beat open hi-hat', () => {
    expect(stepsOf(HOUSE, 'kick', 1)).toEqual(BEATS);
    expect(stepsOf(HOUSE, 'openHat', 4)).toEqual([2, 6, 10, 14]);
  });

  it('plays Hip-hop with busier hi-hats than Rock', () => {
    expect(stepsOf(HIP_HOP, 'hat', 4).length).toBeGreaterThan(stepsOf(ROCK, 'hat', 4).length);
  });

  it('plays Breakbeat with the kick and the snare off the beat too', () => {
    expect(stepsOf(BREAKBEAT, 'kick', 1).some((step) => !BEATS.includes(step))).toBe(true);
    expect(stepsOf(BREAKBEAT, 'snare', 2).some((step) => !BEATS.includes(step))).toBe(true);
  });
});

describe('drumSteps', () => {
  it('splits a 4/4 bar into sixteenths', () => {
    expect(STEPS).toBe(16);
    for (const pattern of DRUM_PATTERNS) for (const layers of LAYERS) expect(drumSteps(pattern, layers)).toHaveLength(STEPS);
  });

  it('adds the drums in order, layer by layer: kick, snare, closed hi-hat', () => {
    for (const pattern of DRUM_PATTERNS) {
      expect(drumsOf(pattern, 1)).toEqual(new Set(['kick']));
      expect(drumsOf(pattern, 2)).toEqual(new Set(['kick', 'snare']));
      expect(drumsOf(pattern, 3)).toEqual(new Set(['kick', 'snare', 'hat']));
    }
  });

  it('plays the full pattern with 4 drum layers: everything of 3 layers, and its extra hits', () => {
    for (const pattern of DRUM_PATTERNS) {
      const three = drumSteps(pattern, 3);
      const four = drumSteps(pattern, 4);
      three.forEach((hits, step) => expect(four[step]).toEqual(expect.arrayContaining(hits)));
      expect(four.flat().length).toBeGreaterThan(three.flat().length);
    }
  });

  it('gives every hit a loudness between 0 and 1', () => {
    for (const pattern of DRUM_PATTERNS) {
      for (const h of drumSteps(pattern, 4).flat()) {
        expect(h.loudness).toBeGreaterThan(0);
        expect(h.loudness).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('stepSamples', () => {
  it('is a sixteenth note at the tempo, in samples, unrounded', () => {
    // At 110 BPM a beat lasts 60/110 s, and a sixteenth a quarter of it.
    expect(stepSamples(110, 48_000)).toBeCloseTo((60 / 110 / 4) * 48_000, 9);
    expect(stepSamples(120, 44_100)).toBe(5512.5);
  });
});
