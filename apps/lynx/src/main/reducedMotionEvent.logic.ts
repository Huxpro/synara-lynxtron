export const REDUCED_MOTION_EVENT = 'synara:reduced-motion';

export function readReducedMotionEvent(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}
