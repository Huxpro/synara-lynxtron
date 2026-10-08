// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { app, LynxWindow, dialog } from '@lynx-js/lynxtron';
import { LYNX_BUNDLE_PATH } from './vendorPaths';
import path from 'path';
import { createRequire } from 'node:module';
const isDev = process.env.NODE_ENV === 'development';

// P0-S1: `utilityProcess` exists in the native `lynxtron` binding (verified at
// runtime: HAS_UTILITY_PROCESS=object, keys=fork) but is NOT re-exported by the
// @lynx-js/lynxtron JS shim in v0.0.7. Load the native module directly.
const { utilityProcess } = createRequire(import.meta.url)('lynxtron');

// --- P0-S1 sidecar smoke state (module scope so the bridge handler can read) ---
let sidecarHealth = 'pending';
let sidecarPort: number | null = null;

// --- P0-S2 (b1): WS relay hosted in the main process -------------------------
// Node 22 provides a global WebSocket client (undici); declared as any because
// tsconfig lib has no DOM.
declare const WebSocket: any;
let relayWs: any = null;

app.whenReady().then(() => {
  // --- P0-S1: fork a Node HTTP sidecar and probe it -------------------------
  const sidecar = utilityProcess.fork(
    path.join(__dirname, 'sidecar.js'),
    [],
    // NOTE: Lynxtron 0.0.7 requires an 'ipc' entry in stdio (Electron-compatible
    // utilityProcess defaults differ); without it fork throws
    // ERR_CHILD_PROCESS_IPC_REQUIRED.
    {
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        SIDECAR_REPORT_FILE:
          '/Users/bytedance/github/synara-lynx/spikes/p0-s5/results.jsonl',
        SYNARA_WEB_PORT: '8892',
      } as Record<string, string>,
    }
  );
  console.log('[P0-S1] sidecar forked, pid =', sidecar.pid);
  sidecar.stdout?.on('data', async (chunk: Buffer) => {
    const line = chunk.toString();
    console.log('[sidecar:out]', line.trim());
    const m = line.match(/SIDECAR_PORT=(\d+)/);
    if (m) {
      sidecarPort = Number(m[1]);
      try {
        const res = await fetch(`http://127.0.0.1:${sidecarPort}/health`);
        sidecarHealth = await res.text();
        console.log('[P0-S1] sidecar health probe OK:', sidecarHealth);
      } catch (err) {
        sidecarHealth = 'probe failed: ' + String(err);
        console.error('[P0-S1] sidecar health probe FAILED', err);
      }
    }
  });
  sidecar.stderr?.on('data', (c: Buffer) =>
    console.error('[sidecar:err]', c.toString().trim())
  );
  sidecar.on('exit', (code: number | null) =>
    console.log('[P0-S1] sidecar exited, code =', code)
  );
  process.on('exit', () => sidecar.kill());
  // --- end P0-S1 ------------------------------------------------------------

  const w = new LynxWindow({
    width: 800,
    height: 600,
    title: 'Lynxtron Hello World',
    lynxPreference: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Handle bridge calls from Lynx UI
  // @ts-ignore
  w.on(
    '-lynx-invoke',
    async (callback: EventCallback, name: string, data: any) => {
      // In our architecture, UI calls NativeModules.bridge.request({ method, params })
      console.log(
        `[PC_Host] NativeModule Call: bridge.${name}`,
        data,
        callback,
        name
      );

      if (name === 'showDialog') {
        const { message } = data;
        dialog.showMessageBox({ message });
        callback.sendReply('');
      } else if (name == 'getAppVersion') {
        callback.sendReply(app.getVersion());
      } else if (name === 'sidecarHealth') {
        // P0-S1: expose sidecar probe result to the Lynx UI
        callback.sendReply(
          JSON.stringify({ port: sidecarPort, health: sidecarHealth })
        );
      } else if (name === 'wsRelayConnect') {
        // P0-S2 (b1): open WS from main process; push events via sendGlobalEvent
        try {
          relayWs?.close();
        } catch {}
        let settled = false;
        try {
          const ws = new WebSocket(String(data.url));
          relayWs = ws;
          ws.addEventListener('open', () => {
            if (!settled) {
              settled = true;
              callback.sendReply(JSON.stringify({ ok: true }));
            }
            w.sendGlobalEvent('wsRelay:open', '');
          });
          ws.addEventListener('message', (ev: any) => {
            w.sendGlobalEvent(
              'wsRelay:message',
              typeof ev.data === 'string' ? ev.data : '[binary]'
            );
          });
          ws.addEventListener('close', (ev: any) => {
            if (!settled) {
              settled = true;
              callback.sendReply(
                JSON.stringify({ ok: false, err: 'closed-before-open' })
              );
            }
            w.sendGlobalEvent('wsRelay:close', String(ev?.code ?? ''));
          });
          ws.addEventListener('error', (ev: any) => {
            if (!settled) {
              settled = true;
              callback.sendReply(
                JSON.stringify({ ok: false, err: String(ev?.message ?? 'error') })
              );
            }
            w.sendGlobalEvent('wsRelay:error', String(ev?.message ?? ''));
          });
        } catch (e) {
          callback.sendReply(JSON.stringify({ ok: false, err: String(e) }));
        }
      } else if (name === 'wsRelaySend' || name === 'wsRelayTick') {
        let ok = true;
        try {
          relayWs?.send(
            name === 'wsRelayTick'
              ? `TICK:${data.n}:${data.interval}`
              : String(data.data)
          );
        } catch {
          ok = false;
        }
        callback.sendReply(JSON.stringify({ ok }));
      } else if (name === 'wsRelayClose') {
        try {
          relayWs?.close();
        } catch {}
        callback.sendReply(JSON.stringify({ ok: true }));
      }
    }
  );

  w.show();
  if (isDev) {
    w.loadURL('http://localhost:5969/main.lynx.bundle');
  } else {
    w.loadFile(LYNX_BUNDLE_PATH);
  }
});
