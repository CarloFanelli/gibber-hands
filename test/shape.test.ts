import { describe, expect, it } from 'vitest';
import { EMPTY_HAND, GESTURE_NAMES, type GestureName, type HandState } from '../src/hands/types';
import { SECOND_HAND_START, asPlayed, effectAmount, followSecondHand, octaveShift, secondHandAfterSwap, type SecondHand } from '../src/mapping/shape';

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

  const thumbsDown = (over: Partial<HandState> = {}) => hand({ gesture: 'Thumb_Down', gestureScore: 0.9, ...over });

  it('rises at the full-volume squeeze in shape mode', () => {
    expect(octaveShift(0, squeeze(0.2), shaping)).toBe(1);
    expect(octaveShift(0, squeeze(0.21), shaping)).toBe(0);
  });

  it('stays up until the squeeze opens clearly past that level, so a hovering squeeze does not flicker', () => {
    expect(octaveShift(1, squeeze(0.25), shaping)).toBe(1);
    expect(octaveShift(1, squeeze(0.3), shaping)).toBe(1);
    expect(octaveShift(1, squeeze(0.31), shaping)).toBe(0);
  });

  it('stays normal while the second hand plays notes, whatever it shows', () => {
    expect(octaveShift(0, squeeze(0), SECOND_HAND_START)).toBe(0);
    expect(octaveShift(1, squeeze(0), SECOND_HAND_START)).toBe(0);
    expect(octaveShift(0, thumbsDown(), SECOND_HAND_START)).toBe(0);
  });

  it('takes a closed fist for no squeeze', () => {
    expect(octaveShift(0, squeeze(0.1, { gesture: 'Closed_Fist' }), shaping)).toBe(0);
    expect(octaveShift(1, squeeze(0.1, { gesture: 'Closed_Fist' }), shaping)).toBe(0);
  });

  it('drops one octave below normal while the shaping hand shows a thumbs-down', () => {
    expect(octaveShift(0, thumbsDown(), shaping)).toBe(-1);
    expect(octaveShift(-1, thumbsDown(), shaping)).toBe(-1);
  });

  it('comes back to normal at once when the thumbs-down drops', () => {
    expect(octaveShift(-1, hand({ gesture: null }), shaping)).toBe(0);
    expect(octaveShift(-1, hand({ gesture: 'Open_Palm' }), shaping)).toBe(0);
  });

  it('goes from up to down at once on a squeeze straight into a thumbs-down', () => {
    expect(octaveShift(1, thumbsDown({ pinch: 0.1 }), shaping)).toBe(-1);
  });

  it('is lowered by no other gesture', () => {
    for (const gesture of GESTURE_NAMES.filter((g) => g !== 'Thumb_Down')) {
      expect(octaveShift(0, hand({ gesture, gestureScore: 0.9 }), shaping)).toBe(0);
    }
  });

  it('comes back to normal at once when the shaping hand leaves', () => {
    expect(octaveShift(1, EMPTY_HAND, shaping)).toBe(0);
    expect(octaveShift(-1, EMPTY_HAND, shaping)).toBe(0);
  });
});

describe('effect amount', () => {
  const shaping: SecondHand = { mode: 'shape', lastGesture: null };
  /** A shaping hand with its palm center at height `y` of the view, 0 at the top. */
  const at = (y: number, over: Partial<HandState> = {}) => hand({ palm: { x: 0.5, y }, ...over });

  it('rises from none at the bottom of the playing zone, through the preset’s own amount at the middle, to double at the top', () => {
    expect(effectAmount(at(0.9), shaping, 0.3)).toBe(0);
    expect(effectAmount(at(0.7), shaping, 0.3)).toBeCloseTo(0.15, 12);
    expect(effectAmount(at(0.5), shaping, 0.3)).toBeCloseTo(0.3, 12);
    expect(effectAmount(at(0.3), shaping, 0.3)).toBeCloseTo(0.45, 12);
    expect(effectAmount(at(0.1), shaping, 0.3)).toBeCloseTo(0.6, 12);
  });

  it('tops out at 80%, rising to it over the upper half: Warm Pad’s 60% gives 80%, not 120%', () => {
    expect(effectAmount(at(0.5), shaping, 0.6)).toBeCloseTo(0.6, 12);
    expect(effectAmount(at(0.3), shaping, 0.6)).toBeCloseTo(0.7, 12);
    expect(effectAmount(at(0.1), shaping, 0.6)).toBeCloseTo(0.8, 12);
  });

  it('stays at the top or bottom value above or below the playing zone', () => {
    expect(effectAmount(at(0.02), shaping, 0.25)).toBeCloseTo(0.5, 12);
    expect(effectAmount(at(0.98), shaping, 0.25)).toBe(0);
  });

  it('follows the shaping hand whatever its squeeze or gesture', () => {
    expect(effectAmount(at(0.1, { pinch: 0, gesture: 'Closed_Fist' }), shaping, 0.3)).toBeCloseTo(0.6, 12);
  });

  it('is the preset’s own amount while the second hand plays notes or is out of view', () => {
    expect(effectAmount(at(0.1), SECOND_HAND_START, 0.3)).toBe(0.3);
    expect(effectAmount(EMPTY_HAND, shaping, 0.3)).toBe(0.3);
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
