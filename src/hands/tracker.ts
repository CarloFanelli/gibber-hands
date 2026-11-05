/**
 * Video frames + MediaPipe GestureRecognizer → one HandState per new video frame.
 * This is the only file that runs MediaPipe on frames; its types never leave hands/.
 */
import { GestureRecognizer } from '@mediapipe/tasks-vision';
import { palmCenter, pinches, toPlayerSpace } from './geometry';
import { createGestureDebounce, gestureName } from './gesture';
import { createPresence } from './presence';
import { createPointFilter } from './smoothing';
import { EMPTY_HAND, type HandState, type Point } from './types';

export interface HandSource {
  /** `landmarks` are the 21 points in the player's view, or null without a tracked hand (always null from sliders). */
  onState(cb: (s: HandState, landmarks: Point[] | null) => void): void;
  stop(): void;
}

/** Pairs of landmark indices joined when drawing a hand. */
export const HAND_CONNECTIONS: [number, number][] = GestureRecognizer.HAND_CONNECTIONS.map((c) => [c.start, c.end]);

export function createTracker(video: HTMLVideoElement, recognizer: GestureRecognizer): HandSource {
  const presence = createPresence();
  const smoothing = createPointFilter();
  const gesture = createGestureDebounce();
  let cb: ((s: HandState, landmarks: Point[] | null) => void) | null = null;
  let state: HandState = EMPTY_HAND;
  let points: Point[] | null = null;
  // MediaPipe rejects a timestamp that doesn't strictly increase.
  let lastTimestamp = Number.NEGATIVE_INFINITY;

  function emit() {
    cb?.(state, points);
  }

  // Called once per new video frame: a frame is never processed twice, and frames the tracker has
  // no time for are skipped by the browser instead of queued.
  function onFrame(now: number) {
    frame = video.requestVideoFrameCallback(onFrame);
    lastTimestamp = Math.max(now, lastTimestamp + 1);
    const result = recognizer.recognizeForVideo(video, lastTimestamp);
    const raw = result.landmarks[0];
    const seen = raw ? toPlayerSpace(raw) : null;
    const status = presence.update(seen ? (result.handedness[0]?.[0]?.categoryName ?? '') : null, now);

    if (status === 'gone') {
      gesture.reset();
      points = null;
      state = { ...EMPTY_HAND, t: now };
    } else if (status === 'held' || !seen) {
      state = { ...state, t: now };
    } else {
      if (status === 'new') smoothing.reset();
      const previous = status === 'new' ? EMPTY_HAND : state;
      const top = result.gestures[0]?.[0];
      const shown = gesture.update(gestureName(top?.categoryName ?? ''), top?.score ?? 0, now);
      points = seen;
      state = {
        present: true,
        palm: smoothing.filter(palmCenter(seen), now),
        // An edge-on hand is too thin to measure: keep the last pinch values.
        ...(pinches(seen, video.videoHeight / video.videoWidth) ?? { pinch: previous.pinch, pinchMiddle: previous.pinchMiddle }),
        gesture: shown.gesture,
        gestureScore: shown.score,
        t: now
      };
    }
    emit();
  }

  // A hidden tab delivers no frames, so a held hand would never be released: drop it at once.
  function onVisibility() {
    if (!document.hidden) return;
    presence.reset();
    gesture.reset();
    points = null;
    state = { ...EMPTY_HAND, t: performance.now() };
    emit();
  }

  let frame = video.requestVideoFrameCallback(onFrame);
  document.addEventListener('visibilitychange', onVisibility);

  return {
    onState(fn) {
      cb = fn;
    },
    stop() {
      video.cancelVideoFrameCallback(frame);
      document.removeEventListener('visibilitychange', onVisibility);
      cb = null;
    }
  };
}
