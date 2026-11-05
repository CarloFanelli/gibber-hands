import { describe, expect, it } from 'vitest';
import { shortcut, type KeyPress } from '../src/ui/shortcuts';

/** A key pressed once, with no modifier, while nothing in particular has focus. */
function press(key: string, more: Partial<KeyPress> = {}): KeyPress {
  return { key, repeat: false, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...more };
}

describe('shortcut', () => {
  it('picks presets 1 to 6 with the number keys', () => {
    for (let n = 1; n <= 6; n++) expect(shortcut(press(String(n)), 'other')).toEqual({ kind: 'preset', index: n - 1 });
  });

  it('ignores number keys with no preset', () => {
    expect(shortcut(press('0'), 'other')).toBeNull();
    expect(shortcut(press('7'), 'other')).toBeNull();
  });

  it('starts or stops audio with Space', () => {
    expect(shortcut(press(' '), 'other')).toEqual({ kind: 'audio' });
  });

  it('leaves Space to a focused preset card or button: it selects the preset, audio does not toggle', () => {
    expect(shortcut(press(' '), 'control')).toBeNull();
  });

  it('keeps the other shortcuts while a button has focus', () => {
    expect(shortcut(press('2'), 'control')).toEqual({ kind: 'preset', index: 1 });
    expect(shortcut(press('c'), 'control')).toEqual({ kind: 'code' });
  });

  it('hides or shows the live code with C, in either case', () => {
    expect(shortcut(press('c'), 'other')).toEqual({ kind: 'code' });
    expect(shortcut(press('C', { shiftKey: true }), 'other')).toEqual({ kind: 'code' });
  });

  it('leaves the live code shown when C is typed in the gesture menu or a slider', () => {
    expect(shortcut(press('c'), 'field')).toBeNull();
    expect(shortcut(press('1'), 'field')).toBeNull();
    expect(shortcut(press(' '), 'field')).toBeNull();
  });

  it('starts or stops the drums with D, in either case, also while a button has focus', () => {
    expect(shortcut(press('d'), 'other')).toEqual({ kind: 'drums' });
    expect(shortcut(press('D', { shiftKey: true }), 'other')).toEqual({ kind: 'drums' });
    expect(shortcut(press('d'), 'control')).toEqual({ kind: 'drums' });
  });

  it('leaves the drums alone when D is typed in the gesture menu or a slider, or held down', () => {
    expect(shortcut(press('d'), 'field')).toBeNull();
    expect(shortcut(press('d', { repeat: true }), 'other')).toBeNull();
  });

  it('opens or closes help with "?", also when the layout needs Shift for it', () => {
    expect(shortcut(press('?'), 'other')).toEqual({ kind: 'help' });
    expect(shortcut(press('?', { shiftKey: true }), 'other')).toEqual({ kind: 'help' });
  });

  it('closes help with "?" from its Close button', () => {
    expect(shortcut(press('?', { shiftKey: true }), 'control')).toEqual({ kind: 'help' });
  });

  it('leaves Escape to the help sheet: with the sheet closed, it does nothing', () => {
    expect(shortcut(press('Escape'), 'other')).toBeNull();
  });

  it('acts once per press: a held key repeating does nothing', () => {
    expect(shortcut(press('3', { repeat: true }), 'other')).toBeNull();
    expect(shortcut(press(' ', { repeat: true }), 'other')).toBeNull();
    expect(shortcut(press('?', { repeat: true, shiftKey: true }), 'other')).toBeNull();
  });

  it('leaves the browser and system shortcuts alone: Ctrl, Cmd or Alt held', () => {
    expect(shortcut(press('c', { ctrlKey: true }), 'other')).toBeNull();
    expect(shortcut(press('1', { metaKey: true }), 'other')).toBeNull();
    expect(shortcut(press('c', { altKey: true }), 'other')).toBeNull();
  });
});
