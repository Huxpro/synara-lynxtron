type TerminalInputFocusListener = (owner: string | null) => void;

let terminalInputFocusOwner: string | null = null;
let pendingTerminalInputFocusOwner: string | null = null;
const terminalInputFocusListeners = new Set<TerminalInputFocusListener>();

function publishTerminalInputFocusOwner(owner: string | null): void {
  if (terminalInputFocusOwner === owner) return;
  terminalInputFocusOwner = owner;
  for (const listener of terminalInputFocusListeners) listener(owner);
}

export function requestTerminalInputFocus(owner: string): void {
  pendingTerminalInputFocusOwner = owner;
}

export function confirmTerminalInputFocus(owner: string): boolean {
  if (pendingTerminalInputFocusOwner !== owner) return false;
  pendingTerminalInputFocusOwner = null;
  publishTerminalInputFocusOwner(owner);
  return true;
}

export function releaseTerminalInputFocus(owner: string): void {
  if (pendingTerminalInputFocusOwner === owner) pendingTerminalInputFocusOwner = null;
  if (terminalInputFocusOwner === owner) publishTerminalInputFocusOwner(null);
}

export function claimComposerInputFocus(): void {
  pendingTerminalInputFocusOwner = null;
  publishTerminalInputFocusOwner(null);
}

export function subscribeTerminalInputFocusOwner(
  listener: TerminalInputFocusListener
): () => void {
  listener(terminalInputFocusOwner);
  terminalInputFocusListeners.add(listener);
  return () => terminalInputFocusListeners.delete(listener);
}
