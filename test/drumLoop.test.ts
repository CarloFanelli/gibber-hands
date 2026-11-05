import { describe, expect, it } from 'vitest';
import { EMPTY_HAND, type HandState } from '../src/hands/types';
import { DRUMS_START, drumsWithEngine, muteDrums, startDrums, steerDrums, toggleDrums, type DrumLoop } from '../src/mapping/drumLoop';
import { SECOND_HAND_START, type SecondHand } from '../src/mapping/shape';

describe('toggleDrums', () => {
  it('starts a first loop of the visit on Rock with 4 drum layers', () => {
    expect(DRUMS_START.playing).toBe(false);
    expect(toggleDrums(DRUMS_START)).toEqual({ playing: true, pattern: 0, layers: 4, muted: false });
  });

  it('stops a playing loop', () => {
    expect(toggleDrums(toggleDrums(DRUMS_START)).playing).toBe(false);
  });

  it('stops a muted loop, and starts it again unmuted', () => {
    const muted: DrumLoop = { playing: true, pattern: 1, layers: 3, muted: true };
    expect(toggleDrums(muted)).toEqual({ playing: false, pattern: 1, layers: 3, muted: false });
    expect(toggleDrums(toggleDrums(muted)).muted).toBe(false);
  });

  it('starts again on the drum pattern and drum layers it last played', () => {
    expect(toggleDrums({ playing: false, pattern: 2, layers: 2, muted: false })).toEqual({ playing: true, pattern: 2, layers: 2, muted: false });
  });
});

describe('startDrums', () => {
  it('starts a stopped loop: Rock with 4 drum layers on a first loop of the visit', () => {
    expect(startDrums(DRUMS_START)).toEqual({ playing: true, pattern: 0, layers: 4, muted: false });
  });

  it('lets a playing loop go on as it is', () => {
    const playing = { playing: true, pattern: 1, layers: 2, muted: false } as const;
    expect(startDrums(playing)).toBe(playing);
  });
});

describe('steerDrums', () => {
  const playing: DrumLoop = { playing: true, pattern: 0, layers: 4, muted: false };
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
    expect(steerDrums({ playing: true, pattern: 0, layers: 1, muted: false }, at(0.33, 0.67))).toEqual({ playing: true, pattern: 0, layers: 1, muted: false });
  });

  it('keeps the loop as it is while the hand is out of view', () => {
    const loop: DrumLoop = { playing: true, pattern: 2, layers: 3, muted: false };
    expect(steerDrums(loop, EMPTY_HAND)).toBe(loop);
  });

  it('keeps the same loop when nothing changes', () => {
    expect(steerDrums(playing, at(0.15, 0.15))).toBe(playing);
  });

  it('steers a muted loop too, so the drum pattern and drum layers under the hand come back with the drums', () => {
    expect(steerDrums({ ...playing, muted: true }, at(0.55, 0.65))).toEqual({ playing: true, pattern: 2, layers: 2, muted: true });
  });
});

describe('muteDrums', () => {
  const playing: DrumLoop = { playing: true, pattern: 1, layers: 3, muted: false };
  const muted: DrumLoop = { ...playing, muted: true };
  const drumMode: SecondHand = { mode: 'drums', lastGesture: 'Closed_Fist' };
  const on = { kind: 'on' } as const;
  const hand = (over: Partial<HandState> = {}): HandState => ({ ...EMPTY_HAND, present: true, palm: { x: 0.35, y: 0.4 }, ...over });
  const fist = hand({ gesture: 'Closed_Fist', gestureScore: 0.9 });

  it('mutes the loop at once while the second hand in drum mode closes its fist, keeping its drum pattern and drum layers', () => {
    expect(muteDrums(playing, fist, drumMode, on)).toEqual(muted);
  });

  it('brings the drums back as the fist opens', () => {
    expect(muteDrums(muted, hand(), drumMode, on)).toEqual(playing);
  });

  it('ends the mute when the hand leaves the view', () => {
    expect(muteDrums(muted, EMPTY_HAND, drumMode, on)).toEqual(playing);
  });

  it('leaves the drums alone under a fist out of drum mode, which silences notes instead', () => {
    for (const mode of ['notes', 'shape'] as const) {
      expect(muteDrums(playing, fist, { ...SECOND_HAND_START, mode }, on)).toBe(playing);
      expect(muteDrums(muted, fist, { ...SECOND_HAND_START, mode }, on)).toEqual(playing);
    }
  });

  it('does not mute on a squeeze: only the fist mutes', () => {
    expect(muteDrums(playing, hand({ pinch: 0, pinchMiddle: 0 }), drumMode, on)).toBe(playing);
  });

  it('leaves a stopped loop stopped and unmuted under a fist', () => {
    const stopped: DrumLoop = { ...playing, playing: false };
    expect(muteDrums(stopped, fist, drumMode, on)).toBe(stopped);
  });

  it('mutes nothing while audio is not on', () => {
    for (const kind of ['off', 'starting'] as const) expect(muteDrums(playing, fist, drumMode, { kind })).toBe(playing);
  });

  it('keeps the same loop while the fist stays closed', () => {
    expect(muteDrums(muted, fist, drumMode, on)).toBe(muted);
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

  it('ends the mute when audio stops, so "Start audio" brings the drums back unmuted', () => {
    const muted = { ...playing, muted: true };
    for (const kind of ['off', 'starting'] as const) expect(drumsWithEngine(muted, { kind })).toEqual(playing);
    expect(drumsWithEngine(muted, { kind: 'on' })).toBe(muted);
  });

  it('stops and unmutes a muted loop when the audio engine fails', () => {
    const failed = drumsWithEngine({ ...playing, muted: true }, { kind: 'failed', failure: { reason: 'network' } });
    expect(failed).toEqual({ ...playing, playing: false });
  });

  it('leaves a stopped loop stopped', () => {
    expect(drumsWithEngine(DRUMS_START, { kind: 'on' })).toBe(DRUMS_START);
  });
});
