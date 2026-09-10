export interface ProjectActionEditorKeyEvent {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly key: string;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
}

export function projectActionKeybindingFromEvent(
  event: ProjectActionEditorKeyEvent,
  isMac = true
): string | null {
  const normalized = event.key.toLowerCase();
  if (normalized === 'backspace' || normalized === 'delete') return '';
  if (['meta', 'control', 'ctrl', 'shift', 'alt', 'option'].includes(normalized)) return null;
  const key = normalized === ' ' ? 'space' : normalized === 'escape' ? 'esc' : normalized;
  if (!(key.length === 1 || ['enter', 'tab', 'backspace', 'delete', 'home', 'end', 'pageup', 'pagedown', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) || /^f\d{1,2}$/.test(key))) return null;
  const parts: string[] = [];
  if (isMac ? event.metaKey : event.ctrlKey) parts.push('mod');
  if (isMac ? event.ctrlKey : event.metaKey) parts.push(isMac ? 'ctrl' : 'meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (parts.length === 0) return null;
  parts.push(key);
  return parts.join('+');
}
