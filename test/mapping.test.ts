import { describe, it, expect } from 'vitest';
import { mapHandToSynth } from '../src/mapping/handToSynth';
import { EMPTY_HAND, type HandState } from '../src/hands/types';
import { INITIAL_SLIDERS, sliderHandState } from '../src/ui/sliders';

const hand = (over: Partial<HandState>): HandState => ({ ...EMPTY_HAND, present: true, ...over });

describe('mapHandToSynth volume', () => {
  it('is full at pinch 0.2 or less', () => {
    expect(mapHandToSynth(hand({ pinch: 0.2 })).amp).toBe(1);
    expect(mapHandToSynth(hand({ pinch: 0 })).amp).toBe(1);
  });

  it('is silent at pinch 0.5 or more', () => {
    expect(mapHandToSynth(hand({ pinch: 0.5 })).amp).toBe(0);
    expect(mapHandToSynth(hand({ pinch: 1 })).amp).toBe(0);
  });

  it('grows with the square of how far the fingers have closed', () => {
    expect(mapHandToSynth(hand({ pinch: 0.35 })).amp).toBeCloseTo(0.25, 10);
    expect(mapHandToSynth(hand({ pinch: 0.44 })).amp).toBeCloseTo(0.04, 10);
  });

  it('ramps pinch changes over 15 ms', () => {
    expect(mapHandToSynth(hand({ pinch: 0.3 })).ampRampMs).toBe(15);
  });
});

describe('mapHandToSynth silence', () => {
  it('fades to silence within 30 ms on a closed fist, whatever the pinch', () => {
    const p = mapHandToSynth(hand({ pinch: 0, gesture: 'Closed_Fist', gestureScore: 0.9 }));
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });

  it('restores the pinch volume once the fist opens', () => {
    expect(mapHandToSynth(hand({ pinch: 0, gesture: 'Open_Palm' })).amp).toBe(1);
  });

  it('fades to silence over 100 ms when the hand is lost', () => {
    const p = mapHandToSynth({ ...EMPTY_HAND, pinch: 0 });
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(100);
  });
});

describe('mapHandToSynth with the sliders', () => {
  it('is silent with the sliders at rest', () => {
    expect(mapHandToSynth(sliderHandState(INITIAL_SLIDERS, 0)).amp).toBe(0);
  });

  it('plays at full volume with the pinch slider at 0', () => {
    expect(mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0 }, 0)).amp).toBe(1);
  });

  it('silences the closed fist picked in the gesture menu', () => {
    const p = mapHandToSynth(sliderHandState({ ...INITIAL_SLIDERS, pinch: 0, gesture: 'Closed_Fist' }, 0));
    expect(p.amp).toBe(0);
    expect(p.ampRampMs).toBe(30);
  });
});
