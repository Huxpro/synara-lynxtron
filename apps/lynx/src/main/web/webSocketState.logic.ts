export const WEB_SOCKET_OPEN_STATE = 1;

export function isWebSocketOpen(socket: { readonly readyState: number }): boolean {
  return socket.readyState === WEB_SOCKET_OPEN_STATE;
}
