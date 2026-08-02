// P2-V2: tiny shared helper for the `-lynx-invoke` bridge (request/response
// with JSON envelopes) + GlobalEventEmitter subscription, used by all
// slice/src/platform/* implementations.

/* eslint-disable @typescript-eslint/no-explicit-any */

import 'background-only';

export function bridgeCall<T = any>(name: string, params: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      (NativeModules as any).bridge.call(name, params, (reply: any) => {
        try {
          const parsed = typeof reply === 'string' ? JSON.parse(reply) : reply;
          if (parsed && typeof parsed === 'object' && 'error' in parsed && parsed.error) {
            reject(new Error(String(parsed.error)));
            return;
          }
          resolve(parsed as T);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

type GeeListener = (...args: any[]) => void;

export function onGlobalEvent(event: string, listener: GeeListener): () => void {
  const gee = (lynx as any).getJSModule('GlobalEventEmitter');
  gee.addListener(event, listener);
  return () => gee.removeListener(event, listener);
}
