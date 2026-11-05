import { describe, expect, it } from 'vitest';
import { EMPTY_HAND, type HandState } from '../src/hands/types';
import { DRUMS_START, drumsWithEngine, startDrums, steerDrums, toggleDrums, type DrumLoop } from '../src/mapping/drumLoop';

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

describe('steerDrums', () => {
  const playing: DrumLoop = { playing: true, pattern: 0, layers: 4 };
  /** The second hand in drum mode, its palm center at (x, y) of the view. */
  const at = (x: number, y: number): HandState => ({ ...EMPTY_HAND, present: true, palm: { x, y } });

  it('picks the drum pattern under the palm center: Rock, House, Hip-hop, Breakbeat, left to right', () => {
    expect([0.15, 0.35, 0.55, 0.85].map((x) => steerDrums(playing, at(x, 0.15)).pattern)).toEqual([0, 1, 2, 3]);
  });

  it('gives Rock left of the playing zone and Breakbeat right of it', () => {
    expect(steerDrums(playing, at(0.02, 0.5)).pattern).toBe(0);
    expect(steerDrums(playing, at(0.98, 0.5)).pattern).toBe(3);
  });

  it('sets 1 to 4 drum layers from the bottom of the playing zone to its top, and 1 or 4 below or above it', () => {
    expect([0.98, 0.85, 0.65, 0.45, 0.15, 0.02].map((y) => steerDrums(playing, at(0.15, y)).layers)).toEqual([1, 1, 2, 3, 4, 4]);
  });

  it('holds the drum pattern and drum layers until the hand is 20% of a band past their border', () => {
    expect(steerDrums({ playing: true, pattern: 0, layers: 1 }, at(0.33, 0.67))).toEqual({ playing: true, pattern: 0, layers: 1 });
  });

  it('keeps the loop as it is while the hand is out of view', () => {
    const loop: DrumLoop = { playing: true, pattern: 2, layers: 3 };
    expect(steerDrums(loop, EMPTY_HAND)).toBe(loop);
  });

  it('keeps the same loop when nothing changes', () => {
    expect(steerDrums(playing, at(0.15, 0.15))).toBe(playing);
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
