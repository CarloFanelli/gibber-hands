import { describe, expect, it } from 'vitest';
import { savedSidePanel, storedSidePanel } from '../src/ui/sidePanel';

describe('savedSidePanel', () => {
  it('reads whether the side panel was open and which tab it showed', () => {
    expect(savedSidePanel('{"open":false,"tab":"gestures"}')).toEqual({ open: false, tab: 'gestures' });
    expect(savedSidePanel('{"open":true,"tab":"code"}')).toEqual({ open: true, tab: 'code' });
  });

  it('opens on the Code tab on a first visit, with storage blocked, or with an unreadable value', () => {
    for (const stored of [null, '', 'abc', '[]', 'null', '{"open":"yes","tab":"code"}', '{"open":true,"tab":"drums"}', '{"tab":"code"}']) {
      expect(savedSidePanel(stored)).toEqual({ open: true, tab: 'code' });
    }
  });

  it('reads back what it stores', () => {
    const state = { open: false, tab: 'gestures' } as const;
    expect(savedSidePanel(storedSidePanel(state))).toEqual(state);
  });
});
