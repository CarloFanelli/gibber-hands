/**
 * Webcam + MediaPipe Tasks Vision (GestureRecognizer) → HandState stream.
 *
 * TODO (milestone 1):
 *  - request webcam with getUserMedia({ video: { facingMode: 'user' } })
 *  - load GestureRecognizer from @mediapipe/tasks-vision with the hosted .task model
 *    (https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task)
 *    using runningMode 'VIDEO' and numHands 1
 *  - on each animation frame: recognizeForVideo(video, now) → build a HandState
 *    (reuse the same geometry as handMouse: index tip = landmark 8, thumb tip = 4, middle tip = 12)
 *  - mirror x so the hand moves like in a mirror
 *  - smooth `index` and `pinch` with a small EMA (alpha ≈ 0.3) to avoid jitter
 *  - throw if the camera is denied so main.ts can fall back to sliders
 *
 * Keep MediaPipe types out of HandState: this file is the only one that knows about MediaPipe.
 */
import type { HandState } from './types';

export interface HandSource {
  onState(cb: (s: HandState) => void): void;
  stop(): void;
}

export async function createTracker(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<HandSource> {
  void video; void canvas;
  throw new Error('createTracker not implemented yet (milestone 1)');
}
