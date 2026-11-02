/**
 * Landmarks → the player's view. The mirror happens here and nowhere else: the overlay draws these points
 * as they are, and only the video pixels are flipped by CSS.
 */
import type { Point } from './types';

/** Wrist and the four knuckles (index, middle, ring, little). */
const PALM_LANDMARKS = [0, 5, 9, 13, 17];

/** Mirrors x. Returns null when any coordinate is not a finite number: the frame counts as no hand. */
export function toPlayerSpace(landmarks: readonly { x: number; y: number }[]): Point[] | null {
  if (!landmarks.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
  return landmarks.map((p) => ({ x: 1 - p.x, y: p.y }));
}

export function palmCenter(points: readonly Point[]): Point {
  let x = 0;
  let y = 0;
  for (const i of PALM_LANDMARKS) {
    x += points[i]?.x ?? 0;
    y += points[i]?.y ?? 0;
  }
  return { x: clamp01(x / PALM_LANDMARKS.length), y: clamp01(y / PALM_LANDMARKS.length) };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}
