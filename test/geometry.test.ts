import { describe, expect, it } from 'vitest';
import { palmCenter, toPlayerSpace } from '../src/hands/geometry';

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
