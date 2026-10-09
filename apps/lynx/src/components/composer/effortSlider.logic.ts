/** Electron's `Slider size="large"` thumb: a 28px disc riding a 24px track. */
export const EFFORT_SLIDER_THUMB_SIZE = 28;
/** Track width of the 296px picker before the first layout pass reports the real one. */
export const EFFORT_SLIDER_FALLBACK_TRACK_WIDTH = 274;

/** Distance between two stops: thumb centers run from half a thumb in from either end. */
export function resolveEffortSliderStep(trackWidth: number, stopCount: number): number {
  if (stopCount < 2) return 0;
  return Math.max(0, trackWidth - EFFORT_SLIDER_THUMB_SIZE) / (stopCount - 1);
}

/** Left edge of the thumb (and of every stop's hit zone center minus half a thumb). */
export function resolveEffortSliderThumbLeft(index: number, step: number): number {
  return index * step;
}

/** Index a drag lands on: the pressed stop plus whole steps travelled, clamped to the ladder. */
export function resolveEffortSliderDragIndex(input: {
  readonly startIndex: number;
  readonly startX: number;
  readonly x: number;
  readonly step: number;
  readonly stopCount: number;
}): number {
  if (input.stopCount < 1) return 0;
  const travelled = input.step > 0 ? Math.round((input.x - input.startX) / input.step) : 0;
  return Math.min(input.stopCount - 1, Math.max(0, input.startIndex + travelled));
}
