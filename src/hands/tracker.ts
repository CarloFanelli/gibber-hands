/**
 * Video frames + MediaPipe GestureRecognizer → one HandPair per new video frame: up to two hands, by side.
 * This is the only file that runs MediaPipe on frames; its types never leave hands/.
 */
import { GestureRecognizer } from '@mediapipe/tasks-vision';
import { palmCenter, pinches, toPlayerSpace } from './geometry';
import { createGestureDebounce, gestureName } from './gesture';
import { createHandSlots } from './handSlots';
import { createPointFilter } from './smoothing';
import { EMPTY_HAND, SIDES, emptyPair, type HandPair, type Side, type TrackedHand } from './types';

export interface HandSource {
  onState(cb: (pair: HandPair) => void): void;
  stop(): void;
}

/** Pairs of landmark indices joined when drawing a hand. */
export const HAND_CONNECTIONS: [number, number][] = GestureRecognizer.HAND_CONNECTIONS.map((c) => [c.start, c.end]);

/** One side's own filters, so each hand is smoothed and its gesture confirmed on its own. */
function createSideTrack() {
  const hand: TrackedHand = { state: EMPTY_HAND, landmarks: null };
  return { smoothing: createPointFilter(), gesture: createGestureDebounce(), hand };
}

export function createTracker(video: HTMLVideoElement, recognizer: GestureRecognizer): HandSource {
  const slots = createHandSlots();
  const tracks: Record<Side, ReturnType<typeof createSideTrack>> = { right: createSideTrack(), left: createSideTrack() };
  let cb: ((pair: HandPair) => void) | null = null;
  // MediaPipe rejects a timestamp that doesn't strictly increase.
  let lastTimestamp = Number.NEGATIVE_INFINITY;

  function emit() {
    cb?.({ right: tracks.right.hand, left: tracks.left.hand });
  }

  // Called once per new video frame: a frame is never processed twice, and frames the tracker has
  // no time for are skipped by the browser instead of queued.
  function onFrame(now: number) {
    frame = video.requestVideoFrameCallback(onFrame);
    lastTimestamp = Math.max(now, lastTimestamp + 1);
    const result = recognizer.recognizeForVideo(video, lastTimestamp);
    // Landmarks, reading and gesture of one hand share its index in the result's lists.
    const seen = result.landmarks.flatMap((raw, i) => {
      const points = toPlayerSpace(raw);
      return points ? [{ points, palm: palmCenter(points), label: result.handedness[i]?.[0]?.categoryName ?? '', top: result.gestures[i]?.[0] }] : [];
    });
    const sides = slots.update(seen, now);

    for (const side of SIDES) {
      const track = tracks[side];
      const status = sides[side];
      const hand = status.kind === 'new' || status.kind === 'tracked' ? seen[status.index] : undefined;
      if (status.kind === 'gone') {
        track.gesture.reset();
        track.hand = { state: { ...EMPTY_HAND, t: now }, landmarks: null };
      } else if (!hand) {
        track.hand = { state: { ...track.hand.state, t: now }, landmarks: track.hand.landmarks };
      } else {
        if (status.kind === 'new') track.smoothing.reset();
        const previous = status.kind === 'new' ? EMPTY_HAND : track.hand.state;
        const shown = track.gesture.update(gestureName(hand.top?.categoryName ?? ''), hand.top?.score ?? 0, now);
        track.hand = {
          state: {
            present: true,
            palm: track.smoothing.filter(hand.palm, now),
            // An edge-on hand is too thin to measure: keep the last pinch values.
            ...(pinches(hand.points, video.videoHeight / video.videoWidth) ?? { pinch: previous.pinch, pinchMiddle: previous.pinchMiddle }),
            gesture: shown.gesture,
            gestureScore: shown.score,
            t: now
          },
          landmarks: hand.points
        };
      }
    }
    emit();
  }

  // A hidden tab delivers no frames, so a held hand would never be released: drop both at once.
  function onVisibility() {
    if (!document.hidden) return;
    slots.reset();
    const empty = emptyPair(performance.now());
    for (const side of SIDES) {
      tracks[side].gesture.reset();
      tracks[side].hand = empty[side];
    }
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
