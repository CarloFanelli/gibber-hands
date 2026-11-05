import { describe, expect, it } from 'vitest';
import { createPointFilter } from '../src/hands/smoothing';

const FRAME_MS = 1000 / 30;

/** Deterministic noise in -1..1 (sum of uniforms, roughly Gaussian). */
function noise(seed: number) {
  let s = seed;
  const uniform = () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
  return () => (uniform() + uniform() + uniform() - 1.5) / 1.5;
}

function std(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}

describe('palm center smoothing', () => {
  it('keeps a still hand within 0.3% of the view over 1 s', () => {
    const filter = createPointFilter();
    const jitter = noise(7);
    const xs: number[] = [];
    const raw: number[] = [];
    for (let i = 0; i < 60; i++) {
      const x = 0.5 + 0.015 * jitter();
      raw.push(x);
      xs.push(filter.filter({ x, y: 0.5 }, i * FRAME_MS).x);
    }
    const lastSecond = xs.slice(30);
    expect(std(raw.slice(30))).toBeGreaterThan(0.004);
    expect(std(lastSecond)).toBeLessThanOrEqual(0.003);
  });

  it('lags fast movement by at most one frame', () => {
    const filter = createPointFilter();
    const speed = 0.5 / 1000; // half the view per second
    let lag = 0;
    for (let i = 0; i < 30; i++) {
      const t = i * FRAME_MS;
      const x = 0.2 + speed * t;
      const out = filter.filter({ x, y: 0.5 }, t);
      if (i >= 15) lag = Math.max(lag, x - out.x);
    }
    expect(lag).toBeLessThanOrEqual(speed * FRAME_MS);
  });

  it('restarts at the new position after a reset, with no glide from the old one', () => {
    const filter = createPointFilter();
    filter.filter({ x: 0.1, y: 0.1 }, 0);
    filter.filter({ x: 0.1, y: 0.1 }, FRAME_MS);
    filter.reset();
    expect(filter.filter({ x: 0.9, y: 0.8 }, 2 * FRAME_MS)).toEqual({ x: 0.9, y: 0.8 });
  });
});
