/**
 * Draws what the tracker sees over the video: 21 landmarks, their connections and the palm center,
 * plus the gesture with its confidence, the "Raise your hand" hint and the frame rate.
 * Landmarks arrive already mirrored, so nothing here flips them; they are placed inside the
 * letterboxed video's rectangle.
 */
import { HAND_CONNECTIONS } from '../hands/tracker';
import type { HandState, Point } from '../hands/types';
import { createFpsMeter } from './fpsMeter';
import { gestureText } from './gestureLabels';

export interface Overlay {
  draw(s: HandState, landmarks: Point[] | null): void;
  /** Shown only while the tracker runs. */
  setVisible(visible: boolean): void;
}

export function createOverlay(panel: HTMLElement, video: HTMLVideoElement, canvas: HTMLCanvasElement): Overlay {
  const ctx = canvas.getContext('2d')!;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const hint = label('overlay-hint', 'Raise your hand');
  const gesture = label('overlay-gesture', '');
  const fps = label('overlay-fps', '— fps');
  const meter = createFpsMeter();
  let last: { s: HandState; landmarks: Point[] | null } | null = null;
  let visible = false;

  // Canvas pixels follow the panel size and the screen density, so lines stay sharp and aligned.
  new ResizeObserver(() => {
    canvas.width = Math.round(canvas.clientWidth * devicePixelRatio);
    canvas.height = Math.round(canvas.clientHeight * devicePixelRatio);
    render();
  }).observe(canvas);

  function label(className: string, text: string) {
    const el = document.createElement('p');
    el.className = `overlay-label ${className}`;
    el.textContent = text;
    el.hidden = true;
    panel.append(el);
    return el;
  }

  /** Where the video frame sits inside the canvas with object-fit: contain, in CSS pixels. */
  function videoRect() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const scale = Math.min(cw / video.videoWidth, ch / video.videoHeight);
    const w = video.videoWidth * scale;
    const h = video.videoHeight * scale;
    return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!visible || !last?.s.present || !last.landmarks || !video.videoWidth || !canvas.clientWidth) return;

    const r = videoRect();
    const at = (p: Point) => [r.x + p.x * r.w, r.y + p.y * r.h] as const;
    const points = last.landmarks;
    ctx.setTransform(canvas.width / canvas.clientWidth, 0, 0, canvas.height / canvas.clientHeight, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb) continue;
      ctx.moveTo(...at(pa));
      ctx.lineTo(...at(pb));
    }
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(...at(p), 3, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(...at(last.s.palm), 9, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  return {
    draw(s, landmarks) {
      last = { s, landmarks };
      const reading = meter.tick(s.t);
      const fpsText = reading === null ? '— fps' : `${reading} fps`;
      if (fps.textContent !== fpsText) fps.textContent = fpsText;
      hint.hidden = !visible || s.present;
      gesture.hidden = !visible || !s.present;
      gesture.textContent = gestureText(s.gesture, s.gestureScore);
      render();
    },
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      fps.hidden = !visible;
      hint.hidden = !visible || !!last?.s.present;
      gesture.hidden = !visible || !last?.s.present;
      render();
    }
  };
}
