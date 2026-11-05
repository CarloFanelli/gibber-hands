/** How the seven gestures are named to the player. */
import type { GestureName } from '../hands/types';

export const GESTURE_LABELS: Record<GestureName, string> = {
  Closed_Fist: 'Closed fist',
  Open_Palm: 'Open palm',
  Pointing_Up: 'Pointing up',
  Thumb_Down: 'Thumb down',
  Thumb_Up: 'Thumb up',
  Victory: 'Victory',
  ILoveYou: 'I love you'
};

/** "Pointing up · 87%", or "No gesture". */
export function gestureText(gesture: GestureName | null, score: number): string {
  return gesture ? `${GESTURE_LABELS[gesture]} · ${Math.round(score * 100)}%` : 'No gesture';
}
