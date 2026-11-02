import { describe, expect, it } from 'vitest';
import { createGestureDebounce, gestureName } from '../src/hands/gesture';
import { GESTURE_NAMES } from '../src/hands/types';

describe('gestureName', () => {
  it('keeps the seven named gestures', () => {
    for (const name of GESTURE_NAMES) expect(gestureName(name)).toBe(name);
  });

  it('turns "None" and unknown labels into none', () => {
    expect(gestureName('None')).toBeNull();
    expect(gestureName('Wave')).toBeNull();
    expect(gestureName('')).toBeNull();
  });
});

describe('gesture debounce', () => {
  it('switches to a new gesture after it is reported at 0.6 or more for 100 ms', () => {
    const d = createGestureDebounce();
    expect(d.update('Thumb_Up', 0.6, 0)).toEqual({ gesture: null, score: 0 });
    expect(d.update('Thumb_Up', 0.7, 99)).toEqual({ gesture: null, score: 0 });
    expect(d.update('Thumb_Up', 0.8, 100)).toEqual({ gesture: 'Thumb_Up', score: 0.8 });
  });

  it('ignores a new gesture at 0.59', () => {
    const d = createGestureDebounce();
    for (let t = 0; t <= 500; t += 33) expect(d.update('Victory', 0.59, t).gesture).toBeNull();
  });

  it('keeps the current gesture when two others alternate every 50 ms', () => {
    const d = createGestureDebounce();
    d.update('Open_Palm', 0.9, 0);
    d.update('Open_Palm', 0.9, 100);
    for (let t = 150; t <= 1000; t += 50) {
      const flicker = (t / 50) % 2 === 0 ? 'Victory' : 'Pointing_Up';
      expect(d.update(flicker, 0.9, t).gesture).toBe('Open_Palm');
    }
  });

  it('follows the confidence of the current gesture', () => {
    const d = createGestureDebounce();
    d.update('Closed_Fist', 0.9, 0);
    d.update('Closed_Fist', 0.9, 100);
    expect(d.update('Closed_Fist', 0.75, 133)).toEqual({ gesture: 'Closed_Fist', score: 0.75 });
  });

  it('goes back to none only after none is reported for 100 ms', () => {
    const d = createGestureDebounce();
    d.update('Thumb_Down', 0.9, 0);
    d.update('Thumb_Down', 0.9, 100);
    expect(d.update(null, 0.8, 133).gesture).toBe('Thumb_Down');
    expect(d.update(null, 0.8, 233)).toEqual({ gesture: null, score: 0 });
  });

  it('starts from none after a reset', () => {
    const d = createGestureDebounce();
    d.update('ILoveYou', 0.9, 0);
    d.update('ILoveYou', 0.9, 100);
    d.reset();
    expect(d.update('ILoveYou', 0.9, 133)).toEqual({ gesture: null, score: 0 });
  });
});
