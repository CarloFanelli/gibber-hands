import { describe, expect, it } from 'vitest';
import { DRUMS_START, drumsWithEngine, startDrums, toggleDrums } from '../src/mapping/drumLoop';

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

describe('startDrums', () => {
  it('starts a stopped loop: Rock with 4 drum layers on a first loop of the visit', () => {
    expect(startDrums(DRUMS_START)).toEqual({ playing: true, pattern: 0, layers: 4 });
  });

  it('lets a playing loop go on as it is', () => {
    const playing = { playing: true, pattern: 1, layers: 2 } as const;
    expect(startDrums(playing)).toBe(playing);
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
