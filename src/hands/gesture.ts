/**
 * Steady gesture from MediaPipe's per-frame guesses: a new gesture replaces the current one only
 * after it has been reported with enough confidence for long enough.
 */
import { GESTURE_NAMES, type GestureName } from './types';

/** Tuned values: the confidence a new gesture needs, and for how long. */
const MIN_CONFIDENCE = 0.6;
const CONFIRM_MS = 100;

/** One of the seven named gestures, or null for "None" and any label the app doesn't know. */
export function gestureName(label: string): GestureName | null {
  return GESTURE_NAMES.find((name) => name === label) ?? null;
}

export interface GestureDebounce {
  /** Called once per frame with the model's top guess; returns the gesture to report (score 0 for none). */
  update(name: GestureName | null, score: number, t: number): { gesture: GestureName | null; score: number };
  /** Back to none, as for a new hand. */
  reset(): void;
}

export function createGestureDebounce(): GestureDebounce {
  let current: { gesture: GestureName | null; score: number } = { gesture: null, score: 0 };
  let candidate: { name: GestureName | null; since: number } | null = null;

  return {
    update(name, score, t) {
      if (name === current.gesture) {
        candidate = null;
        if (name !== null) current = { gesture: name, score };
        return current;
      }
      if (score < MIN_CONFIDENCE) {
        candidate = null;
        return current;
      }
      if (candidate?.name !== name) candidate = { name, since: t };
      if (t - candidate.since >= CONFIRM_MS) {
        current = { gesture: name, score: name === null ? 0 : score };
        candidate = null;
      }
      return current;
    },
    reset() {
      current = { gesture: null, score: 0 };
      candidate = null;
    }
  };
}
