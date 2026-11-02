import { describe, expect, it } from 'vitest';
import { createFpsMeter } from '../src/ui/fpsMeter';

describe('fps meter', () => {
  it('has no reading during the first second', () => {
    const meter = createFpsMeter();
    for (let t = 0; t < 1000; t += 40) expect(meter.tick(t)).toBeNull();
  });

  it('reads frames per second once per second', () => {
    const meter = createFpsMeter();
    let reading: number | null = null;
    for (let t = 0; t <= 1000; t += 40) reading = meter.tick(t);
    expect(reading).toBe(25);
    expect(meter.tick(1040)).toBe(25);
  });

  it('restarts with no reading after frames stop for more than a second', () => {
    const meter = createFpsMeter();
    for (let t = 0; t <= 1000; t += 40) meter.tick(t);
    expect(meter.tick(5000)).toBeNull();
  });
});
