/**
 * Whether the followed hand is present, frame by frame.
 * A hand missing for under HOLD_MS is still present; another hand is ignored until the followed one is gone.
 */

const HOLD_MS = 150;

/** new: smoothing restarts · tracked: same hand · held: keep the last values · gone: no hand. */
type PresenceStatus = 'new' | 'tracked' | 'held' | 'gone';

export interface Presence {
  /** `hand` identifies the detected hand (its handedness), or is null when none is detected. */
  update(hand: string | null, t: number): PresenceStatus;
  reset(): void;
}

export function createPresence(): Presence {
  let followed: string | null = null;
  let lastSeen = 0;
  let lastFrame = Number.NEGATIVE_INFINITY;

  return {
    update(hand, t) {
      // Frames further apart than the hold (background tab, stalled camera) leave nothing to hold on to.
      if (t - lastFrame > HOLD_MS) followed = null;
      lastFrame = t;
      if (hand !== null && (followed === null || hand === followed)) {
        const status = followed === null ? 'new' : 'tracked';
        followed = hand;
        lastSeen = t;
        return status;
      }
      if (followed !== null && t - lastSeen < HOLD_MS) return 'held';
      followed = null;
      return 'gone';
    },
    reset() {
      followed = null;
    }
  };
}
