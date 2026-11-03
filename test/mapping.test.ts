import { describe, it, expect } from 'vitest';
import { NOTE_LANES, mapHandToSynth, type SynthParams } from '../src/mapping/handToSynth';
import { EMPTY_HAND, type HandState } from '../src/hands/types';
import { INITIAL_SLIDERS, sliderHandState } from '../src/ui/sliders';

const hand = (over: Partial<HandState>): HandState => ({ ...EMPTY_HAND, present: true, ...over });
const at = (x: number, y = 0.5): HandState => hand({ palm: { x, y } });
/** Plays the palm positions in order, each frame remembering the one before, and returns the lanes. */
function lanes(xs: number[], previous: SynthParams | null = null): (number | null)[] {
  return xs.map((x) => (previous = mapHandToSynth(at(x), previous)).lane);
}

describe('mapHandToSynth volume', () => {
  it('is full at pinch 0.2 or less', () => {
    expect(mapHandToSynth(hand({ pinch: 0.2 }), null).amp).toBe(1);
    expect(mapHandToSynth(hand({ pinch: 0 }), null).amp).toBe(1);
  });

  it('is silent at pinch 0.5 or more', () => {
    expect(mapHandToSynth(hand({ pinch: 0.5 }), null).amp).toBe(0);
    expect(mapHandToSynth(hand({ pinch: 1 }), null).amp).toBe(0);
  });

  it('grows with the square of how far the fingers have closed', () => {
    expect(mapHandToSynth(hand({ pinch: 0.35 }), null).amp).toBeCloseTo(0.25, 10);
    expect(mapHandToSynth(hand({ pinch: 0.44 }), null).amp).toBeCloseTo(0.04, 10);
  });

  it('ramps pinch changes over 15 ms', () => {
    expect(mapHandToSynth(hand({ pinch: 0.3 }), null).ampRampMs).toBe(15);
  });
});

describe('mapHandToSynth silence', () => {
  it('fades to silence within 30 ms on a closed fist, whatever the pinch', () => {
    const p = mapHandToSynth(hand({ pinch: 0, gesture: 'Closed_Fist', gestureScore: 0.9 }), null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });

  it('restores the pinch volume once the fist opens', () => {
    expect(mapHandToSynth(hand({ pinch: 0, gesture: 'Open_Palm' }), null).amp).toBe(1);
  });

  it('fades to silence over 100 ms when the hand is lost', () => {
    const p = mapHandToSynth({ ...EMPTY_HAND, pinch: 0 }, null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(100);
  });
});

describe('mapHandToSynth with the sliders', () => {
  it('is silent with the sliders at rest', () => {
    expect(mapHandToSynth(sliderHandState(INITIAL_SLIDERS, 0), null).amp).toBe(0);
  });

  it('plays at full volume with the pinch slider at 0', () => {
    expect(mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0 }, 0), null).amp).toBe(1);
  });

  it('silences the closed fist picked in the gesture menu', () => {
    const p = mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0, gesture: 'Closed_Fist' }, 0), null);
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });

  it('plays the outer lanes at the slider ends', () => {
    const lane = (x: number) => mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, x }, 0), null).lane;
    expect([lane(0), lane(1)]).toEqual([0, 7]);
  });

  it('keeps the note when the slider steps by 0.01 around a border', () => {
    let p: SynthParams | null = null;
    const steps = [0.49, 0.5, 0.51, 0.5, 0.49].map((x) => (p = mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, x }, 0), p)));
    expect(steps.map((step) => step.lane)).toEqual([3, 3, 3, 3, 3]);
  });
});

describe('mapHandToSynth note lanes', () => {
  it('plays A minor pentatonic from A3 to D5 across 8 lanes, A4 = 440 Hz', () => {
    expect(NOTE_LANES.map((n) => n.name)).toEqual(['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5']);
    const played = [0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((x) => mapHandToSynth(at(x), null).frequency);
    const expected = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
    played.forEach((f, i) => expect(f).toBeCloseTo(expected[i]!, 2));
  });

  it('divides the central 80% of the width into 8 equal lanes', () => {
    expect(lanes([0.1, 0.199], null).at(-1)).toBe(0);
    expect([0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85].map((x) => mapHandToSynth(at(x), null).lane)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('plays the nearest outer lane beyond either side', () => {
    expect([0, 0.05, 0.95, 1].map((x) => mapHandToSynth(at(x), null).lane)).toEqual([0, 0, 7, 7]);
  });

  it('plays the lane to the right of a border the palm starts exactly on', () => {
    expect([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((x) => mapHandToSynth(at(x), null).lane)).toEqual([1, 2, 3, 4, 5, 6, 7]);
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
    const before = mapHandToSynth(at(0.45), null);
    const lost = mapHandToSynth(EMPTY_HAND, before);
    expect(lost.lane).toBeNull();
    expect(mapHandToSynth(at(0.51), lost).lane).toBe(4);
  });
});

describe('mapHandToSynth brightness', () => {
  const cutoff = (y: number) => mapHandToSynth(at(0.5, y), null).cutoff;

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
    const before = mapHandToSynth(at(0.85, 0.2), null);
    const lost = mapHandToSynth(EMPTY_HAND, before);
    expect([lost.frequency, lost.cutoff]).toEqual([before.frequency, before.cutoff]);
  });
});
