import { describe, expect, it } from 'vitest';
import { createHandSlots, type SeenHand } from '../src/hands/handSlots';

const FRAME = 33;
const right = (x = 0.7, y = 0.5): SeenHand => ({ palm: { x, y }, label: 'Right' });
const left = (x = 0.3, y = 0.5): SeenHand => ({ palm: { x, y }, label: 'Left' });

describe('hand slots', () => {
  it('reports both sides gone when no hand was ever seen', () => {
    expect(createHandSlots().update([], 0)).toEqual({ right: { kind: 'gone' }, left: { kind: 'gone' } });
  });

  it("gives a new hand the side of its left/right reading", () => {
    expect(createHandSlots().update([right()], 0)).toEqual({ right: { kind: 'new', index: 0 }, left: { kind: 'gone' } });
    expect(createHandSlots().update([left()], 0)).toEqual({ right: { kind: 'gone' }, left: { kind: 'new', index: 0 } });
  });

  it('holds a hand missing for under 150 ms, with no gap when it returns', () => {
    const slots = createHandSlots();
    slots.update([right()], 0);
    expect(slots.update([], 33).right).toEqual({ kind: 'held' });
    expect(slots.update([], 100).right).toEqual({ kind: 'held' });
    expect(slots.update([right()], 133).right).toEqual({ kind: 'tracked', index: 0 });
  });

  it('lets a hand go exactly when it has been missing for 150 ms, and starts over when it returns', () => {
    const slots = createHandSlots();
    slots.update([right()], 0);
    for (let t = FRAME; t < 150; t += FRAME) expect(slots.update([], t).right).toEqual({ kind: 'held' });
    expect(slots.update([], 150).right).toEqual({ kind: 'gone' });
    expect(slots.update([right()], 183).right).toEqual({ kind: 'new', index: 0 });
  });

  it('starts over when frames are more than 150 ms apart, as after a background tab', () => {
    const slots = createHandSlots();
    slots.update([right()], 0);
    expect(slots.update([right()], 1000).right).toEqual({ kind: 'new', index: 0 });
  });

  it('forgets every hand on reset', () => {
    const slots = createHandSlots();
    slots.update([right(), left()], 0);
    slots.reset();
    expect(slots.update([], 33)).toEqual({ right: { kind: 'gone' }, left: { kind: 'gone' } });
  });

  it('tracks two hands at once, each on its side', () => {
    const slots = createHandSlots();
    expect(slots.update([left(), right()], 0)).toEqual({ right: { kind: 'new', index: 1 }, left: { kind: 'new', index: 0 } });
    expect(slots.update([right(), left()], 33)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'tracked', index: 1 } });
  });

  it('counts the one further right as the right hand when both read the same', () => {
    expect(createHandSlots().update([right(0.2), right(0.8)], 0)).toEqual({
      right: { kind: 'new', index: 1 },
      left: { kind: 'new', index: 0 }
    });
    expect(createHandSlots().update([left(0.2), left(0.8)], 0)).toEqual({
      right: { kind: 'new', index: 1 },
      left: { kind: 'new', index: 0 }
    });
  });

  it('keeps a tracked hand on its side while its left/right reading flickers', () => {
    const slots = createHandSlots();
    slots.update([right()], 0);
    expect(slots.update([{ ...left(0.7) }], 33)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'gone' } });
    expect(slots.update([right()], 66).right).toEqual({ kind: 'tracked', index: 0 });
  });

  it('gives a hand that appears beside a tracked one the free side, even when both read the same', () => {
    const slots = createHandSlots();
    slots.update([right(0.6)], 0);
    expect(slots.update([right(0.6), right(0.2)], 33)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'new', index: 1 } });
  });

  it('keeps a lone left hand on its side when the right hand appears', () => {
    const slots = createHandSlots();
    slots.update([left(0.6)], 0);
    expect(slots.update([right(0.8), left(0.6)], 33)).toEqual({ right: { kind: 'new', index: 0 }, left: { kind: 'tracked', index: 1 } });
  });

  it('keeps each hand on its side while the hands cross', () => {
    const slots = createHandSlots();
    slots.update([left(0.3), right(0.7)], 0);
    let t = 0;
    for (let step = 1; step <= 10; step++) {
      t += FRAME;
      const shift = step * 0.04;
      // MediaPipe's order is not stable: alternate it.
      const hands = [left(0.3 + shift), right(0.7 - shift)];
      if (step % 2) hands.reverse();
      const sides = slots.update(hands, t);
      expect(sides.left).toEqual({ kind: 'tracked', index: step % 2 ? 1 : 0 });
      expect(sides.right).toEqual({ kind: 'tracked', index: step % 2 ? 0 : 1 });
    }
  });

  it('ignores a third hand until one of the two tracked hands leaves', () => {
    const slots = createHandSlots();
    slots.update([left(0.3), right(0.7)], 0);
    // The model reports the third hand instead of the left one: the left is held, the third ignored.
    expect(slots.update([right(0.7), right(0.05, 0.1)], 33)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'held' } });
    expect(slots.update([right(0.7), right(0.05, 0.1)], 150)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'gone' } });
    expect(slots.update([right(0.7), right(0.05, 0.1)], 183)).toEqual({ right: { kind: 'tracked', index: 0 }, left: { kind: 'new', index: 1 } });
  });

  it('follows a fast-moving hand that still reads the same', () => {
    const slots = createHandSlots();
    slots.update([right(0.9)], 0);
    expect(slots.update([right(0.3)], 33).right).toEqual({ kind: 'tracked', index: 0 });
  });

  it('treats a far hand that reads differently as another hand, as when one hand leaves while the other enters', () => {
    const slots = createHandSlots();
    slots.update([right(0.9)], 0);
    expect(slots.update([left(0.2)], 33)).toEqual({ right: { kind: 'held' }, left: { kind: 'new', index: 0 } });
  });
});
