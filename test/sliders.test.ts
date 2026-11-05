import { describe, expect, it } from 'vitest';
import { EMPTY_HAND } from '../src/hands/types';
import { mapHandToSynth } from '../src/mapping/handToSynth';
import { asPlayed, effectAmount, octaveRaised } from '../src/mapping/shape';
import { PRESETS } from '../src/synth/presets';
import { INITIAL_SLIDERS, SLIDERS_SECOND_HAND, sliderHandState, sliderPair } from '../src/ui/sliders';

describe('slider HandState', () => {
  it('starts with the palm center in the middle, fingers open, no gesture, hand present', () => {
    expect(sliderHandState(INITIAL_SLIDERS, 42)).toEqual({
      present: true,
      palm: { x: 0.5, y: 0.5 },
      pinch: 1,
      pinchMiddle: 1,
      gesture: null,
      gestureScore: 0,
      t: 42
    });
  });

  it('passes the slider ends through as exactly 0 and 1', () => {
    const low = sliderHandState({ ...INITIAL_SLIDERS, x: 0, y: 0, pinch: 0, pinchMiddle: 0 }, 0);
    const high = sliderHandState({ ...INITIAL_SLIDERS, x: 1, y: 1, pinch: 1, pinchMiddle: 1 }, 0);
    expect([low.palm.x, low.palm.y, low.pinch, low.pinchMiddle]).toEqual([0, 0, 0, 0]);
    expect([high.palm.x, high.palm.y, high.pinch, high.pinchMiddle]).toEqual([1, 1, 1, 1]);
  });

  it('gives a picked gesture confidence 1, and none confidence 0', () => {
    expect(sliderHandState({ ...INITIAL_SLIDERS, gesture: 'Victory' }, 0)).toMatchObject({ gesture: 'Victory', gestureScore: 1 });
    expect(sliderHandState({ ...INITIAL_SLIDERS, gesture: null }, 0)).toMatchObject({ gesture: null, gestureScore: 0 });
  });
});

describe('slider pair', () => {
  it('plays the sliders as the lead hand, with a shaping hand on the other side', () => {
    const right = sliderPair(INITIAL_SLIDERS, 'right', 7);
    expect(right.right).toEqual({ state: sliderHandState(INITIAL_SLIDERS, 7), landmarks: null });
    expect(right.left).toMatchObject({ state: { present: true, gesture: null, t: 7 }, landmarks: null });

    const left = sliderPair(INITIAL_SLIDERS, 'left', 7);
    expect(left.left.state).toEqual(sliderHandState(INITIAL_SLIDERS, 7));
    expect(left.right.state.present).toBe(true);
  });
});

describe('slider shape controls', () => {
  const second = (over: Partial<typeof INITIAL_SLIDERS>) => sliderPair({ ...INITIAL_SLIDERS, ...over }, 'right', 0).left.state;

  it('start with the octave switch off and the effect slider in the middle: the preset’s own amount', () => {
    expect(octaveRaised(false, second({}), SLIDERS_SECOND_HAND)).toBe(false);
    expect(effectAmount(second({}), SLIDERS_SECOND_HAND, 0.3)).toBeCloseTo(0.3, 12);
  });

  it('raise the octave while the switch is on, and drop it once it is off', () => {
    expect(octaveRaised(false, second({ octaveUp: true }), SLIDERS_SECOND_HAND)).toBe(true);
    expect(octaveRaised(true, second({ octaveUp: true }), SLIDERS_SECOND_HAND)).toBe(true);
    expect(octaveRaised(true, second({ octaveUp: false }), SLIDERS_SECOND_HAND)).toBe(false);
  });

  it('set the effect amount like a shaping hand’s height: none at one end, double at the other, at most 80%', () => {
    expect(effectAmount(second({ effect: 0 }), SLIDERS_SECOND_HAND, 0.3)).toBe(0);
    expect(effectAmount(second({ effect: 0.75 }), SLIDERS_SECOND_HAND, 0.3)).toBeCloseTo(0.45, 12);
    expect(effectAmount(second({ effect: 1 }), SLIDERS_SECOND_HAND, 0.3)).toBeCloseTo(0.6, 12);
    expect(effectAmount(second({ effect: 1 }), SLIDERS_SECOND_HAND, 0.6)).toBeCloseTo(0.8, 12);
  });

  it('play one note, in the upper octave with the switch on: the shaping hand never plays one', () => {
    const lanes = PRESETS[0]!.lanes.slice(0, 8);
    const pair = sliderPair({ ...INITIAL_SLIDERS, pinch: 0, octaveUp: true }, 'right', 0);
    const octave = octaveRaised(false, pair.left.state, SLIDERS_SECOND_HAND) ? 1 : 0;
    const lead = mapHandToSynth(pair.right.state, null, lanes, octave);
    expect(lead).toMatchObject({ amp: 1, frequency: lanes[lead.lane!]!.frequency * 2 });
    expect(mapHandToSynth(asPlayed(pair.left.state, SLIDERS_SECOND_HAND), null, lanes, octave).amp).toBe(0);
    expect(asPlayed(EMPTY_HAND, SLIDERS_SECOND_HAND).present).toBe(false);
  });
});
