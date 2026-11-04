import { describe, expect, it } from 'vitest';
import { EMPTY_HAND, type GestureName, type HandState } from '../src/hands/types';
import { SECOND_HAND_START, asPlayed, followSecondHand, octaveRaised, secondHandAfterSwap, type SecondHand } from '../src/mapping/shape';

const hand = (over: Partial<HandState>): HandState => ({ ...EMPTY_HAND, present: true, ...over });
const showing = (gesture: GestureName | null) => hand({ gesture, gestureScore: gesture ? 0.9 : 0 });
/** Follows the second hand through the gestures in order and returns its mode after each. */
function modes(gestures: (GestureName | null | 'gone')[], start: SecondHand = SECOND_HAND_START) {
  let second = start;
  return gestures.map((g) => (second = followSecondHand(second, g === 'gone' ? EMPTY_HAND : showing(g))).mode);
}

describe('second hand mode', () => {
  it('starts playing notes', () => {
    expect(SECOND_HAND_START.mode).toBe('notes');
  });

  it('switches to shape mode on a Victory sign, and back on the next one', () => {
    expect(modes([null, 'Victory', null, 'Victory'])).toEqual(['notes', 'shape', 'shape', 'notes']);
  });

  it('switches once while the sign is held', () => {
    expect(modes(['Victory', 'Victory', 'Victory'])).toEqual(['shape', 'shape', 'shape']);
  });

  it('switches on no other gesture', () => {
    expect(modes(['Open_Palm', 'Pointing_Up', 'Thumb_Up', 'Thumb_Down', 'ILoveYou', 'Closed_Fist', null])).toEqual(Array(7).fill('notes'));
  });

  it('keeps its mode while the hand is out of view', () => {
    expect(modes(['Victory', null, 'gone', 'gone', null])).toEqual(['shape', 'shape', 'shape', 'shape', 'shape']);
  });

  it('counts a hand that leaves showing the sign and comes back still showing it as a new sign', () => {
    expect(modes(['Victory', 'gone', 'Victory'])).toEqual(['shape', 'shape', 'notes']);
  });
});

describe('octave', () => {
  const shaping: SecondHand = { mode: 'shape', lastGesture: null };
  const squeeze = (pinch: number, over: Partial<HandState> = {}) => hand({ pinch, ...over });

  it('rises at the full-volume squeeze in shape mode', () => {
    expect(octaveRaised(false, squeeze(0.2), shaping)).toBe(true);
    expect(octaveRaised(false, squeeze(0.21), shaping)).toBe(false);
  });

  it('stays up until the squeeze opens clearly past that level, so a hovering squeeze does not flicker', () => {
    expect(octaveRaised(true, squeeze(0.25), shaping)).toBe(true);
    expect(octaveRaised(true, squeeze(0.3), shaping)).toBe(true);
    expect(octaveRaised(true, squeeze(0.31), shaping)).toBe(false);
  });

  it('stays normal while the second hand plays notes', () => {
    expect(octaveRaised(false, squeeze(0), SECOND_HAND_START)).toBe(false);
    expect(octaveRaised(true, squeeze(0), SECOND_HAND_START)).toBe(false);
  });

  it('takes a closed fist for no squeeze', () => {
    expect(octaveRaised(false, squeeze(0.1, { gesture: 'Closed_Fist' }), shaping)).toBe(false);
    expect(octaveRaised(true, squeeze(0.1, { gesture: 'Closed_Fist' }), shaping)).toBe(false);
  });

  it('drops at once when the shaping hand leaves', () => {
    expect(octaveRaised(true, EMPTY_HAND, shaping)).toBe(false);
  });
});

describe('the second hand as played', () => {
  it('plays its notes while playing notes', () => {
    const h = hand({ pinch: 0.1 });
    expect(asPlayed(h, SECOND_HAND_START)).toBe(h);
  });

  it('plays nothing in shape mode, fading as a lost hand does', () => {
    expect(asPlayed(hand({ pinch: 0.1 }), { mode: 'shape', lastGesture: null }).present).toBe(false);
  });
});

describe('a swap', () => {
  it('makes the other hand the second hand, playing notes', () => {
    expect(secondHandAfterSwap(showing(null)).mode).toBe('notes');
  });

  it('does not count a Victory sign the new second hand already shows', () => {
    const after = secondHandAfterSwap(showing('Victory'));
    expect(followSecondHand(after, showing('Victory')).mode).toBe('notes');
    expect(followSecondHand(followSecondHand(after, showing(null)), showing('Victory')).mode).toBe('shape');
  });
});
