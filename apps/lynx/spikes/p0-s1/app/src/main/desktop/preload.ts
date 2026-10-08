// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

/**
 * PC Preload Script
 * Exported content will be automatically mapped to NativeModules.nodejs
 */

import { contextBridge } from '@lynx-js/lynxtron/context-bridge';

// --- P0-S2 (b2): capability probe + WS relay inside the injected Node module --
// This environment is described as "Node.js capabilities injected into the Lynx
// Background Thread". We empirically probe what that means for WS viability.
const g = globalThis as any;
const caps = {
  hasWebSocket: typeof g.WebSocket !== 'undefined',
  hasFetch: typeof g.fetch !== 'undefined',
  hasRequire: typeof g.require !== 'undefined',
  hasProcess: typeof g.process !== 'undefined',
  processVersion: g.process?.version ?? null,
  hasNet: (() => {
    try {
      return typeof g.require === 'function' && !!g.require('node:net');
    } catch {
      return false;
    }
  })(),
};

let b2ws: any = null;

contextBridge.exposeInLynxBTS({
  echo: (message: string) => {
    return `Echo from PC Service Thread: ${message}`;
  },

  // P0-S2: report capabilities of this injected environment.
  caps: () => caps,

  // P0-S2 (b2): WS relay hosted in this injected Node context. onEvent is a
  // Lynx-side callback; we test whether it can be invoked repeatedly (stream).
  wsConnect: (url: string, onEvent: (kind: string, data: string) => void) => {
    try {
      const WS = g.WebSocket;
      if (!WS) {
        onEvent('error', 'WebSocket undefined in preload context');
        return false;
      }
      try {
        b2ws?.close();
      } catch {}
      const ws = new WS(url);
      b2ws = ws;
      ws.addEventListener('open', () => onEvent('open', ''));
      ws.addEventListener('message', (ev: any) =>
        onEvent('message', typeof ev.data === 'string' ? ev.data : '[binary]')
      );
      ws.addEventListener('close', (ev: any) =>
        onEvent('close', String(ev?.code ?? ''))
      );
      ws.addEventListener('error', (e: any) =>
        onEvent('error', String(e?.message ?? e))
      );
      return true;
    } catch (e) {
      try {
        onEvent('error', String(e));
      } catch {}
      return false;
    }
  },
  wsSend: (data: string) => {
    try {
      b2ws?.send(data);
      return true;
    } catch {
      return false;
    }
  },
  wsClose: () => {
    try {
      b2ws?.close();
    } catch {}
    return true;
  },
});

console.log('[PC Preload] Node.js capabilities exported, caps =', JSON.stringify(caps));
