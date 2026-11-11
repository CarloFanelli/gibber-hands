/**
 * Where the sounds panel sits in the stage, as fractions of the room it has to move: x 0 is the left edge,
 * 1 the right, y 0 the top, 1 the bottom. Fractions keep its corner when the window resizes, keep it inside
 * the stage, and place its icon in the same corner as the open panel.
 */

export interface Fraction {
  x: number;
  y: number;
}

export interface Placement extends Fraction {
  open: boolean;
}

interface Size {
  width: number;
  height: number;
}

interface Position {
  left: number;
  top: number;
}

/** The gap the panel keeps from the stage's edges, in px. */
export const PANEL_MARGIN = 12;

/** Open in the bottom-left corner. */
const FIRST_VISIT: Placement = { x: 0, y: 1, open: true };

/** The room a box has to move along one side of the stage, at least 0. */
const room = (stage: number, box: number) => Math.max(0, stage - box - 2 * PANEL_MARGIN);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** The box's position in the stage, in px, for its fractions. */
export function placeAt(frac: Fraction, stage: Size, box: Size): Position {
  return {
    left: PANEL_MARGIN + frac.x * room(stage.width, box.width),
    top: PANEL_MARGIN + frac.y * room(stage.height, box.height)
  };
}

/** The fractions of a position in px, moved where needed to keep the box inside the stage. */
export function fractionAt(at: Position, stage: Size, box: Size): Fraction {
  const along = (pos: number, free: number) => (free === 0 ? 0 : clamp01((pos - PANEL_MARGIN) / free));
  return { x: along(at.left, room(stage.width, box.width)), y: along(at.top, room(stage.height, box.height)) };
}

/** The saved placement; open in the bottom-left corner when nothing readable is saved. */
export function savedPlacement(stored: string | null): Placement {
  try {
    const value: unknown = JSON.parse(stored ?? 'null');
    if (typeof value === 'object' && value !== null && 'x' in value && 'y' in value && 'open' in value) {
      const { x, y, open } = value;
      const isFraction = (v: unknown): v is number => typeof v === 'number' && v >= 0 && v <= 1;
      if (isFraction(x) && isFraction(y) && typeof open === 'boolean') return { x, y, open };
    }
  } catch {
    // Not JSON: the same as nothing saved.
  }
  return { ...FIRST_VISIT };
}

export function storedPlacement(placement: Placement): string {
  return JSON.stringify(placement);
}
