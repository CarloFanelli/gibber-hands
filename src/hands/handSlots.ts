/**
 * Which tracked hand is which, frame by frame: up to two hands, each on the player's right or left side.
 * A new hand takes the side of its left/right reading and keeps it until it is gone, so a flickering
 * reading or crossed hands never swap sides. Hands are followed by where their palm center was last
 * seen, not by their reading. A hand missing for under HOLD_MS is still present; a third hand is
 * ignored until a side is free.
 */
import { SIDES, type Point, type Side } from './types';

const HOLD_MS = 150;
/** A hand nearer than this to where a tracked hand was last seen (in view widths) is that hand, whatever its reading. */
const NEAR = 0.25;
/** Matching a hand whose reading differs from the tracked one's costs this much extra distance, so crossed hands keep their sides. */
const READING_COST = 0.1;

/** One hand the model reports: its palm center in the player's view, and its "Left" or "Right" reading. */
export interface SeenHand {
  palm: Point;
  label: string;
}

/** new: smoothing restarts · tracked: same hand · held: keep the last values · gone: no hand. `index` is the hand's place in the frame's list. */
export type SlotStatus = { kind: 'new' | 'tracked'; index: number } | { kind: 'held' } | { kind: 'gone' };

export interface HandSlots {
  update(hands: readonly SeenHand[], t: number): Record<Side, SlotStatus>;
  reset(): void;
}

interface Slot {
  palm: Point;
  label: string;
  lastSeen: number;
}

export function createHandSlots(): HandSlots {
  let slots: Record<Side, Slot | null> = { right: null, left: null };
  let lastFrame = Number.NEGATIVE_INFINITY;

  return {
    update(hands, t) {
      // Frames further apart than the hold (background tab, stalled camera) leave nothing to hold on to.
      if (t - lastFrame > HOLD_MS) slots = { right: null, left: null };
      lastFrame = t;

      const tracked = match(slots, hands);
      const free = SIDES.filter((side) => slots[side] === null);
      const fresh = claim(hands, [...tracked.values()], free);

      const status = {} as Record<Side, SlotStatus>;
      for (const side of SIDES) {
        const index = tracked.get(side) ?? fresh.get(side);
        const hand = index === undefined ? undefined : hands[index];
        if (index !== undefined && hand) {
          slots[side] = { palm: hand.palm, label: hand.label, lastSeen: t };
          status[side] = { kind: tracked.has(side) ? 'tracked' : 'new', index };
        } else if (slots[side] && t - slots[side].lastSeen < HOLD_MS) {
          status[side] = { kind: 'held' };
        } else {
          slots[side] = null;
          status[side] = { kind: 'gone' };
        }
      }
      return status;
    },
    reset() {
      slots = { right: null, left: null };
    }
  };
}

/** Each tracked hand's place in this frame's list: as many matched as possible, then the least total distance. */
function match(slots: Record<Side, Slot | null>, hands: readonly SeenHand[]): Map<Side, number> {
  const live = SIDES.filter((side) => slots[side] !== null);
  let best = { pairs: new Map<Side, number>(), cost: 0 };

  function walk(i: number, pairs: Map<Side, number>, cost: number) {
    const side = live[i];
    const slot = side && slots[side];
    if (!side || !slot) {
      if (pairs.size > best.pairs.size || (pairs.size === best.pairs.size && cost < best.cost)) best = { pairs, cost };
      return;
    }
    walk(i + 1, pairs, cost);
    const taken = [...pairs.values()];
    hands.forEach((hand, index) => {
      if (taken.includes(index)) return;
      const distance = Math.hypot(hand.palm.x - slot.palm.x, hand.palm.y - slot.palm.y);
      const sameReading = hand.label === slot.label;
      if (distance > NEAR && !sameReading) return;
      walk(i + 1, new Map(pairs).set(side, index), cost + distance + (sameReading ? 0 : READING_COST));
    });
  }
  walk(0, new Map(), 0);
  return best.pairs;
}

/** Gives free sides to hands no tracked hand matched: first by their reading, then whatever side is left. */
function claim(hands: readonly SeenHand[], matched: number[], free: Side[]): Map<Side, number> {
  const fresh = new Map<Side, number>();
  const newcomers = hands.map((_, index) => index).filter((index) => !matched.includes(index));
  // Two hands reading the same side: the one further toward that side wins it.
  for (const index of newcomers) {
    const side: Side = hands[index]!.label === 'Left' ? 'left' : 'right';
    const rival = fresh.get(side);
    if (free.includes(side) && (rival === undefined || further(side, hands[index]!, hands[rival]!))) fresh.set(side, index);
  }
  for (const index of newcomers) {
    if ([...fresh.values()].includes(index)) continue;
    const side = free.find((s) => !fresh.has(s));
    if (side) fresh.set(side, index);
  }
  return fresh;
}

function further(side: Side, a: SeenHand, b: SeenHand): boolean {
  return side === 'right' ? a.palm.x > b.palm.x : a.palm.x < b.palm.x;
}
