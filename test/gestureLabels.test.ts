import { describe, expect, it } from 'vitest';
import { gestureText } from '../src/ui/gestureLabels';

describe('gestureText', () => {
  it('names the gesture with its whole-percent confidence', () => {
    expect(gestureText('Pointing_Up', 0.874)).toBe('Pointing up · 87%');
  });

  it('shows 100% when the confidence rounds up', () => {
    expect(gestureText('Thumb_Up', 0.996)).toBe('Thumb up · 100%');
  });

  it('says "No gesture" without one', () => {
    expect(gestureText(null, 0)).toBe('No gesture');
  });
});
