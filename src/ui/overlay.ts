/**
 * Draws over the video: the note lanes with the played ones highlighted, what the tracker sees of each
 * hand (21 landmarks, their connections and the palm center), and a hand tag that follows each hand: its
 * role and gesture with its confidence, and for the second hand its mode, and while it shapes the effect
 * amount and the octave it changed. The frame rate shows in a corner on demand (the F key). Landmarks and
 * lanes are in the player's mirrored view already, so nothing here flips them; they are placed inside the
 * letterboxed video's rectangle.
 */
import { HAND_CONNECTIONS } from '../hands/tracker';
import { SIDES, type HandPair, type Point, type Side, type TrackedHand } from '../hands/types';
import { PLAYING_ZONE } from '../mapping/handToSynth';
import type { Octave, SecondHand } from '../mapping/shape';
import { EFFECT_NAME, type Effect } from '../synth/presets';
import { createFpsMeter } from './fpsMeter';
import { gestureText } from './gestureLabels';
import { placeTags, type TagAnchor } from './tagPlacement';
import { containRect, type Rect } from './zoneWidth';

const NO_FPS = '— fps';
/** In a camera panel narrower than this, in CSS pixels, the lanes go without their note names. */
const NAMES_MIN_WIDTH = 320;

/** The second hand's mode as the camera view shows it: an icon, and words a narrow view leaves out. */
const MODE_WORDS: Record<SecondHand['mode'], [icon: string, words: string]> = { notes: ['♪', 'Notes'], shape: ['✌', 'Shape'] };
/** The octave the second hand raised or lowered, as the camera view shows it. */
const OCTAVE_WORDS: Record<'up' | 'down', [icon: string, words: string]> = { up: ['↑', 'Octave up'], down: ['↓', 'Octave down'] };

/** What the camera view says about the second hand. */
interface SecondHandView {
  side: Side;
  mode: SecondHand['mode'];
  octave: Octave;
  /** The current preset's effect and its amount, 0..1. */
  effect: { kind: Effect['kind']; amount: number };
}

export interface Overlay {
  /** `played` are the note lanes being played, highlighted. */
  draw(pair: HandPair, played: readonly number[], second: SecondHandView): void;
  /** Shown only while the tracker runs. */
  setVisible(visible: boolean): void;
  /** Names the note lanes, left to right: one name per lane, so as many lanes as names. */
  setLanes(names: readonly string[]): void;
  /** Shows the frame rate, or hides it: hidden on every page load. */
  toggleFps(): void;
}

export function createOverlay(panel: HTMLElement, video: HTMLVideoElement, canvas: HTMLCanvasElement): Overlay {
  const ctx = canvas.getContext('2d')!;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const fps = label('overlay-fps', NO_FPS);
  const tags = { right: handTag(), left: handTag() };
  let meter = createFpsMeter();
  let last: { pair: HandPair; played: readonly number[] } | null = null;
  let visible = false;
  let fpsShown = false;
  let laneNames: readonly string[] = [];

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

  /** A hand's tag: its role, its gesture, then for the second hand its mode, the effect amount and the octave. */
  function handTag() {
    const tag = document.createElement('p');
    tag.className = 'overlay-label hand-tag';
    tag.hidden = true;
    const part = (name: string) => {
      const el = document.createElement('span');
      el.className = name;
      return el;
    };
    const role = part('tag-role');
    const gesture = part('tag-gesture');
    const mode = part('tag-mode');
    // The effect's name is words a narrow view leaves out; its amount always shows.
    const effect = part('tag-effect');
    const effectName = document.createElement('span');
    effectName.className = 'label-words';
    const effectPercent = document.createElement('span');
    effect.append(effectName, ' ', effectPercent);
    const octave = part('tag-octave');
    tag.append(role, gesture, mode, effect, octave);
    panel.append(tag);
    // Measured again only when its words change: reading a size on every frame would force a layout each time.
    return { tag, role, gesture, mode, effect, effectName, effectPercent, octave, size: null as { w: number; h: number } | null };
  }

  /** Moves each shown tag next to its palm, inside the picture, stacked when they would overlap. */
  function placeHandTags(pair: HandPair) {
    const shown = SIDES.filter((side) => !tags[side].tag.hidden);
    if (shown.length === 0 || !video.videoWidth) return;
    const r = videoRect();
    const anchors: TagAnchor[] = shown.map((side) => {
      const t = tags[side];
      t.size ??= { w: t.tag.offsetWidth, h: t.tag.offsetHeight };
      const palm = pair[side].state.palm;
      return { x: r.x + palm.x * r.w, y: r.y + palm.y * r.h, ...t.size };
    });
    placeTags(anchors, r).forEach((at, i) => {
      tags[shown[i]!].tag.style.transform = `translate(${Math.round(at.left)}px, ${Math.round(at.top)}px)`;
    });
  }

  /** Where the video frame sits inside the canvas with object-fit: contain, in CSS pixels. */
  function videoRect(): Rect {
    return containRect(canvas.clientWidth, canvas.clientHeight, video.videoWidth, video.videoHeight);
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

  /** The note lanes across the playing zone, one per name, each named at its foot. */
  function drawLanes(r: Rect, played: readonly number[]) {
    const size = PLAYING_ZONE.end - PLAYING_ZONE.start;
    const zone = { x: r.x + PLAYING_ZONE.start * r.w, y: r.y + PLAYING_ZONE.start * r.h, w: size * r.w, h: size * r.h };
    const count = laneNames.length;
    const laneWidth = zone.w / count;

    // Two hands in one lane light it once, no brighter.
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = accent;
    for (const lane of new Set(played)) ctx.fillRect(zone.x + lane * laneWidth, zone.y, laneWidth, zone.h);
    ctx.globalAlpha = 1;

    // One path, stroked once, so the borders two lanes share are no brighter than the outer ones.
    ctx.beginPath();
    ctx.rect(zone.x, zone.y, zone.w, zone.h);
    for (let i = 1; i < count; i++) {
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
    draw(pair, played, second) {
      last = { pair, played };
      const reading = meter.tick(pair.right.state.t);
      setText(fps, reading === null ? NO_FPS : `${reading} fps`);
      for (const side of SIDES) {
        const { state } = pair[side];
        const t = tags[side];
        const isSecond = side === second.side;
        const wasHidden = t.tag.hidden;
        t.tag.hidden = !visible || !state.present;
        if (t.tag.hidden) continue;
        let changed = wasHidden;
        changed = setText(t.role, isSecond ? 'Second' : 'Lead') || changed;
        changed = setText(t.gesture, gestureText(state.gesture, state.gestureScore)) || changed;
        t.mode.hidden = !isSecond;
        if (isSecond && t.mode.dataset.mode !== second.mode) {
          t.mode.dataset.mode = second.mode;
          showWords(t.mode, ...MODE_WORDS[second.mode]);
          changed = true;
        }
        const shaping = isSecond && second.mode === 'shape';
        if (t.effect.hidden === shaping) changed = true;
        t.effect.hidden = !shaping;
        if (shaping) {
          changed = setText(t.effectName, EFFECT_NAME[second.effect.kind]) || changed;
          changed = setText(t.effectPercent, `${Math.round(second.effect.amount * 100)}%`) || changed;
        }
        const octaveHidden = !isSecond || second.octave === 0;
        if (t.octave.hidden !== octaveHidden) changed = true;
        t.octave.hidden = octaveHidden;
        const shift = second.octave > 0 ? 'up' : 'down';
        if (!octaveHidden && t.octave.dataset.shift !== shift) {
          t.octave.dataset.shift = shift;
          showWords(t.octave, ...OCTAVE_WORDS[shift]);
          changed = true;
        }
        if (changed) t.size = null;
      }
      placeHandTags(pair);
      render();
    },
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      // The sliders feed draw() too: start from no hand and no reading, not from their last state.
      last = null;
      meter = createFpsMeter();
      fps.textContent = NO_FPS;
      for (const side of SIDES) tags[side].tag.hidden = true;
      render();
    },
    setLanes(names) {
      // Lanes lit for another count would light the wrong strip, or one past the zone: none until the next draw().
      if (last && names.length !== laneNames.length) last = { ...last, played: [] };
      laneNames = names;
      render();
    },
    toggleFps() {
      fpsShown = !fpsShown;
      fps.hidden = !fpsShown;
    }
  };
}

/** Writes `text` only when it changed, and says whether it did: draw() runs on every frame. */
function setText(el: HTMLElement, text: string): boolean {
  if (el.textContent === text) return false;
  el.textContent = text;
  return true;
}

/** An icon, and words that a narrow camera view hides except from screen readers. */
function showWords(el: HTMLElement, icon: string, words: string) {
  const glyph = document.createElement('span');
  glyph.className = 'label-icon';
  glyph.setAttribute('aria-hidden', 'true');
  glyph.textContent = icon;
  const text = document.createElement('span');
  text.className = 'label-words';
  text.textContent = words;
  el.replaceChildren(glyph, ' ', text);
}
