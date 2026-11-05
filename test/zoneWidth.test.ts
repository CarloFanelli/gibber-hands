import { describe, expect, it } from 'vitest';
import { containRect, zoneWidth } from '../src/ui/zoneWidth';

describe('containRect', () => {
  it('centres the picture in a wider box, with black bars at the sides', () => {
    expect(containRect(1000, 480, 640, 480)).toEqual({ x: 180, y: 0, w: 640, h: 480 });
  });

  it('fills the width of a taller box, with black bars above and below', () => {
    expect(containRect(640, 1000, 640, 480)).toEqual({ x: 0, y: 260, w: 640, h: 480 });
  });

  it('scales the picture to the box', () => {
    expect(containRect(1280, 960, 640, 480)).toEqual({ x: 0, y: 0, w: 1280, h: 960 });
  });
});

describe('zoneWidth', () => {
  it('is 80% of the picture’s width on screen, the black bars beside it left out', () => {
    expect(zoneWidth(1600, 600, 640, 480)).toBeCloseTo(640, 9);
  });

  it('follows the width of a picture that fills a taller box', () => {
    expect(zoneWidth(900, 2000, 640, 480)).toBeCloseTo(720, 9);
  });

  it('is null without a picture, or with a box that has no size', () => {
    expect(zoneWidth(1000, 480, 0, 0)).toBeNull();
    expect(zoneWidth(0, 0, 640, 480)).toBeNull();
  });
});
