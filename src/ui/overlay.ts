/**
 * Draws over the video: the note lanes with the played one highlighted, what the tracker sees (21
 * landmarks, their connections and the palm center), the gesture with its confidence, the "Raise your
 * hand" hint and the frame rate. Landmarks and lanes are in the player's mirrored view already, so
 * nothing here flips them; they are placed inside the letterboxed video's rectangle.
 */
import { HAND_CONNECTIONS } from '../hands/tracker';
import type { HandState, Point } from '../hands/types';
import { NOTE_LANES, PLAYING_ZONE } from '../mapping/handToSynth';
import { createFpsMeter } from './fpsMeter';
import { gestureText } from './gestureLabels';

const NO_FPS = '— fps';
/** In a camera panel narrower than this, in CSS pixels, the lanes go without their note names. */
const NAMES_MIN_WIDTH = 320;

type Rect = { x: number; y: number; w: number; h: number };

export interface Overlay {
  /** `lane` is the note lane being played, highlighted; null highlights none. */
  draw(s: HandState, landmarks: Point[] | null, lane: number | null): void;
  /** Shown only while the tracker runs. */
  setVisible(visible: boolean): void;
}

export function createOverlay(panel: HTMLElement, video: HTMLVideoElement, canvas: HTMLCanvasElement): Overlay {
  const ctx = canvas.getContext('2d')!;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const hint = label('overlay-hint', 'Raise your hand');
  const gesture = label('overlay-gesture', '');
  const fps = label('overlay-fps', NO_FPS);
  let meter = createFpsMeter();
  let last: { s: HandState; landmarks: Point[] | null; lane: number | null } | null = null;
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
  function videoRect(): Rect {
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
    if (!visible || !video.videoWidth || !canvas.clientWidth) return;

    const r = videoRect();
    ctx.setTransform(canvas.width / canvas.clientWidth, 0, 0, canvas.height / canvas.clientHeight, 0, 0);
    // The lanes show with no hand too, so the player sees where to play before raising one.
    drawLanes(r, last?.lane ?? null);
    if (!last?.s.present || !last.landmarks) return;

    const at = (p: Point) => [r.x + p.x * r.w, r.y + p.y * r.h] as const;
    const points = last.landmarks;
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

  /** The note lanes across the playing zone, each named at its foot. */
  function drawLanes(r: Rect, played: number | null) {
    const size = PLAYING_ZONE.end - PLAYING_ZONE.start;
    const zone = { x: r.x + PLAYING_ZONE.start * r.w, y: r.y + PLAYING_ZONE.start * r.h, w: size * r.w, h: size * r.h };
    const laneWidth = zone.w / NOTE_LANES.length;

    if (played !== null) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = accent;
      ctx.fillRect(zone.x + played * laneWidth, zone.y, laneWidth, zone.h);
      ctx.globalAlpha = 1;
    }

    // One path, stroked once, so the borders two lanes share are no brighter than the outer ones.
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    for (let i = 1; i < NOTE_LANES.length; i++) {
      ctx.moveTo(zone.x + i * laneWidth, zone.y);
      ctx.lineTo(zone.x + i * laneWidth, zone.y + zone.h);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(255 255 255 / 0.3)';
    ctx.stroke();

    if (canvas.clientWidth < NAMES_MIN_WIDTH) return;
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    NOTE_LANES.forEach((note, i) => {
      ctx.fillStyle = i === played ? accent : 'rgb(255 255 255 / 0.75)';
      ctx.fillText(note.name, zone.x + (i + 0.5) * laneWidth, zone.y + zone.h - 6);
    });
  }

  return {
    draw(s, landmarks, lane) {
      last = { s, landmarks, lane };
      const reading = meter.tick(s.t);
      const fpsText = reading === null ? NO_FPS : `${reading} fps`;
      if (fps.textContent !== fpsText) fps.textContent = fpsText;
      hint.hidden = !visible || s.present;
      gesture.hidden = !visible || !s.present;
      gesture.textContent = gestureText(s.gesture, s.gestureScore);
      render();
    },
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      // The sliders feed draw() too: start from no hand and no reading, not from their last state.
      last = null;
      meter = createFpsMeter();
      fps.textContent = NO_FPS;
      fps.hidden = !visible;
      hint.hidden = !visible;
      gesture.hidden = true;
      render();
    }
  };
}
