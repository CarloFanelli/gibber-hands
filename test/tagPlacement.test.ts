import { describe, expect, it } from 'vitest';
import { TAG_GAP, TAG_OFFSET, placeTags } from '../src/ui/tagPlacement';

const PICTURE = { x: 100, y: 50, w: 800, h: 600 };
const TAG = { w: 160, h: 28 };

describe('placeTags', () => {
  it('centres a tag under its palm', () => {
    expect(placeTags([{ x: 500, y: 300, ...TAG }], PICTURE)).toEqual([{ left: 420, top: 300 + TAG_OFFSET }]);
  });

  it('puts the tag above the palm when there is no room under it', () => {
    expect(placeTags([{ x: 500, y: 640, ...TAG }], PICTURE)).toEqual([{ left: 420, top: 640 - TAG_OFFSET - 28 }]);
  });

  it('keeps the tag inside the picture beside its left and right edges', () => {
    expect(placeTags([{ x: 110, y: 300, ...TAG }], PICTURE)[0]!.left).toBe(100);
    expect(placeTags([{ x: 890, y: 300, ...TAG }], PICTURE)[0]!.left).toBe(900 - 160);
  });

  it('keeps the tag inside the picture beside its top edge', () => {
    expect(placeTags([{ x: 500, y: 40, ...TAG }], PICTURE)[0]!.top).toBe(40 + TAG_OFFSET);
    expect(placeTags([{ x: 500, y: 0, w: 160, h: 640 }], PICTURE)[0]!.top).toBe(50);
  });

  it('stacks the second tag under the first when they would overlap', () => {
    const [first, second] = placeTags([{ x: 500, y: 300, ...TAG }, { x: 520, y: 305, ...TAG }], PICTURE);
    expect(first).toEqual({ left: 420, top: 300 + TAG_OFFSET });
    expect(second!.top).toBe(first!.top + 28 + TAG_GAP);
  });

  it('stacks it above instead when there is no room under the first', () => {
    const [first, second] = placeTags([{ x: 500, y: 640, ...TAG }, { x: 520, y: 640, ...TAG }], PICTURE);
    expect(second!.top).toBe(first!.top - 28 - TAG_GAP);
  });

  it('leaves tags that do not overlap where they are', () => {
    const [, second] = placeTags([{ x: 300, y: 300, ...TAG }, { x: 700, y: 300, ...TAG }], PICTURE);
    expect(second).toEqual({ left: 620, top: 300 + TAG_OFFSET });
  });
});
