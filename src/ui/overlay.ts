/**
 * Draws over the video: the note lanes with the played ones highlighted, what the tracker sees of each
 * hand (21 landmarks, their connections and the palm center), each hand's gesture with its confidence on
 * its own side, the "Raise your hand" hint and the frame rate. Landmarks and lanes are in the player's mirrored view already, so
 * nothing here flips them; they are placed inside the letterboxed video's rectangle.
 */
import { HAND_CONNECTIONS } from '../hands/tracker';
import { SIDES, type HandPair, type Point, type Side, type TrackedHand } from '../hands/types';
import { LANE_COUNT, PLAYING_ZONE } from '../mapping/handToSynth';
import { createFpsMeter } from './fpsMeter';
import { gestureText } from './gestureLabels';

const NO_FPS = '— fps';
/** In a camera panel narrower than this, in CSS pixels, the lanes go without their note names. */
const NAMES_MIN_WIDTH = 320;

type Rect = { x: number; y: number; w: number; h: number };

export interface Overlay {
  /** `played` are the note lanes being played, highlighted. */
  draw(pair: HandPair, played: readonly number[]): void;
  /** Shown only while the tracker runs. */
  setVisible(visible: boolean): void;
  /** Names the note lanes, left to right: the current preset's notes. */
  setLanes(names: readonly string[]): void;
  /** Hides the "Raise your hand" label while a step hint says it. */
  hideRaiseHand(hidden: boolean): void;
}

export function createOverlay(panel: HTMLElement, video: HTMLVideoElement, canvas: HTMLCanvasElement): Overlay {
  const ctx = canvas.getContext('2d')!;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const hint = label('overlay-hint', 'Raise your hand');
  const fps = label('overlay-fps', NO_FPS);
  const gestures: Record<Side, HTMLElement> = {
    right: label('overlay-gesture overlay-gesture-right', ''),
    left: label('overlay-gesture overlay-gesture-left', '')
  };
  let meter = createFpsMeter();
  let last: { pair: HandPair; played: readonly number[] } | null = null;
  let visible = false;
  let laneNames: readonly string[] = [];
  let raiseHandHidden = false;

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

  function anyHand() {
    return SIDES.some((side) => last?.pair[side].state.present ?? false);
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
    drawLanes(r, last?.played ?? []);
    for (const side of SIDES) {
      const hand = last?.pair[side];
      if (hand) drawHand(r, hand);
    }
  }

  function drawHand(r: Rect, hand: TrackedHand) {
    const points = hand.landmarks;
    if (!hand.state.present || !points) return;
    const at = (p: Point) => [r.x + p.x * r.w, r.y + p.y * r.h] as const;
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
    ctx.arc(...at(hand.state.palm), 9, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  /** The note lanes across the playing zone, each named at its foot. */
  function drawLanes(r: Rect, played: readonly number[]) {
    const size = PLAYING_ZONE.end - PLAYING_ZONE.start;
    const zone = { x: r.x + PLAYING_ZONE.start * r.w, y: r.y + PLAYING_ZONE.start * r.h, w: size * r.w, h: size * r.h };
    const laneWidth = zone.w / LANE_COUNT;

    // Two hands in one lane light it once, no brighter.
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = accent;
    for (const lane of new Set(played)) ctx.fillRect(zone.x + lane * laneWidth, zone.y, laneWidth, zone.h);
    ctx.globalAlpha = 1;

    // One path, stroked once, so the borders two lanes share are no brighter than the outer ones.
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    for (let i = 1; i < LANE_COUNT; i++) {
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
    // A dark outline keeps the names readable over a bright background.
    ctx.save();
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgb(11 15 20 / 0.9)';
    laneNames.forEach((name, i) => {
      const x = zone.x + (i + 0.5) * laneWidth;
      const y = zone.y + zone.h - 6;
      ctx.strokeText(name, x, y);
      ctx.fillStyle = played.includes(i) ? accent : 'rgb(255 255 255 / 0.75)';
      ctx.fillText(name, x, y);
    });
    ctx.restore();
  }

  return {
    draw(pair, played) {
      last = { pair, played };
      const reading = meter.tick(pair.right.state.t);
      const fpsText = reading === null ? NO_FPS : `${reading} fps`;
      if (fps.textContent !== fpsText) fps.textContent = fpsText;
      hint.hidden = !visible || anyHand() || raiseHandHidden;
      for (const side of SIDES) {
        const { state } = pair[side];
        gestures[side].hidden = !visible || !state.present;
        gestures[side].textContent = gestureText(state.gesture, state.gestureScore);
      }
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
      hint.hidden = !visible || raiseHandHidden;
      for (const side of SIDES) gestures[side].hidden = true;
      render();
    },
    setLanes(names) {
      laneNames = names;
      render();
    },
    hideRaiseHand(hidden) {
      if (hidden === raiseHandHidden) return;
      raiseHandHidden = hidden;
      hint.hidden = !visible || hidden || anyHand();
    }
  };
}
