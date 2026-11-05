import { describe, it, expect } from 'vitest';
import { laneCount, mapHandToSynth, type SynthParams } from '../src/mapping/handToSynth';
import { noteFrequency } from '../src/mapping/notes';
import { EMPTY_HAND, type HandState } from '../src/hands/types';
import { PRESETS } from '../src/synth/presets';
import { INITIAL_SLIDERS, sliderHandState } from '../src/ui/sliders';

/** The first `count` note lanes of a preset: 8 is what a laptop's default layout plays. */
const first = (preset: number, count: number) => PRESETS[preset]!.lanes.slice(0, count);
const SAW_LEAD = first(0, 8);
const ORGAN = first(2, 8);
/** Maps with Saw Lead's note lanes unless told otherwise. */
const map = (s: HandState, previous: SynthParams | null, lanes = SAW_LEAD) => mapHandToSynth(s, previous, lanes);

const hand = (over: Partial<HandState>): HandState => ({ ...EMPTY_HAND, present: true, ...over });
const at = (x: number, y = 0.5): HandState => hand({ palm: { x, y } });
/** Plays the palm positions in order, each frame remembering the one before, and returns the lanes. */
function lanes(xs: number[], previous: SynthParams | null = null): (number | null)[] {
  return xs.map((x) => (previous = map(at(x), previous)).lane);
}

describe('mapHandToSynth volume', () => {
  it('is full at pinch 0.2 or less', () => {
    expect(map(hand({ pinch: 0.2 }), null).amp).toBe(1);
    expect(map(hand({ pinch: 0 }), null).amp).toBe(1);
  });

  it('is silent at pinch 0.5 or more', () => {
    expect(map(hand({ pinch: 0.5 }), null).amp).toBe(0);
    expect(map(hand({ pinch: 1 }), null).amp).toBe(0);
  });

  it('grows with the square of how far the fingers have closed', () => {
    expect(map(hand({ pinch: 0.35 }), null).amp).toBeCloseTo(0.25, 10);
    expect(map(hand({ pinch: 0.44 }), null).amp).toBeCloseTo(0.04, 10);
  });

  it('ramps pinch changes over 15 ms', () => {
    expect(map(hand({ pinch: 0.3 }), null).ampRampMs).toBe(15);
  });
});

describe('mapHandToSynth silence', () => {
  it('fades to silence within 30 ms on a closed fist, whatever the pinch', () => {
    const p = map(hand({ pinch: 0, gesture: 'Closed_Fist', gestureScore: 0.9 }), null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });

  it('restores the pinch volume once the fist opens', () => {
    expect(map(hand({ pinch: 0, gesture: 'Open_Palm' }), null).amp).toBe(1);
  });

  it('fades to silence over 100 ms when the hand is lost', () => {
    const p = map({ ...EMPTY_HAND, pinch: 0 }, null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(100);
  });
});

describe('mapHandToSynth with the sliders', () => {
  it('is silent with the sliders at rest', () => {
    expect(map(sliderHandState(INITIAL_SLIDERS, 0), null).amp).toBe(0);
  });

  it('plays at full volume with the pinch slider at 0', () => {
    expect(map(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0 }, 0), null).amp).toBe(1);
  });

  it('silences the closed fist picked in the gesture menu', () => {
    const p = map(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0, gesture: 'Closed_Fist' }, 0), null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });

  it('plays the outer lanes at the slider ends', () => {
    const lane = (x: number) => map(sliderHandState({ ...INITIAL_SLIDERS, x }, 0), null).lane;
    expect([lane(0), lane(1)]).toEqual([0, 7]);
  });

  it('keeps the note when the slider steps by 0.01 around a border', () => {
    let p: SynthParams | null = null;
    const steps = [0.49, 0.5, 0.51, 0.5, 0.49].map((x) => (p = map(sliderHandState({ ...INITIAL_SLIDERS, x }, 0), p)));
    expect(steps.map((step) => step.lane)).toEqual([3, 3, 3, 3, 3]);
  });
});

describe('mapHandToSynth note lanes', () => {
  it('plays the note lanes it is given: with Saw Lead, A minor pentatonic from A3 to D5', () => {
    const played = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((x) => map(at(x), null).frequency);
    const expected = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    played.forEach((f, i) => expect(f).toBeCloseTo(expected[i]!, 2));
  });

  it('plays another preset’s note in the same lane', () => {
    expect([0.15, 0.45, 0.85].map((x) => map(at(x), null, ORGAN).frequency)).toEqual([ORGAN[0]!.frequency, ORGAN[3]!.frequency, ORGAN[7]!.frequency]);
  });

  it('keeps the note lane being played when the preset changes, playing the new preset’s note there', () => {
    // Just past a border: a fresh mapping picks lane 4, but lane 3 holds while it is played.
    const before = map(at(0.51), map(at(0.45), null));
    const after = map(at(0.51), before, ORGAN);
    expect([before.lane, after.lane]).toEqual([3, 3]);
    expect(after.frequency).toBe(ORGAN[3]!.frequency);
  });

  it('names a note of the new preset when the preset changes with no hand in view, keeping the brightness', () => {
    // Saw Lead's A3 is not one of Organ's notes; the lane under the resting palm center gives one.
    const lost = map(EMPTY_HAND, map(at(0.15, 0.2), null));
    const after = map(EMPTY_HAND, lost, ORGAN);
    expect(ORGAN.map((n) => n.frequency)).toContain(after.frequency);
    expect(after.frequency).toBe(map(at(EMPTY_HAND.palm.x), null, ORGAN).frequency);
    expect([after.lane, after.amp, after.cutoff]).toEqual([null, 0, lost.cutoff]);
  });

  it('divides the central 80% of the width into 8 equal lanes', () => {
    expect(lanes([0.1, 0.199], null).at(-1)).toBe(0);
    expect([0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((x) => map(at(x), null).lane)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('plays the nearest outer lane beyond either side', () => {
    expect([0, 0.05, 0.95, 1].map((x) => map(at(x), null).lane)).toEqual([0, 0, 7, 7]);
  });

  it('plays the lane to the right of a border the palm starts exactly on', () => {
    expect([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((x) => map(at(x), null).lane)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('changes the note only past a border by more than 20% of a lane', () => {
    expect(lanes([0.45, 0.519])).toEqual([3, 3]);
    expect(lanes([0.45, 0.521])).toEqual([3, 4]);
    expect(lanes([0.55, 0.481])).toEqual([4, 4]);
    expect(lanes([0.55, 0.479])).toEqual([4, 3]);
  });

  it('keeps the note while the palm wobbles 1% of the width around a border', () => {
    expect(lanes([0.45, 0.51, 0.49, 0.51, 0.49])).toEqual([3, 3, 3, 3, 3]);
  });

  it('goes straight to the lane under the palm when it crosses two lanes in one frame', () => {
    expect(lanes([0.25, 0.65])).toEqual([1, 5]);
  });

  it('forgets the lane when the hand is lost, so the palm picks it again without hysteresis', () => {
    const before = map(at(0.45), null);
    const lost = map(EMPTY_HAND, before);
    expect(lost.lane).toBeNull();
    expect(map(at(0.51), lost).lane).toBe(4);
  });
});

describe('laneCount', () => {
  it('gives one note lane per 80 px of playing zone, rounded down', () => {
    expect([719, 720, 799, 800, 1279].map((px) => laneCount(px))).toEqual([8, 9, 9, 10, 15]);
  });

  it('holds 8 to 16 lanes', () => {
    expect([0, 500, 639, 1280, 4000].map((px) => laneCount(px))).toEqual([8, 8, 8, 16, 16]);
  });

  it('holds 8 without a camera picture', () => {
    expect(laneCount(null)).toBe(8);
  });
});

describe('mapHandToSynth with more note lanes', () => {
  it('divides the playing zone into one lane per note it is given, the extra ones carrying on the scale', () => {
    const eleven = first(0, 11);
    const centers = eleven.map((_, i) => 0.1 + ((i + 0.5) * 0.8) / 11);
    expect(centers.map((x) => map(at(x), null, eleven).lane)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(centers.slice(8).map((x) => map(at(x), null, eleven).frequency)).toEqual(['E5', 'G5', 'A5'].map(noteFrequency));
  });

  it('plays the top lane at the right edge with 16 lanes', () => {
    expect(map(at(0.9), null, first(1, 16))).toMatchObject({ lane: 15, frequency: noteFrequency('C7') });
  });

  it('holds the lane being played after the count changes, until the palm center is 20% of a lane past its border', () => {
    // With 9 lanes, 0.55 lies 6% of a lane past lane 4's right border, and 0.57 29%.
    const eight = map(at(0.55), null);
    expect(map(at(0.55), eight, first(0, 9)).lane).toBe(4);
    expect(map(at(0.57), eight, first(0, 9)).lane).toBe(5);
  });

  it('plays the lane under the palm center when the lane being played is gone', () => {
    const nine = map(at(0.9), null, first(0, 9));
    expect(nine.lane).toBe(8);
    expect(map(at(0.9), nine)).toMatchObject({ lane: 7, frequency: SAW_LEAD[7]!.frequency });
  });
});

describe('mapHandToSynth brightness', () => {
  const cutoff = (y: number) => map(at(0.5, y), null).cutoff;

  it('runs exponentially from 200 Hz at the bottom of the playing zone to 6.4 kHz at its top', () => {
    expect(cutoff(0.9)).toBeCloseTo(200, 6);
    expect(cutoff(0.7)).toBeCloseTo(200 * 32 ** 0.25, 6);
    expect(cutoff(0.5)).toBeCloseTo(200 * 32 ** 0.5, 6);
    expect(cutoff(0.1)).toBeCloseTo(6400, 6);
  });

  it('stays at the nearest edge outside the playing zone', () => {
    expect(cutoff(1)).toBeCloseTo(200, 6);
    expect(cutoff(0)).toBeCloseTo(6400, 6);
  });

  it('keeps the note and the brightness while the sound fades after the hand is lost', () => {
    const before = map(at(0.85, 0.2), null);
    const lost = map(EMPTY_HAND, before);
    expect([lost.frequency, lost.cutoff]).toEqual([before.frequency, before.cutoff]);
  });
});

describe('mapHandToSynth octave', () => {
  const up = (s: HandState, previous: SynthParams | null) => mapHandToSynth(s, previous, SAW_LEAD, 1);

  it('plays the same lane one octave up, twice as bright, when the octave is raised', () => {
    const normal = map(at(0.85, 0.4), null);
    const raised = up(at(0.85, 0.4), null);
    expect([raised.lane, raised.octave, normal.octave]).toEqual([normal.lane, 1, 0]);
    expect(raised.frequency).toBe(normal.frequency * 2);
    expect(raised.cutoff).toBeCloseTo(normal.cutoff * 2, 9);
  });

  it('runs the brightness from 400 Hz to 12.8 kHz with the octave raised', () => {
    expect(up(at(0.5, 0.9), null).cutoff).toBeCloseTo(400, 9);
    expect(up(at(0.5, 0.1), null).cutoff).toBeCloseTo(12_800, 9);
  });

  it('keeps the note while a lost hand fades, in the octave being played', () => {
    const playing = up(at(0.85), null);
    expect(up(EMPTY_HAND, playing)).toMatchObject({ frequency: playing.frequency, cutoff: playing.cutoff, octave: 1 });
    expect(map(EMPTY_HAND, playing)).toMatchObject({ frequency: playing.frequency / 2, cutoff: playing.cutoff / 2, octave: 0 });
  });
});
