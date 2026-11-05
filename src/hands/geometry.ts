/**
 * Landmarks → the player's view. The mirror happens here and nowhere else: the overlay draws these points
 * as they are, and only the video pixels are flipped by CSS.
 */
import type { Point } from './types';

/** Wrist and the four knuckles (index, middle, ring, little). */
const PALM_LANDMARKS = [0, 5, 9, 13, 17];
const WRIST = 0;
const MIDDLE_KNUCKLE = 9;
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
/** Below this hand size (fraction of the frame width) the hand is edge-on and pinch can't be read. */
const MIN_HAND_SIZE = 0.02;

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

/**
 * Thumb-to-index and thumb-to-middle tip distances divided by hand size (wrist to middle knuckle),
 * clamped to 0..1. Null when the hand is too small to measure: the caller keeps the previous values.
 * `aspect` is the frame's height / width; distances are measured in frame widths so that a pinch
 * reads the same whichever way the hand is turned.
 */
export function pinches(points: readonly Point[], aspect: number): { pinch: number; pinchMiddle: number } | null {
  const distance = (a: number, b: number) => {
    const pa = points[a];
    const pb = points[b];
    return pa && pb ? Math.hypot(pa.x - pb.x, (pa.y - pb.y) * aspect) : Number.NaN;
  };
  const size = distance(WRIST, MIDDLE_KNUCKLE);
  if (!(size >= MIN_HAND_SIZE)) return null;
  return {
    pinch: clamp01(distance(THUMB_TIP, INDEX_TIP) / size),
    pinchMiddle: clamp01(distance(THUMB_TIP, MIDDLE_TIP) / size)
  };
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}
