/** Normalized hand state. Everything downstream depends only on this shape. */
export interface HandState {
  /** True when at least one hand is tracked (or a slider is being moved). */
  present: boolean;
  /** Named gesture from MediaPipe's Gesture Recognizer, e.g. 'Open_Palm', 'Closed_Fist', 'Pointing_Up', or null. */
  gesture: string | null;
  /** Confidence 0..1 of `gesture`. */
  gestureScore: number;
  /** Index fingertip position, normalized 0..1 (x right, y down), or null. */
  index: { x: number; y: number } | null;
  /** Distance thumb tip ↔ index tip, normalized 0..1 (0 = pinched). */
  pinch: number;
  /** Distance thumb tip ↔ middle tip, normalized 0..1. Secondary control. */
  pinchMiddle: number;
  /** Which hand, if known. */
  handedness: 'Left' | 'Right' | null;
  /** Timestamp (performance.now()). */
  t: number;
}

export const EMPTY_HAND: HandState = {
  present: false,
  gesture: null,
  gestureScore: 0,
  index: null,
  pinch: 1,
  pinchMiddle: 1,
  handedness: null,
  t: 0
};
