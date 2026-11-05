/**
 * Fallback without a camera or a hand model: four 0..1 sliders and a gesture menu that emit the same
 * HandState the tracker would, as the lead hand. An "Octave up" switch and an effect slider stand in for the
 * second hand in shape mode: the switch is its squeeze, held or open, and the slider its height. Native
 * controls, so keyboard and touch work without extra code.
 */
import { gestureName } from '../hands/gesture';
import type { HandSource } from '../hands/tracker';
import { GESTURE_NAMES, type GestureName, type HandPair, type HandState, type Side } from '../hands/types';
import { PLAYING_ZONE } from '../mapping/handToSynth';
import type { SecondHand } from '../mapping/shape';
import { GESTURE_LABELS } from './gestureLabels';

export interface SliderFallback extends HandSource {
  /**
   * Shows the note being played beside the left–right slider, or nothing. It comes from the mapping, which
   * holds the note lane across small slider steps, so the name always matches what plays.
   */
  showNote(name: string | null): void;
  /** Moves the sliders' hand to the lead side, and the shaping hand to the other, after the roles are swapped. */
  setLeadSide(side: Side): void;
}

interface SliderValues {
  x: number;
  y: number;
  pinch: number;
  pinchMiddle: number;
  gesture: GestureName | null;
  octaveUp: boolean;
  /** The effect slider, 0..1: the shaping hand's height in the playing zone. */
  effect: number;
}

/** Palm center in the middle, fingers open, no gesture; the octave down and the preset's own effect amount. */
export const INITIAL_SLIDERS: SliderValues = { x: 0.5, y: 0.5, pinch: 1, pinchMiddle: 1, gesture: null, octaveUp: false, effect: 0.5 };

/** The sliders' second hand only shapes the sound, so the sliders play one note, as one hand does. */
export const SLIDERS_SECOND_HAND: SecondHand = { mode: 'shape', lastGesture: null };

export function sliderHandState(v: SliderValues, t: number): HandState {
  return {
    present: true,
    palm: { x: v.x, y: v.y },
    pinch: v.pinch,
    pinchMiddle: v.pinchMiddle,
    gesture: v.gesture,
    gestureScore: v.gesture ? 1 : 0,
    t
  };
}

/** The second hand the shape controls stand in for: squeezed while "Octave up" is on, as high as the effect slider. */
function shapingHandState(v: SliderValues, t: number): HandState {
  const y = PLAYING_ZONE.end - v.effect * (PLAYING_ZONE.end - PLAYING_ZONE.start);
  return { present: true, palm: { x: 0.5, y }, pinch: v.octaveUp ? 0 : 1, pinchMiddle: 1, gesture: null, gestureScore: 0, t };
}

/** The sliders' hand on the lead side, the shaping hand on the other: the sliders always play as the lead hand. */
export function sliderPair(v: SliderValues, lead: Side, t: number): HandPair {
  const played = { state: sliderHandState(v, t), landmarks: null };
  const shaping = { state: shapingHandState(v, t), landmarks: null };
  return lead === 'right' ? { right: played, left: shaping } : { right: shaping, left: played };
}

/** The settings a 0..1 slider sets. */
type SliderKey = Exclude<keyof SliderValues, 'gesture' | 'octaveUp'>;

const SLIDERS: { key: SliderKey; label: string }[] = [
  { key: 'x', label: 'Palm center left–right' },
  { key: 'y', label: 'Palm center up–down' },
  { key: 'pinch', label: 'Pinch (thumb–index)' },
  { key: 'pinchMiddle', label: 'Middle pinch (thumb–middle)' }
];

/** Mounts the controls in their own container inside `root`; stop() removes them. */
export function createSliderFallback(root: HTMLElement, leadSide: Side): SliderFallback {
  let cb: ((pair: HandPair) => void) | null = null;
  let lead = leadSide;
  const values: SliderValues = { ...INITIAL_SLIDERS };
  const container = document.createElement('div');
  container.className = 'sliders';
  const note = document.createElement('output');
  note.className = 'slider-note';

  const slider = (key: SliderKey) => {
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min: '0', max: '1', step: '0.01', value: String(values[key]) });
    input.addEventListener('input', () => {
      values[key] = input.valueAsNumber;
      emit();
    });
    return input;
  };
  for (const { key, label } of SLIDERS) container.append(field(label, slider(key), key === 'x' ? note : undefined));

  const select = document.createElement('select');
  select.append(new Option('None', ''), ...GESTURE_NAMES.map((name) => new Option(GESTURE_LABELS[name], name)));
  select.addEventListener('input', () => {
    values.gesture = gestureName(select.value);
    emit();
  });
  container.append(field('Gesture', select));

  const octave = document.createElement('input');
  octave.type = 'checkbox';
  octave.addEventListener('input', () => {
    values.octaveUp = octave.checked;
    emit();
  });
  const octaveLabel = document.createElement('label');
  octaveLabel.className = 'slider-switch';
  octaveLabel.append(octave, 'Octave up');

  container.append(octaveLabel, field('Reverb or echo amount', slider('effect')));
  root.append(container);

  function emit() {
    cb?.(sliderPair(values, lead, performance.now()));
  }

  return {
    onState(fn) {
      cb = fn;
      emit();
    },
    stop() {
      cb = null;
      container.remove();
    },
    showNote(name) {
      note.textContent = name ?? '';
    },
    setLeadSide(side) {
      lead = side;
      emit();
    }
  };
}

/** A labelled control; `readout` shows at the end of the caption line. */
function field(text: string, control: HTMLElement, readout?: HTMLElement) {
  const caption = document.createElement('span');
  caption.append(text);
  if (readout) caption.append(readout);
  const label = document.createElement('label');
  label.append(caption, control);
  return label;
}
