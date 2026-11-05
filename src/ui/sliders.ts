/**
 * Fallback without a camera or a hand model: four 0..1 sliders and a gesture menu that emit the same
 * HandState the tracker would. Native controls, so keyboard and touch work without extra code.
 */
import { gestureName } from '../hands/gesture';
import type { HandSource } from '../hands/tracker';
import { GESTURE_NAMES, type GestureName, type HandState } from '../hands/types';
import { GESTURE_LABELS } from './gestureLabels';

interface SliderValues {
  x: number;
  y: number;
  pinch: number;
  pinchMiddle: number;
  gesture: GestureName | null;
}

/** Palm center in the middle, fingers open, no gesture. */
export const INITIAL_SLIDERS: SliderValues = { x: 0.5, y: 0.5, pinch: 1, pinchMiddle: 1, gesture: null };

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

const SLIDERS: { key: Exclude<keyof SliderValues, 'gesture'>; label: string }[] = [
  { key: 'x', label: 'Palm center left–right' },
  { key: 'y', label: 'Palm center up–down' },
  { key: 'pinch', label: 'Pinch (thumb–index)' },
  { key: 'pinchMiddle', label: 'Middle pinch (thumb–middle)' }
];

/** Mounts the controls in their own container inside `root`; stop() removes them. */
export function createSliderFallback(root: HTMLElement): HandSource {
  let cb: ((s: HandState, landmarks: null) => void) | null = null;
  const values: SliderValues = { ...INITIAL_SLIDERS };
  const container = document.createElement('div');
  container.className = 'sliders';

  for (const { key, label } of SLIDERS) {
    const input = document.createElement('input');
    Object.assign(input, { type: 'range', min: '0', max: '1', step: '0.01', value: String(values[key]) });
    input.addEventListener('input', () => {
      values[key] = input.valueAsNumber;
      emit();
    });
    container.append(field(label, input));
  }

  const select = document.createElement('select');
  select.append(new Option('None', ''), ...GESTURE_NAMES.map((name) => new Option(GESTURE_LABELS[name], name)));
  select.addEventListener('input', () => {
    values.gesture = gestureName(select.value);
    emit();
  });
  container.append(field('Gesture', select));
  root.append(container);

  function emit() {
    cb?.(sliderHandState(values, performance.now()), null);
  }

  return {
    onState(fn) {
      cb = fn;
      emit();
    },
    stop() {
      cb = null;
      container.remove();
    }
  };
}

function field(text: string, control: HTMLElement) {
  const label = document.createElement('label');
  label.append(text, control);
  return label;
}
