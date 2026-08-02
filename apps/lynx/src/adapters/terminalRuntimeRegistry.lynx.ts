// P6 compiler boundary: xterm/canvas is an approved EXCLUSIVE hard island.
// Sidebar only needs lifecycle disposal; the Lynx shell has no xterm runtime.
export const terminalRuntimeRegistry = {
  disposeThread(_threadId: string): void {},
};
