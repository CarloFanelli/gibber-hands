/**
 * The audio engine, and the only file that imports Gibber.
 *
 * Each hand, right and left, has one voice per preset, built in Gibber's audio worklet: its oscillator into
 * a resonant low-pass filter, both gliding to new settings, then the preset's reverb or delay mixed with
 * the voice itself, then the preset's level. The effect runs fully wet and the mix comes after it, in two
 * levels both hands share, so the reverb or echo amount can glide: Gibber's own mix setting can't. Only the current preset's level is up; a switch glides one down and the other up, a
 * crossfade that also ends the old preset's echoes. A resting voice still runs, so its way into the effect
 * closes too: otherwise the effect would fill with its old note and replay it when the preset comes back.
 * After all of a hand's voices comes its volume, so its silence silences its tails too, whatever the other
 * hand plays. Every setting glides in the worklet: Gibber itself changes a setting in one jump, which clicks.
 * The drum loop plays Gibberish's synthesized kick, snare and hi-hats through a level of their own, down while
 * muted. A clock in the worklet triggers them, so tracking never moves a hit, and it runs on while the drums are
 * muted; while it plays, each echo's time follows its tempo.
 * Two loud hands and the drums can add up past full scale: a limiter after the worklet keeps their peaks down.
 *
 * Browsers allow audio only from a user gesture: start() must be called from the click handler.
 */
import Gibber, { type Gibberish, type GibberishUgen } from 'gibber.audio.lib/dist/gibber.audio.js';
import workletUrl from 'gibber.audio.lib/dist/gibberish_worklet.js?url';
import { SIDES, type Side } from '../hands/types';
import type { SynthParams } from '../mapping/handToSynth';
import { EngineDownloadError, audioSupported, engineFailure, type EngineFailure } from './engineFailure';
import { installDrumClock, type DrumWish } from './drumClock';
import { DRUM_PATTERNS, KIT, drumSteps, stepSamples, type Drum, type Drums } from './drumPatterns';
import { CROSSFADE_MS, CUTOFF_RAMP_MS, ECHO_TIME_RAMP_MS, EFFECT_RAMP_MS, PITCH_SLIDE_MS, TOGGLE_RAMP_MS, slideSamples } from './ramp';
import { GIBBER_BPM, PRESETS, delaySamples, reverbMix, type Oscillator, type Preset } from './presets';

export type EngineStatus = { kind: 'off' | 'starting' | 'on' } | { kind: 'failed'; failure: EngineFailure };

export interface SynthEngine {
  /** Calls `cb` with the current status at once, then on every change. */
  onStatus(cb: (s: EngineStatus) => void): void;
  /** Starts the engine, or resumes it after stop(). Ignored while starting or on. */
  start(): void;
  /** Fades everything to silence; start() resumes. */
  stop(): void;
  /** The sound each hand asks for, heard while the engine is on, and the reverb or echo amount, 0..1. */
  update(sounds: Sounds, effect: number): void;
  /** Crossfades to preset `index` (a PRESETS index), or starts on it if the engine isn't running yet. */
  setPreset(index: number): void;
  /** The drum loop to play while the engine is on, or null for none. */
  setDrums(drums: DrumsToPlay | null): void;
  /** Calls `cb` with each drum pattern and drum layers the loop starts playing, on the bar or beat they land. */
  onDrums(cb: (heard: Drums) => void): void;
}

/** A stalled download of the sound worklet counts as failed after this long. */
const DOWNLOAD_TIMEOUT_MS = 15_000;
/** Gibber's start reports no errors: one that takes longer than this has failed. */
const INIT_TIMEOUT_MS = 10_000;
/** The limiter's threshold, just above one hand's loudest peak (−4.8 dBFS), so one hand passes unchanged. */
const LIMIT_DB = -4.5;
const LIMIT_RATIO = 20;

/** The worklet's global Gibberish, as the graphs below see it. */
declare const Gibberish: {
  genish: { in(name: string): unknown; slide(input: unknown, up: unknown, down: unknown): unknown };
  oscillators: { factory(shape: Oscillator['shape'], frequency: unknown, antialias: boolean): unknown };
  filters: { factory(input: unknown, cutoff: unknown, saturation: number, props: { filterModel: number }): unknown };
};

/**
 * A voice's graph. Its source text is sent to the audio worklet and run there, so it can use only the
 * worklet's globals and its argument: every setting the engine changes comes in as a named input.
 */
function voiceGraph(shape: Oscillator['shape']) {
  const g = Gibberish.genish;
  // A setting glides to each new value over its `…Slide` input, a length in samples (1 jumps at once).
  const glide = (name: string) => {
    const samples = g.in(name + 'Slide');
    return g.slide(g.in(name), samples, samples);
  };
  // Only the pulse wave is antialiased: the plain one swings 0..1, and its offset would thump with the volume.
  const oscillator = Gibberish.oscillators.factory(shape, glide('frequency'), shape === 'pwm');
  // Filter model 1 is Gibberish's 24 dB ladder (Moog) filter, as in its stock Synth. Its resonance is the
  // `Q` input, and its cutoff a fraction of the Nyquist frequency.
  return Gibberish.filters.factory(oscillator, glide('cutoff'), 0, { filterModel: 1 });
}

/**
 * A level that glides to each new value like the voice's settings: a voice's way into its effect, a
 * preset's output, a hand's volume, the drums' level or an echo's time. Runs in the worklet too.
 */
function levelGraph() {
  const g = Gibberish.genish;
  const samples = g.in('levelSlide');
  return g.slide(g.in('level'), samples, samples);
}

interface Engine {
  /**
   * Moves each side's sound of the current preset to what its hand asks for (silence when null), each
   * volume ramping over its own ramp time, or over `rampMs` when given (Start and Stop).
   */
  play(sounds: Sounds | null, rampMs?: number): void;
  /** Glides the current preset's reverb or echo amount to `amount`, 0..1. */
  setEffect(amount: number): void;
  setPreset(index: number): void;
  /** Starts, steers, mutes or stops the drum loop, each echo's time following its tempo. */
  playDrums(drums: DrumsToPlay | null): void;
}

/** What each hand asks for, by side. */
export type Sounds = Record<Side, SynthParams>;

/** A drum loop to play: its drum pattern and drum layers, and whether a closed fist mutes it. */
export interface DrumsToPlay extends Drums {
  muted: boolean;
}

export function createSynth(): SynthEngine {
  let status: EngineStatus = { kind: 'off' };
  let listener: ((s: EngineStatus) => void) | null = null;
  let engine: Engine | null = null;
  let wanted: Sounds | null = null;
  let effect: number | null = null;
  let preset = 0;
  let drums: DrumsToPlay | null = null;
  let drumsListener: ((heard: Drums) => void) | null = null;

  function setStatus(s: EngineStatus) {
    status = s;
    listener?.(s);
  }

  return {
    onStatus(cb) {
      listener = cb;
      cb(status);
    },
    start() {
      if (status.kind === 'starting' || status.kind === 'on') return;
      if (engine) {
        engine.play(wanted, TOGGLE_RAMP_MS);
        engine.playDrums(drums);
        setStatus({ kind: 'on' });
        return;
      }
      if (!audioSupported(window)) {
        setStatus({ kind: 'failed', failure: { reason: 'unsupported' } });
        return;
      }
      let ctx: AudioContext;
      try {
        // Created here, inside the click: browsers let a page start audio only during a user gesture.
        ctx = new AudioContext({ latencyHint: 'interactive' });
      } catch (error) {
        setStatus({ kind: 'failed', failure: engineFailure(error) });
        return;
      }
      setStatus({ kind: 'starting' });
      bootEngine(ctx, preset, (heard) => drumsListener?.(heard)).then(
        (booted) => {
          engine = booted;
          // A preset picked, an effect amount set or the drums started while the engine started.
          booted.setPreset(preset);
          if (effect !== null) booted.setEffect(effect);
          booted.play(wanted, TOGGLE_RAMP_MS);
          booted.playDrums(drums);
          setStatus({ kind: 'on' });
        },
        (error: unknown) => {
          void ctx.close();
          setStatus({ kind: 'failed', failure: engineFailure(error) });
        }
      );
    },
    stop() {
      if (status.kind !== 'on' || !engine) return;
      engine.play(null, TOGGLE_RAMP_MS);
      engine.playDrums(null);
      setStatus({ kind: 'off' });
    },
    update(sounds, amount) {
      wanted = sounds;
      effect = amount;
      // Stopped, the volumes are down: the amount can move unheard, ready for Start.
      engine?.setEffect(amount);
      if (status.kind === 'on') engine?.play(sounds);
    },
    setPreset(index) {
      preset = index;
      engine?.setPreset(index);
    },
    setDrums(next) {
      drums = next;
      if (status.kind === 'on') engine?.playDrums(next);
    },
    onDrums(cb) {
      drumsListener = cb;
    }
  };
}

async function bootEngine(ctx: AudioContext, initialPreset: number, onDrums: (heard: Drums) => void): Promise<Engine> {
  const workletPath = await download(workletUrl);
  // Gibber's music theory module reads the library from window.Gibber, where a <script> tag would put it.
  Object.assign(window, { Gibber });
  const ready = Gibber.init({ workletPath, ctx });
  const G = Gibber.Audio.Gibberish;
  guardFirstRender(G);
  // Gibberish builds its audio graph on the next mousedown, keydown or touchstart, but the click that
  // started the engine has already happened: send one. Gibberish then uses `ctx`, made during that click.
  for (const type of ['mousedown', 'touchstart']) window.dispatchEvent(new Event(type));
  await timeout(ready, INIT_TIMEOUT_MS);
  URL.revokeObjectURL(workletPath);

  // The limiter acts only above one hand's loudest peak; its own make-up gain is taken back off after it.
  const limiter = new DynamicsCompressorNode(ctx, { threshold: LIMIT_DB, knee: 0, ratio: LIMIT_RATIO, attack: 0.001, release: 0.1 });
  const makeUp = new GainNode(ctx, { gain: 10 ** (-limiterMakeUpDb(LIMIT_DB, LIMIT_RATIO) / 20) });
  G.worklet.disconnect();
  G.worklet.connect(limiter).connect(makeUp).connect(ctx.destination);

  const rate = ctx.sampleRate;
  // Make runs a graph's constructor from its source text, without arguments: one per shape, the shape baked in.
  const voiceTypes = new Map<Oscillator['shape'], ReturnType<typeof G.utilities.Make>>();
  const voiceType = (oscillator: Oscillator) => {
    const known = voiceTypes.get(oscillator.shape);
    if (known) return known;
    const made = G.utilities.Make({
      name: `HandVoice_${oscillator.shape}`,
      type: 'Ugen',
      properties: {
        frequency: 440,
        frequencySlide: 1,
        cutoff: 0.05,
        cutoffSlide: 1,
        Q: 0.5,
        ...pulseWidth(oscillator)
      },
      constructor: new Function(`return (${voiceGraph})(${JSON.stringify(oscillator.shape)})`) as () => unknown
    });
    voiceTypes.set(oscillator.shape, made);
    return made;
  };
  const Level = G.utilities.Make({
    name: 'PresetLevel',
    type: 'Ugen',
    properties: { level: 0, levelSlide: slideSamples(CROSSFADE_MS, rate) },
    constructor: levelGraph
  });
  // Each preset's share of the voice itself and of its effect, starting at the preset's own amount.
  const mixes = PRESETS.map(({ effect: { mix } }) => {
    const levelSlide = slideSamples(EFFECT_RAMP_MS, rate);
    return { dry: Level({ level: 1 - mix, levelSlide }), wet: Level({ level: mix, levelSlide }), amount: mix };
  });

  // Each delay preset's echo time, shared by both sides, gliding to a new tempo: Gibberish's Delay jumps to a new time.
  const echoes = PRESETS.map(({ effect: fx }) => {
    if (fx.kind !== 'delay') return null;
    const time = Level({ level: delaySamples(fx.measures, GIBBER_BPM, rate), levelSlide: slideSamples(ECHO_TIME_RAMP_MS, rate) });
    return { measures: fx.measures, time };
  });

  // Each side has a voice per preset and its own volume after all of them.
  const buildSide = () => {
    const volume = Level();
    const voices = PRESETS.map((preset, i) => {
      const sound = voiceType(preset.oscillator)({ Q: preset.resonance, ...pulseWidth(preset.oscillator) });
      const send = Level();
      const level = Level();
      const input = G.binops.Mul(sound, send);
      const { dry, wet } = mixes[i]!;
      // The reverb is stereo and the voice mono: Gibberish adds the voice to each side of it.
      const mixed = G.binops.Add(G.binops.Mul(input, dry), G.binops.Mul(effect(G, preset, input, echoes[i]?.time ?? null), wet));
      G.binops.Mul(G.binops.Mul(mixed, level), volume).connect();
      // What was last sent to this voice; NaN until it plays, so its first note and brightness jump.
      return { preset, sound, send, level, frequency: NaN, cutoff: NaN, octave: 0, rising: false };
    });
    return { volume, voices, sent: { amp: NaN, rampMs: NaN } };
  };
  const sides: Record<Side, ReturnType<typeof buildSide>> = { right: buildSide(), left: buildSide() };

  // The drums, through a level that glides them in and out: cut off, a ringing drum would click.
  const drumNames = Object.keys(KIT) as Drum[];
  const kit = drumNames.map((drum) => G.instruments[KIT[drum].instrument](KIT[drum].settings));
  const drumLevel = Level({ level: 0, levelSlide: slideSamples(TOGGLE_RAMP_MS, rate) });
  G.binops.Mul(kit.reduce((sum, drum) => G.binops.Add(sum, drum)), drumLevel).connect();
  const post = (code: string) => G.worklet.port.postMessage({ address: 'eval', code });
  post(`(${installDrumClock})(Gibberish, ${JSON.stringify(kit.map((drum) => drum.id))})`);
  G.utilities.workletHandlers.handDrums = ({ data }) => onDrums({ pattern: data.pattern, layers: data.layers });
  // The first hit waits for the level to be up.
  const drumLead = Math.round((TOGGLE_RAMP_MS / 1000) * rate);
  const echoTimes = (bpm: number): [number, number][] =>
    echoes.flatMap((echo) => (echo ? [[echo.time.id, delaySamples(echo.measures, bpm, rate)]] : []));
  /** The drum loop last asked for. */
  let sent: DrumsToPlay | null = null;

  const nyquist = rate / 2;
  let current = initialPreset;
  for (const side of SIDES) sides[side].voices[current]!.rising = true;

  function playSide(side: Side, p: SynthParams | null, rampMs: number) {
    const { volume, voices, sent } = sides[side];
    const voice = voices[current]!;
    const amp = p ? p.amp : 0;
    if (p && p.frequency !== voice.frequency) {
      // Only a note being heard slides to the next one. From silence (fingers apart, Stop, the first
      // start), and on the voice a preset switch brings in, the new note starts at once instead of
      // gliding in from an old one. An octave jump never slides, even with a new lane at the same time.
      const slides = sent.amp > 0 && !Number.isNaN(voice.frequency) && p.octave === voice.octave;
      voice.sound.frequencySlide = slideSamples(slides ? PITCH_SLIDE_MS : 0, rate);
      voice.sound.frequency = p.frequency;
      voice.frequency = p.frequency;
      voice.octave = p.octave;
    }
    if (p && p.cutoff !== voice.cutoff) {
      voice.sound.cutoffSlide = slideSamples(Number.isNaN(voice.cutoff) ? 0 : CUTOFF_RAMP_MS, rate);
      voice.sound.cutoff = p.cutoff / nyquist;
      voice.cutoff = p.cutoff;
    }
    // Only once a hand is in view, and after its note and brightness: until then the voice holds a note
    // no hand chose (or the worklet may render between two messages), and a way into the effect opened
    // first would fill the effect with it, to be heard when the hand plays.
    if (p && p.lane !== null && voice.rising) {
      voice.send.level = 1;
      voice.level.level = voice.preset.gain;
      voice.rising = false;
    }
    if (amp !== sent.amp || rampMs !== sent.rampMs) {
      volume.levelSlide = slideSamples(rampMs, rate);
      volume.level = amp;
    }
    sides[side].sent = { amp, rampMs };
  }

  return {
    play(sounds, rampMs) {
      for (const side of SIDES) {
        const p = sounds ? sounds[side] : null;
        playSide(side, p, rampMs ?? p?.ampRampMs ?? 0);
      }
    },
    setEffect(amount) {
      const mix = mixes[current]!;
      if (amount === mix.amount) return;
      mix.dry.level = 1 - amount;
      mix.wet.level = amount;
      mix.amount = amount;
    },
    setPreset(index) {
      if (index === current) return;
      for (const side of SIDES) {
        const old = sides[side].voices[current]!;
        const next = sides[side].voices[index]!;
        old.send.level = old.level.level = 0;
        old.rising = false;
        next.frequency = next.cutoff = NaN;
        next.rising = true;
      }
      current = index;
    },
    playDrums(drums) {
      if (!drums) {
        if (!sent) return;
        sent = null;
        drumLevel.level = 0;
        return post(`Gibberish.drumClock.stop(${JSON.stringify(echoTimes(GIBBER_BPM))})`);
      }
      // Muted, the clock plays on unheard, so the drums come back in time.
      if (drums.muted !== sent?.muted) drumLevel.level = drums.muted ? 0 : 1;
      if (sent?.pattern !== drums.pattern || sent.layers !== drums.layers) {
        const pattern = DRUM_PATTERNS[drums.pattern]!;
        const wish: DrumWish = {
          steps: drumSteps(pattern, drums.layers).map((hits) => hits.map(({ drum, loudness }) => [drumNames.indexOf(drum), loudness])),
          samples: stepSamples(pattern.bpm, rate),
          pattern: drums.pattern,
          layers: drums.layers,
          echoes: echoTimes(pattern.bpm)
        };
        if (sent) post(`Gibberish.drumClock.wish(${JSON.stringify(wish)})`);
        else post(`Gibberish.drumClock.play(${JSON.stringify(wish)}, ${drumLead})`);
      }
      sent = { pattern: drums.pattern, layers: drums.layers, muted: drums.muted };
    }
  };
}

/**
 * The level a DynamicsCompressorNode adds to everything, in dB: the Web Audio specification raises its
 * output by 0.6 times the reduction it applies to a full-scale signal.
 */
function limiterMakeUpDb(thresholdDb: number, ratio: number): number {
  return 0.6 * -thresholdDb * (1 - 1 / ratio);
}

/** The pulse wave's width setting; other shapes have none. */
function pulseWidth(oscillator: Oscillator): Record<string, number> {
  return oscillator.shape === 'pwm' ? { pulsewidth: oscillator.pulsewidth } : {};
}

/** The preset's reverb or delay, taking `input`, fully wet: the reverb or the echoes alone, `echoTime` apart. */
function effect(G: Gibberish, preset: Preset, input: GibberishUgen, echoTime: GibberishUgen | null): GibberishUgen {
  const fx = preset.effect;
  return fx.kind === 'reverb'
    ? G.fx.Freeverb({ input, ...reverbMix(1) })
    : G.fx.Delay({ input, time: echoTime, feedback: fx.feedback, wetdry: 1 });
}

/**
 * Gibber's worklet starts rendering once it receives its first sound object, but learns which one is the
 * output only from the next message. A render in between finds no graph, and the processor dies for good
 * while still answering messages: silence, about one start in three. A silent stand-in graph, sent as
 * soon as the worklet exists and so ahead of Gibber's own messages, makes that render harmless.
 */
function guardFirstRender(G: Gibberish) {
  let node: AudioWorkletNode | undefined;
  Object.defineProperty(G, 'worklet', {
    configurable: true,
    get: () => node,
    set(created: AudioWorkletNode) {
      node = created;
      created.port.postMessage({ address: 'eval', code: 'this.callback = () => [0, 0]' });
    }
  });
}

/** Fetches the sound worklet and returns a local URL for it, so Gibber's own load can't fail or hang. */
async function download(url: string): Promise<string> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return URL.createObjectURL(new Blob([await response.text()], { type: 'text/javascript' }));
  } catch (error) {
    throw new EngineDownloadError("The sound worklet couldn't be downloaded", { cause: error });
  }
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new DOMException('Audio engine start timed out', 'TimeoutError')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
