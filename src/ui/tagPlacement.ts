/**
 * Where each hand tag sits over the camera picture, in CSS px: centred under its palm center, above it when
 * there is no room below, always inside the picture. A tag that would overlap the one before it stacks on the
 * side of it away from that palm (under a tag below its palm, above a tag above it), the other way when there
 * is no room. Pure, so draw() can call it on every frame.
 */
import type { Rect } from './zoneWidth';

/** The gap between a palm center and its tag, in px: clear of the palm circle the overlay draws. */
export const TAG_OFFSET = 36;
/** The gap between two stacked tags, in px. */
export const TAG_GAP = 4;

/** A tag to place: its palm center (x, y) and its size (w, h), in px. */
export interface TagAnchor {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TagPosition {
  left: number;
  top: number;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

export function placeTags(anchors: readonly TagAnchor[], picture: Rect): TagPosition[] {
  const bottom = picture.y + picture.h;
  const inside = (top: number, h: number) => clamp(top, picture.y, bottom - h);
  const placed: (TagPosition & { w: number; h: number; above: boolean })[] = [];
  for (const a of anchors) {
    const below = a.y + TAG_OFFSET;
    const above = below + a.h > bottom;
    let top = inside(above ? a.y - TAG_OFFSET - a.h : below, a.h);
    const left = clamp(a.x - a.w / 2, picture.x, picture.x + picture.w - a.w);
    const prev = placed[placed.length - 1];
    if (prev && left < prev.left + prev.w && prev.left < left + a.w && top < prev.top + prev.h && prev.top < top + a.h) {
      const under = prev.top + prev.h + TAG_GAP;
      const over = prev.top - TAG_GAP - a.h;
      const fitsUnder = under + a.h <= bottom;
      const fitsOver = over >= picture.y;
      top = inside((prev.above ? fitsOver || !fitsUnder : !fitsUnder) ? over : under, a.h);
    }
    placed.push({ left, top, w: a.w, h: a.h, above });
  }
  return placed.map(({ left, top }) => ({ left, top }));
}
