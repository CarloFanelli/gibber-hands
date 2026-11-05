/**
 * The drum loop's clock. It runs in Gibber's audio worklet, so tracking never moves a hit: the engine sends
 * installDrumClock's source text there, like its sound graphs. It must use only its arguments and its own
 * locals. No Gibber import here, so tests run it on a stand-in.
 */

/** A drum pattern at some drum layers, as the clock plays it. */
export interface DrumWish {
  /** Each step's hits, in bar order: [drum, loudness], the drum by its place in the kit. */
  steps: [number, number][][];
  /** A step's length in samples, unrounded. */
  samples: number;
  /** A DRUM_PATTERNS index: a new one waits for the bar, the same one at new layers for the beat. */
  pattern: number;
  layers: number;
  /** Each echo time's sound object id, and its length in samples at this tempo. */
  echoes: [number, number][];
}

export interface DrumClock {
  /** Plays `wish` from `lead` samples on, over and over, setting its echo times now. */
  play(wish: DrumWish, lead: number): void;
  /** Plays `wish` from the next bar, or from the next beat for new layers of the pattern playing; a later wish replaces it. */
  wish(wish: DrumWish): void;
  /** Stops at once, and sets the echo times to `echoes`. */
  stop(echoes: [number, number][]): void;
}

/** What the clock uses of the worklet's Gibberish. */
export interface WorkletGibberish {
  /** Runs each function once its time comes, checked every sample; `phase` counts the samples rendered. */
  scheduler: { readonly phase: number; add(samples: number, func: () => void): void };
  processor: {
    /** The worklet's sound objects, by the id their page-side copies carry. */
    ugens: Map<number, { trigger(loudness: number): void; level: number }>;
    port: { postMessage(message: { address: string; pattern: number; layers: number }): void };
  };
}

/**
 * Installs the clock as `G.drumClock`; `kit` are the drums' ids, in kit order. Each step's time is reckoned
 * from the start of the loop or of its tempo, so rounding to whole samples never adds up. Each drum
 * pattern and drum layers it starts playing are reported to the page as a "handDrums" message.
 */
export function installDrumClock(G: WorkletGibberish, kit: number[]) {
  const drums = kit.map((id) => G.processor.ugens.get(id)!);
  const scheduler = G.scheduler;
  // Each play() is a run; a step of an earlier run, still waiting in the scheduler, does nothing.
  let run = 0;
  let playing: DrumWish | null = null;
  let waiting: DrumWish | null = null;
  const setEchoes = (echoes: [number, number][]) => {
    for (const [id, samples] of echoes) G.processor.ugens.get(id)!.level = samples;
  };
  const start = (wish: DrumWish) => {
    playing = wish;
    setEchoes(wish.echoes);
    G.processor.port.postMessage({ address: 'handDrums', pattern: wish.pattern, layers: wish.layers });
  };
  const clock: DrumClock = {
    play(wish, lead) {
      const current = ++run;
      waiting = null;
      start(wish);
      let from = scheduler.phase + lead;
      let n = 0;
      const step = () => {
        if (current !== run || !playing) return;
        const inBar = n % playing.steps.length;
        // A beat is 4 sixteenth steps.
        if (waiting && (inBar === 0 || (waiting.pattern === playing.pattern && inBar % 4 === 0))) {
          if (waiting.samples !== playing.samples) {
            // The new tempo counts from this bar start.
            from = scheduler.phase;
            n = 0;
          }
          start(waiting);
          waiting = null;
        }
        for (const [drum, loudness] of playing.steps[n % playing.steps.length]!) drums[drum]!.trigger(loudness);
        n++;
        scheduler.add(Math.round(from + n * playing.samples) - scheduler.phase, step);
      };
      scheduler.add(lead, step);
    },
    wish(wish) {
      waiting = wish;
    },
    stop(echoes) {
      run++;
      playing = waiting = null;
      setEchoes(echoes);
    }
  };
  (G as WorkletGibberish & { drumClock: DrumClock }).drumClock = clock;
}
