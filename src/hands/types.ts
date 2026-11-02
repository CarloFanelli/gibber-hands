/** A point in the player's mirrored view, 0..1 (x right, y down). */
export interface Point {
  x: number;
  y: number;
}

/** The seven gestures MediaPipe's Gesture Recognizer names. */
export const GESTURE_NAMES = ['Closed_Fist', 'Open_Palm', 'Pointing_Up', 'Thumb_Down', 'Thumb_Up', 'Victory', 'ILoveYou'] as const;
export type GestureName = (typeof GESTURE_NAMES)[number];

/** Normalized hand state. Everything downstream depends only on this shape. */
export interface HandState {
  /** True while a hand is tracked, and for up to 150 ms after it is lost (or while the sliders are shown). */
  present: boolean;
  /** Named gesture, or null for none. */
  gesture: GestureName | null;
  /** Confidence 0..1 of `gesture`. */
  gestureScore: number;
  /** Palm center: wrist and four knuckles averaged. 0.5/0.5 when no hand is present. */
  palm: Point;
  /** Thumb tip ↔ index tip distance divided by hand size, 0..1 (0 = touching). */
  pinch: number;
  /** Thumb tip ↔ middle tip distance divided by hand size, 0..1. Secondary control. */
  pinchMiddle: number;
  /** Timestamp (performance.now()). */
  t: number;
}

export const EMPTY_HAND: HandState = {
  present: false,
  gesture: null,
  gestureScore: 0,
  palm: { x: 0.5, y: 0.5 },
  pinch: 1,
  pinchMiddle: 1,
  t: 0
};
