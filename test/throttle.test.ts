import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { throttle } from '../src/ui/throttle';

describe('throttle', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** The values passed on, each with the time it was passed on at. */
  function recorder() {
    const shown: { at: number; value: number }[] = [];
    return { shown, show: throttle((value: number) => shown.push({ at: Date.now(), value }), 100) };
  }

  it('passes the first value on at once', () => {
    const { shown, show } = recorder();
    const start = Date.now();
    show(1);
    expect(shown).toEqual([{ at: start, value: 1 }]);
  });

  it('passes on at most one value per 100 ms, and the latest within 100 ms, while values arrive at 30 per second', () => {
    const { shown, show } = recorder();
    const start = Date.now();
    for (let k = 0; k < 30; k++) {
      show(k);
      vi.advanceTimersByTime(33);
    }
    const lastCall = start + 29 * 33;
    vi.advanceTimersByTime(200);

    const gaps = shown.slice(1).map((s, i) => s.at - shown[i]!.at);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(100);
    expect(shown.length).toBeLessThanOrEqual(11);
    expect(shown.at(-1)!.value).toBe(29);
    expect(shown.at(-1)!.at).toBeLessThanOrEqual(lastCall + 100);
  });

  it('passes nothing on twice when no new value arrived', () => {
    const { shown, show } = recorder();
    show(1);
    vi.advanceTimersByTime(1000);
    expect(shown).toHaveLength(1);
  });

  it('passes a value on at once again after a quiet period', () => {
    const { shown, show } = recorder();
    show(1);
    vi.advanceTimersByTime(250);
    show(2);
    expect(shown.map((s) => s.value)).toEqual([1, 2]);
    expect(shown[1]!.at - shown[0]!.at).toBe(250);
  });
});
