import { describe, expect, it } from 'vitest';
import { DRUM_PATTERNS, STEPS, drumSteps, stepSamples, type Drum } from '../src/synth/drumPatterns';

const ROCK = DRUM_PATTERNS[0]!;

/** The steps where `drum` plays, with `layers` drum layers playing. */
function stepsOf(drum: Drum, layers: 1 | 2 | 3 | 4): number[] {
  return drumSteps(ROCK, layers).flatMap((hits, step) => (hits.some((h) => h.drum === drum) ? [step] : []));
}

describe('DRUM_PATTERNS', () => {
  it('starts with Rock at 110 BPM', () => {
    expect([ROCK.name, ROCK.bpm]).toEqual(['Rock', 110]);
  });

  it('writes each part with one mark per step of the bar', () => {
    for (const { parts } of DRUM_PATTERNS) for (const { steps } of parts) expect(steps).toMatch(new RegExp(`^[xo.]{${STEPS}}$`));
  });
});

describe('drumSteps', () => {
  it('splits a 4/4 bar into sixteenths', () => {
    expect(STEPS).toBe(16);
    for (const layers of [1, 2, 3, 4] as const) expect(drumSteps(ROCK, layers)).toHaveLength(STEPS);
  });

  it('plays only the kick with 1 drum layer', () => {
    expect(stepsOf('kick', 1)).toEqual([0, 8]);
    expect(drumSteps(ROCK, 1).flat().every((h) => h.drum === 'kick')).toBe(true);
  });

  it('adds the snare on 2 and 4 with 2 drum layers', () => {
    expect(stepsOf('kick', 2)).toEqual([0, 8]);
    expect(stepsOf('snare', 2)).toEqual([4, 12]);
    expect(stepsOf('hat', 2)).toEqual([]);
  });

  it('adds eighth-note closed hi-hats with 3 drum layers', () => {
    expect(stepsOf('hat', 3)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(stepsOf('snare', 3)).toEqual([4, 12]);
  });

  it('plays the full pattern with 4 drum layers: everything of 3 layers, and its extra hits', () => {
    const three = drumSteps(ROCK, 3);
    const four = drumSteps(ROCK, 4);
    three.forEach((hits, step) => expect(four[step]).toEqual(expect.arrayContaining(hits)));
    expect(four.flat().length).toBeGreaterThan(three.flat().length);
  });

  it('gives every hit a loudness between 0 and 1', () => {
    for (const h of drumSteps(ROCK, 4).flat()) {
      expect(h.loudness).toBeGreaterThan(0);
      expect(h.loudness).toBeLessThanOrEqual(1);
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
