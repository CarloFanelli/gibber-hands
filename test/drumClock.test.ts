import { describe, expect, it } from 'vitest';
import { installDrumClock, type DrumClock, type DrumWish, type WorkletGibberish } from '../src/synth/drumClock';

/** A worklet stand-in: a scheduler counting samples, drums and echo times that log what they get, and the port's messages. */
function worklet() {
  const queue: { time: number; func: () => void }[] = [];
  const hits: [drum: number, sample: number, loudness: number][] = [];
  const echoes: [id: number, sample: number, level: number][] = [];
  const reports: { pattern: number; layers: number; sample: number }[] = [];
  const ugens = new Map<number, { trigger(loudness: number): void; level: number }>();
  const G = {
    scheduler: {
      phase: 0,
      add(samples: number, func: () => void) {
        queue.push({ time: G.scheduler.phase + samples, func });
      }
    },
    processor: {
      ugens,
      port: { postMessage: (m: { pattern: number; layers: number }) => reports.push({ ...m, sample: G.scheduler.phase }) }
    }
  } as WorkletGibberish & { scheduler: { phase: number } };
  for (const id of [10, 11]) ugens.set(id, { trigger: (l) => hits.push([id - 10, G.scheduler.phase, l]), level: 0 });
  for (const id of [20, 21]) {
    const echo = { trigger() {}, get level() { return 0; }, set level(v: number) { echoes.push([id, G.scheduler.phase, v]); } };
    ugens.set(id, echo);
  }
  installDrumClock(G, [10, 11]);
  const clock = (G as unknown as { drumClock: DrumClock }).drumClock;
  /** Renders until sample `end`, running each function due, as Gibberish's scheduler does once per sample. */
  function runTo(end: number) {
    while (true) {
      queue.sort((a, b) => a.time - b.time);
      const next = queue[0];
      if (!next || next.time > end) break;
      G.scheduler.phase = next.time;
      queue.shift();
      next.func();
    }
    G.scheduler.phase = end;
  }
  return { clock, runTo, hits, echoes, reports };
}

/** A wish for a pattern whose drum 0 plays on every beat and drum 1 on step 2, in steps of `samples`. */
function wish(pattern: number, samples: number, layers = 4, echo = 1000): DrumWish {
  const steps = Array.from({ length: 16 }, (_, step): [number, number][] => [
    ...(step % 4 === 0 ? [[0, 1] as [number, number]] : []),
    ...(step === 2 && layers > 1 ? [[1, 0.5] as [number, number]] : [])
  ]);
  return { steps, samples, pattern, layers, echoes: [[20, echo], [21, echo * 1.5]] };
}

const kickTimes = (hits: [number, number, number][]) => hits.filter(([d]) => d === 0).map(([, t]) => t);

describe('drum clock', () => {
  it('plays each step from the lead on, every hit on the grid of the loop’s start, never drifting', () => {
    const { clock, runTo, hits } = worklet();
    // 110 BPM at 44.1 kHz: a step is 6013.6… samples.
    const samples = (60 / 110 / 4) * 44_100;
    clock.play(wish(0, samples), 1323);
    runTo(44_100 * 300);
    const kicks = kickTimes(hits);
    expect(kicks[0]).toBe(1323);
    kicks.forEach((t, i) => expect(Math.abs(t - (1323 + i * 4 * samples))).toBeLessThanOrEqual(0.5));
    expect(kicks.length).toBe(Math.floor((44_100 * 300 - 1323) / (4 * samples)) + 1);
  });

  it('sets the echo times and reports the pattern and layers as it starts', () => {
    const { clock, echoes, reports } = worklet();
    clock.play(wish(0, 100, 4, 900), 10);
    expect(echoes).toEqual([[20, 0, 900], [21, 0, 1350]]);
    expect(reports).toEqual([{ address: 'handDrums', pattern: 0, layers: 4, sample: 0 }]);
  });

  it('plays a new drum pattern from the start of the next bar, at its own tempo, echo times and report with it', () => {
    const { clock, runTo, hits, echoes, reports } = worklet();
    clock.play(wish(0, 100), 0);
    runTo(250);
    clock.wish(wish(1, 80, 4, 700));
    runTo(1600 + 4 * 80 * 3);
    // The bar of 16 steps of 100 samples ends at 1600: the old tempo's beats up to it, the new one's after.
    expect(kickTimes(hits)).toEqual([0, 400, 800, 1200, 1600, 1920, 2240, 2560]);
    expect(echoes.slice(2)).toEqual([[20, 1600, 700], [21, 1600, 1050]]);
    expect(reports.at(-1)).toEqual({ address: 'handDrums', pattern: 1, layers: 4, sample: 1600 });
  });

  it('plays new drum layers of the same pattern from the next beat', () => {
    const { clock, runTo, hits, reports } = worklet();
    clock.play(wish(0, 100, 1), 0);
    runTo(450);
    clock.wish(wish(0, 100, 2));
    runTo(1000);
    // The new layers land on the next beat, at 800; drum 1 plays on step 2 of a bar, so first in the next bar.
    expect(hits.filter(([d]) => d === 1).map(([, t]) => t)).toEqual([]);
    expect(reports.at(-1)).toEqual({ address: 'handDrums', pattern: 0, layers: 2, sample: 800 });
    runTo(2000);
    expect(hits.filter(([d]) => d === 1).map(([, t]) => t)).toEqual([1800]);
  });

  it('plays only the latest of several wishes made within one bar', () => {
    const { clock, runTo, reports } = worklet();
    clock.play(wish(0, 100), 0);
    runTo(100);
    clock.wish(wish(1, 100));
    runTo(300);
    clock.wish(wish(2, 100));
    runTo(1700);
    expect(reports.map((r) => r.pattern)).toEqual([0, 2]);
  });

  it('stops at once, sets the echo times back, and leaves no step of the old run behind on a new start', () => {
    const { clock, runTo, hits, echoes } = worklet();
    clock.play(wish(0, 100), 0);
    runTo(450);
    clock.stop([[20, 500], [21, 750]]);
    expect(echoes.slice(-2)).toEqual([[20, 450, 500], [21, 450, 750]]);
    runTo(1000);
    expect(kickTimes(hits)).toEqual([0, 400]);
    clock.play(wish(0, 100), 30);
    runTo(1500);
    expect(kickTimes(hits)).toEqual([0, 400, 1030, 1430]);
  });
});
