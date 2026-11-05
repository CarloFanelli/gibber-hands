import { describe, expect, it } from 'vitest';
import { DRUMS_START, drumsWithEngine, stepLayers, stepPattern, toggleDrums, type DrumLoop } from '../src/mapping/drumLoop';

describe('toggleDrums', () => {
  it('starts a first loop of the visit on Rock with 4 drum layers', () => {
    expect(DRUMS_START.playing).toBe(false);
    expect(toggleDrums(DRUMS_START)).toEqual({ playing: true, pattern: 0, layers: 4 });
  });

  it('stops a playing loop', () => {
    expect(toggleDrums(toggleDrums(DRUMS_START)).playing).toBe(false);
  });

  it('starts again on the drum pattern and drum layers it last played', () => {
    expect(toggleDrums({ playing: false, pattern: 2, layers: 2 })).toEqual({ playing: true, pattern: 2, layers: 2 });
  });
});

describe('stepPattern', () => {
  const at = (pattern: number): DrumLoop => ({ playing: true, pattern, layers: 3 });

  it('steps to the next drum pattern: Rock, House, Hip-hop, Breakbeat', () => {
    expect([0, 1, 2].map((p) => stepPattern(at(p), 1).pattern)).toEqual([1, 2, 3]);
  });

  it('steps to the previous drum pattern', () => {
    expect([3, 2, 1].map((p) => stepPattern(at(p), -1).pattern)).toEqual([2, 1, 0]);
  });

  it('wraps from Breakbeat to Rock, and back from Rock to Breakbeat', () => {
    expect(stepPattern(at(3), 1).pattern).toBe(0);
    expect(stepPattern(at(0), -1).pattern).toBe(3);
  });

  it('keeps the drum layers, and steps a stopped loop too without starting it', () => {
    expect(stepPattern({ playing: false, pattern: 0, layers: 2 }, 1)).toEqual({ playing: false, pattern: 1, layers: 2 });
  });
});

describe('stepLayers', () => {
  const withLayers = (layers: 1 | 2 | 3 | 4): DrumLoop => ({ playing: true, pattern: 1, layers });

  it('adds or removes one drum layer', () => {
    expect(stepLayers(withLayers(2), 1).layers).toBe(3);
    expect(stepLayers(withLayers(2), -1).layers).toBe(1);
  });

  it('keeps the same loop below 1 or above 4 drum layers', () => {
    const one = withLayers(1), four = withLayers(4);
    expect(stepLayers(one, -1)).toBe(one);
    expect(stepLayers(four, 1)).toBe(four);
  });

  it('keeps the drum pattern, and steps a stopped loop too without starting it', () => {
    expect(stepLayers({ playing: false, pattern: 3, layers: 4 }, -1)).toEqual({ playing: false, pattern: 3, layers: 3 });
  });
});

describe('drumsWithEngine', () => {
  const playing = toggleDrums(DRUMS_START);

  it('stops the loop when the audio engine fails to start', () => {
    expect(drumsWithEngine(playing, { kind: 'failed', failure: { reason: 'network' } })).toEqual({ ...playing, playing: false });
  });

  it('keeps the loop while audio is off, so "Start audio" brings it back', () => {
    for (const kind of ['off', 'starting', 'on'] as const) expect(drumsWithEngine(playing, { kind })).toBe(playing);
  });

  it('leaves a stopped loop stopped', () => {
    expect(drumsWithEngine(DRUMS_START, { kind: 'on' })).toBe(DRUMS_START);
  });
});
