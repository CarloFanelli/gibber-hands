import { describe, expect, it } from 'vitest';
import { palmCenter, pinches, toPlayerSpace } from '../src/hands/geometry';

/** 21 landmarks at one position, as MediaPipe returns them (x, y in 0..1 of the camera frame). */
function hand(x: number, y: number) {
  return Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
}

describe('toPlayerSpace', () => {
  it('mirrors x so the hand moves like in a mirror', () => {
    const points = toPlayerSpace(hand(0.2, 0.3))!;
    expect(points[0]!.x).toBeCloseTo(0.8);
    expect(points[0]!.y).toBeCloseTo(0.3);
  });

  it('treats a frame with a non-numeric value as no hand', () => {
    const landmarks = hand(0.5, 0.5);
    landmarks[7] = { x: Number.NaN, y: 0.5, z: 0 };
    expect(toPlayerSpace(landmarks)).toBeNull();
    landmarks[7] = { x: 0.5, y: Number.POSITIVE_INFINITY, z: 0 };
    expect(toPlayerSpace(landmarks)).toBeNull();
  });
});

describe('palmCenter', () => {
  it('averages the wrist and the four knuckles', () => {
    const points = toPlayerSpace(hand(0.9, 0.9))!;
    const palm = [
      [0, 0.1, 0.2],
      [5, 0.3, 0.4],
      [9, 0.5, 0.6],
      [13, 0.7, 0.8],
      [17, 0.9, 1.0]
    ] as const;
    for (const [i, x, y] of palm) points[i] = { x, y };
    const center = palmCenter(points);
    expect(center.x).toBeCloseTo(0.5);
    expect(center.y).toBeCloseTo(0.6);
  });

  it('clamps a palm partly outside the frame to 0..1', () => {
    expect(palmCenter(toPlayerSpace(hand(1.3, -0.2))!)).toEqual({ x: 0, y: 0 });
    expect(palmCenter(toPlayerSpace(hand(-0.4, 1.5))!)).toEqual({ x: 1, y: 1 });
  });
});

describe('pinches', () => {
  const W = 640;
  const H = 360;

  /** A hand drawn in camera pixels on a 16:9 frame, returned as MediaPipe's normalized landmarks. */
  function pixelHand(points: Record<number, [number, number]>) {
    const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    for (const [i, [x, y]] of Object.entries(points)) landmarks[Number(i)] = { x: x / W, y: y / H, z: 0 };
    return toPlayerSpace(landmarks)!;
  }

  /** Wrist and middle knuckle 100 px apart, thumb tip `gap` px from the index tip and `middleGap` px from the middle tip. */
  function shape(scale: number, gap: number, middleGap: number, vertical = true) {
    const at = (along: number, across: number): [number, number] =>
      vertical ? [320 + across * scale, 300 - along * scale] : [320 + along * scale, 180 + across * scale];
    return pixelHand({ 0: at(0, 0), 9: at(100, 0), 4: at(80, 0), 8: at(80, gap), 12: at(80, middleGap) });
  }

  it('is 0 when thumb and index tips touch, and middle pinch follows the middle tip', () => {
    expect(pinches(shape(1, 0, 40), H / W)).toEqual({ pinch: 0, pinchMiddle: 0.4 });
  });

  it('clamps to 1 with fingers spread wide', () => {
    expect(pinches(shape(1, 250, 180), H / W)).toEqual({ pinch: 1, pinchMiddle: 1 });
  });

  it('gives the same value close to the camera and twice as far', () => {
    const near = pinches(shape(1, 30, 60), H / W)!;
    const far = pinches(shape(0.5, 30, 60), H / W)!;
    expect(far.pinch).toBeCloseTo(near.pinch, 6);
    expect(far.pinchMiddle).toBeCloseTo(near.pinchMiddle, 6);
  });

  it('gives the same value for an upright and a sideways hand on a wide frame', () => {
    const upright = pinches(shape(1, 30, 60, true), H / W)!;
    const sideways = pinches(shape(1, 30, 60, false), H / W)!;
    expect(sideways.pinch).toBeCloseTo(upright.pinch, 6);
  });

  it('has no value for a hand smaller than 2% of the frame width', () => {
    expect(pinches(shape(0.12, 10, 10), H / W)).toBeNull();
    expect(pinches(shape(0.13, 10, 10), H / W)).not.toBeNull();
  });
});
