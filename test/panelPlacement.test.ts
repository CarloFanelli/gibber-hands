import { describe, expect, it } from 'vitest';
import { PANEL_MARGIN, fractionAt, placeAt, savedPlacement, storedPlacement } from '../src/ui/panelPlacement';

const STAGE = { width: 1000, height: 800 };
const PANEL = { width: 300, height: 500 };

describe('placeAt', () => {
  it('puts the panel in the stage’s corners, a margin from the edges', () => {
    expect(placeAt({ x: 0, y: 1 }, STAGE, PANEL)).toEqual({ left: PANEL_MARGIN, top: 800 - 500 - PANEL_MARGIN });
    expect(placeAt({ x: 1, y: 0 }, STAGE, PANEL)).toEqual({ left: 1000 - 300 - PANEL_MARGIN, top: PANEL_MARGIN });
  });

  it('keeps the same corner for a smaller box, such as the icon', () => {
    expect(placeAt({ x: 0, y: 1 }, STAGE, { width: 48, height: 48 })).toEqual({ left: PANEL_MARGIN, top: 800 - 48 - PANEL_MARGIN });
  });

  it('stays at the margin when the stage is smaller than the panel', () => {
    expect(placeAt({ x: 1, y: 1 }, { width: 200, height: 300 }, PANEL)).toEqual({ left: PANEL_MARGIN, top: PANEL_MARGIN });
  });
});

describe('fractionAt', () => {
  it('reads back where placeAt put the panel', () => {
    const frac = { x: 0.25, y: 0.5 };
    const at = placeAt(frac, STAGE, PANEL);
    expect(fractionAt(at, STAGE, PANEL)).toEqual(frac);
  });

  it('keeps a panel dragged past an edge fully inside the stage', () => {
    expect(fractionAt({ left: -400, top: 5000 }, STAGE, PANEL)).toEqual({ x: 0, y: 1 });
  });

  it('is the top-left corner when the stage leaves the panel no room to move', () => {
    expect(fractionAt({ left: 50, top: 50 }, { width: 200, height: 300 }, PANEL)).toEqual({ x: 0, y: 0 });
  });
});

describe('savedPlacement', () => {
  it('reads the saved corner fractions and whether the panel was open', () => {
    expect(savedPlacement('{"x":0.5,"y":0.2,"open":false}')).toEqual({ x: 0.5, y: 0.2, open: false });
  });

  it('is open in the bottom-left corner on a first visit or with an unreadable value', () => {
    for (const stored of [null, '', 'abc', '{}', '{"x":2,"y":0,"open":true}', '{"x":0,"y":-1,"open":true}', '{"x":0,"y":0,"open":1}', '{"x":"0","y":0,"open":true}']) {
      expect(savedPlacement(stored)).toEqual({ x: 0, y: 1, open: true });
    }
  });

  it('reads back what it stores', () => {
    const placement = { x: 0.3, y: 0.7, open: false };
    expect(savedPlacement(storedPlacement(placement))).toEqual(placement);
  });
});
