/** The parts of Gibber's prebuilt bundle the engine uses. The package ships no types. */
declare module 'gibber.audio.lib/dist/gibber.audio.js' {
  /** A sound object living in the audio worklet: property writes and method calls are forwarded there. */
  interface GibberishUgen {
    [property: string]: unknown;
    connect(target?: GibberishUgen): GibberishUgen;
  }

  export interface Gibberish {
    /** The audio worklet node all of Gibber's sound comes out of. */
    worklet: AudioWorkletNode;
    utilities: {
      /** Registers a sound object built from a genish graph, on the page and in the worklet. */
      Make(definition: {
        name: string;
        type: 'Ugen';
        properties: Record<string, number>;
        constructor: () => unknown;
      }): () => GibberishUgen;
    };
    fx: { Freeverb(props: Record<string, unknown>): GibberishUgen };
  }

  interface Gibber {
    init(options: { workletPath: string; ctx: AudioContext }): Promise<void>;
    Audio: { Gibberish: Gibberish };
  }

  const Gibber: Gibber;
  export default Gibber;
}
