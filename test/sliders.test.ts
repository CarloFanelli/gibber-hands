import { describe, expect, it } from 'vitest';
import { INITIAL_SLIDERS, sliderHandState } from '../src/ui/sliders';

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
    const low = sliderHandState({ x: 0, y: 0, pinch: 0, pinchMiddle: 0, gesture: null }, 0);
    const high = sliderHandState({ x: 1, y: 1, pinch: 1, pinchMiddle: 1, gesture: null }, 0);
    expect([low.palm.x, low.palm.y, low.pinch, low.pinchMiddle]).toEqual([0, 0, 0, 0]);
    expect([high.palm.x, high.palm.y, high.pinch, high.pinchMiddle]).toEqual([1, 1, 1, 1]);
  });

  it('gives a picked gesture confidence 1, and none confidence 0', () => {
    expect(sliderHandState({ ...INITIAL_SLIDERS, gesture: 'Victory' }, 0)).toMatchObject({ gesture: 'Victory', gestureScore: 1 });
    expect(sliderHandState({ ...INITIAL_SLIDERS, gesture: null }, 0)).toMatchObject({ gesture: null, gestureScore: 0 });
  });
});
