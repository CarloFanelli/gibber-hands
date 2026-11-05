/**
 * The playing zone's width on screen, in CSS pixels, which sets how many note lanes it holds. Only the
 * camera picture counts: the black bars a wider or taller panel shows around it add nothing.
 */
import { PLAYING_ZONE } from '../mapping/handToSynth';

export type Rect = { x: number; y: number; w: number; h: number };

/** Where a picture sits inside a box with object-fit: contain, in the box's pixels. */
export function containRect(boxW: number, boxH: number, pictureW: number, pictureH: number): Rect {
  const scale = Math.min(boxW / pictureW, boxH / pictureH);
  const w = pictureW * scale;
  const h = pictureH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

/** The playing zone's width in a box of this size showing a picture of that size; null without either. */
export function zoneWidth(boxW: number, boxH: number, pictureW: number, pictureH: number): number | null {
  if (!boxW || !boxH || !pictureW || !pictureH) return null;
  return (PLAYING_ZONE.end - PLAYING_ZONE.start) * containRect(boxW, boxH, pictureW, pictureH).w;
}

/**
 * Calls `cb` with the playing zone's width each time it changes: the panel resized by its bars or the
 * window, the page zoomed, or the camera picture starting or changing size. `canvas` covers the panel the
 * video is shown in.
 */
export function watchZoneWidth(canvas: HTMLCanvasElement, video: HTMLVideoElement, cb: (px: number | null) => void): void {
  let last: number | null | undefined;
  const measure = () => {
    const px = zoneWidth(canvas.clientWidth, canvas.clientHeight, video.videoWidth, video.videoHeight);
    if (px === last) return;
    last = px;
    cb(px);
  };
  new ResizeObserver(measure).observe(canvas);
  video.addEventListener('loadedmetadata', measure);
  video.addEventListener('resize', measure);
}
