// P0-S2: WebSocket path determination suite (runs in Lynx background thread).
//
// Paths under test:
//   a)  direct WS from Lynx view JS (is WebSocket / LynxWebSocketModule there?)
//   b0) bridge baseline RTT (request/response overhead of the -lynx-invoke bridge)
//   b1) main-process WS relay (Node WebSocket in main, push via sendGlobalEvent)
//   b2) preload Node-module WS relay (NativeModules.nodejs.exposed, callback stream)
//   c)  SSE (lynx.EventSource) + fetch POST replacement
//
// Every phase logs `[P0-S2] ...` lines (collected via lynx-devtool get-console)
// and reports progress through onUpdate for on-screen display.

/* eslint-disable @typescript-eslint/no-explicit-any */

type OnUpdate = (text: string) => void;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = () => Date.now();

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    sleep(ms).then(() => {
      throw new Error(`timeout:${label}`);
    }),
  ]);
}

function stats(arr: number[]) {
  if (!arr.length) return { n: 0, avg: -1, p50: -1, p95: -1 };
  const s = [...arr].sort((a, b) => a - b);
  const pick = (p: number) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return {
    n: arr.length,
    avg: Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100,
    p50: pick(0.5),
    p95: pick(0.95),
  };
}

function bridgeCall(name: string, params: Record<string, unknown>): Promise<any> {
  return new Promise((resolve) => {
    (NativeModules as any).bridge.call(name, params, (reply: any) => resolve(reply));
  });
}

function parseJson(s: any): any {
  try {
    return typeof s === 'string' ? JSON.parse(s) : s;
  } catch {
    return null;
  }
}

// Generic sequential RTT loop: sendFn(seq) sends, echoes arrive via subscribe.
async function rttLoop(
  n: number,
  sendFn: (payload: string) => void,
  subscribe: (onMsg: (data: string) => void) => () => void,
  timeoutMs = 8000
): Promise<number[]> {
  const rtts: number[] = [];
  const waiters = new Map<number, { t0: number; resolve: () => void }>();
  const unsubscribe = subscribe((data) => {
    const msg = parseJson(data);
    if (msg && typeof msg.seq === 'number' && waiters.has(msg.seq)) {
      const w = waiters.get(msg.seq)!;
      waiters.delete(msg.seq);
      rtts.push(now() - w.t0);
      w.resolve();
    }
  });
  try {
    for (let seq = 1; seq <= n; seq++) {
      const t0 = now();
      const done = new Promise<void>((resolve) => waiters.set(seq, { t0, resolve }));
      sendFn(JSON.stringify({ seq, t0 }));
      await withTimeout(done, timeoutMs, `rtt#${seq}`);
      await sleep(5);
    }
  } finally {
    unsubscribe();
  }
  return rtts;
}

// Generic throughput counter: messages with kind 'tick' counted until
// 'tick-done' (or timeout). Returns {received, perSec}.
async function throughputRun(
  expected: number,
  subscribe: (onMsg: (data: string) => void) => () => void,
  startFn: () => void,
  timeoutMs = 20000
): Promise<{ received: number; perSec: number }> {
  let received = 0;
  let tFirst = -1;
  let tLast = -1;
  let doneFlag = false;
  const done = new Promise<void>((resolve) => {
    const unsubscribe = subscribe((data) => {
      const msg = parseJson(data);
      if (!msg || (msg.kind !== 'tick' && msg.kind !== 'tick-done')) return;
      if (msg.kind === 'tick') {
        received += 1;
        const t = now();
        if (tFirst < 0) tFirst = t;
        tLast = t;
      } else if (msg.kind === 'tick-done' && !doneFlag) {
        doneFlag = true;
        unsubscribe();
        resolve();
      }
    });
    startFn();
  });
  await withTimeout(done, timeoutMs, 'throughput').catch(() => {});
  const secs = tFirst >= 0 && tLast > tFirst ? (tLast - tFirst) / 1000 : 0;
  return {
    received,
    perSec: secs > 0 ? Math.round(received / secs) : received > 0 ? -1 : 0,
  };
}

// Minimal WS client over the pre-registered LynxWebSocketModule (API learned
// from @lynx-js/websocket: connect(url, protocols[], options, socketID),
// send(msg, id), ping(id), close(code, reason, id); events arrive on the
// GlobalEventEmitter as websocketOpen/Message/Closed/Failed with {id}).
function createModuleWebSocket(url: string) {
  const mod = (NativeModules as any).LynxWebSocketModule;
  const gee = (lynx as any).getJSModule('GlobalEventEmitter');
  const id = Math.floor(Math.random() * 1e9) + 1;
  const handlers: Record<string, Array<(ev: any) => void>> = {
    open: [],
    message: [],
    close: [],
    error: [],
  };
  const evMap: Record<string, string> = {
    websocketOpen: 'open',
    websocketMessage: 'message',
    websocketClosed: 'close',
    websocketFailed: 'error',
  };
  const registered: Array<[string, (ev: any) => void]> = [];
  for (const [evName, kind] of Object.entries(evMap)) {
    const fn = (ev: any) => {
      if (ev && ev.id === id) handlers[kind].forEach((h) => h(ev));
    };
    gee.addListener(evName, fn);
    registered.push([evName, fn]);
  }
  mod.connect(url, [], {}, id);
  return {
    on(kind: string, h: (ev: any) => void) {
      handlers[kind].push(h);
    },
    send(data: string) {
      mod.send(data, id);
    },
    close() {
      try {
        mod.close(1000, '', id);
      } catch {}
    },
    dispose() {
      for (const [n, f] of registered) gee.removeListener(n, f);
    },
  };
}

export async function runWsSuite(port: number, onUpdate: OnUpdate): Promise<void> {
  const R: Record<string, any> = {};
  const report = (line: string) => {
    // Deterministic sink: ship every result line to the sidecar, which appends
    // it to spikes/p0-s2/results.jsonl (devtool console is best-effort).
    try {
      const f = (lynx as any).fetch ?? (globalThis as any).fetch;
      void f?.(`http://127.0.0.1:${port}/report`, { method: 'POST', body: line });
    } catch {}
  };
  const say = (phase: string, obj: any) => {
    R[phase] = obj;
    const line = `[P0-S2] ${phase} ${JSON.stringify(obj)}`;
    console.log(line);
    report(line);
    onUpdate(
      Object.entries(R)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n')
    );
  };

  const wsUrl = `ws://127.0.0.1:${port}/ws`;
  const httpBase = `http://127.0.0.1:${port}`;
  const NM: any = NativeModules as any;

  // ---- (a) direct WS from Lynx view --------------------------------------
  try {
    const WS = (globalThis as any).WebSocket;
    const mod = NM.LynxWebSocketModule;
    // Deep-probe the module shape: enumerable keys come back empty for native
    // modules, so also check own property names and known WS method names.
    const shape = mod
      ? {
          ownProps: Object.getOwnPropertyNames(mod),
          protoProps: Object.getOwnPropertyNames(
            Object.getPrototypeOf(mod) ?? {}
          ),
          methods: ['connect', 'send', 'close', 'on', 'addListener', 'onOpen', 'onMessage']
            .filter((k) => typeof mod[k] === 'function'),
        }
      : null;
    const availability = {
      globalWebSocket: typeof WS,
      lynxWebSocketModule: typeof mod,
      moduleShape: shape,
    };
    if (typeof WS === 'undefined') {
      say('a', { available: false, ...availability });
    } else {
      const sock = new WS(wsUrl);
      const directRtts: number[] = [];
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          sock.addEventListener('open', () => resolve());
          sock.addEventListener('error', (e: any) => reject(new Error(String(e))));
        }),
        8000,
        'a:connect'
      );
      const waiters = new Map<number, { t0: number; resolve: () => void }>();
      sock.addEventListener('message', (ev: any) => {
        const msg = parseJson(ev.data);
        if (msg && waiters.has(msg.seq)) {
          const w = waiters.get(msg.seq)!;
          waiters.delete(msg.seq);
          directRtts.push(now() - w.t0);
          w.resolve();
        }
      });
      for (let seq = 1; seq <= 20; seq++) {
        const t0 = now();
        const done = new Promise<void>((resolve) => waiters.set(seq, { t0, resolve }));
        sock.send(JSON.stringify({ seq, t0 }));
        await withTimeout(done, 8000, `a:rtt#${seq}`);
        await sleep(5);
      }
      sock.close();
      say('a', { available: true, ...availability, rtt: stats(directRtts) });
    }
  } catch (e) {
    say('a', { available: 'error', error: String(e) });
  }

  // ---- (a2) LynxWebSocketModule direct (W3C-ish wrapper) --------------------
  try {
    const mod = NM.LynxWebSocketModule;
    const usable =
      mod &&
      typeof mod.connect === 'function' &&
      typeof mod.send === 'function' &&
      typeof mod.close === 'function';
    if (!usable) {
      say('a2_ws_module', { available: false });
    } else {
      const openSocket = async () => {
        const sock = createModuleWebSocket(wsUrl);
        await withTimeout(
          new Promise<void>((resolve, reject) => {
            sock.on('open', () => resolve());
            sock.on('error', (ev: any) => reject(new Error(JSON.stringify(ev))));
            sock.on('close', (ev: any) =>
              reject(new Error('closed-before-open ' + JSON.stringify(ev)))
            );
          }),
          8000,
          'a2:connect'
        );
        return sock;
      };

      let sock = await openSocket();
      const rtts = await rttLoop(
        30,
        (payload) => sock.send(payload),
        (onMsg) => {
          const h = (ev: any) => onMsg(String(ev.data ?? ''));
          sock.on('message', h);
          return () => {};
        }
      );
      const rttStats = stats(rtts);

      const tp = await throughputRun(
        300,
        (onMsg) => {
          sock.on('message', (ev: any) => onMsg(String(ev.data ?? '')));
          return () => {};
        },
        () => sock.send('TICK:300:2')
      );

      let reconnectMs = -1;
      try {
        const closedP = withTimeout(
          new Promise<void>((resolve) => sock.on('close', () => resolve())),
          8000,
          'a2:close'
        );
        sock.send('KICK');
        await closedP;
        const t0 = now();
        sock.dispose();
        sock = await openSocket();
        reconnectMs = now() - t0;
      } catch (e) {
        console.log('[P0-S2] a2 reconnect error', String(e));
      }
      sock.close();
      sock.dispose();
      say('a2_ws_module', { available: true, rtt: rttStats, throughput: tp, reconnectMs });
    }
  } catch (e) {
    say('a2_ws_module', { available: 'error', error: String(e) });
  }

  // ---- (b0) bridge baseline RTT -------------------------------------------
  try {
    const arr: number[] = [];
    for (let i = 0; i < 30; i++) {
      const t0 = now();
      await bridgeCall('sidecarHealth', {});
      arr.push(now() - t0);
      await sleep(3);
    }
    say('b0_bridge_baseline', { rtt: stats(arr) });
  } catch (e) {
    say('b0_bridge_baseline', { error: String(e) });
  }

  // ---- (b1) main-process relay --------------------------------------------
  try {
    const gee = (lynx as any).getJSModule('GlobalEventEmitter');
    const listeners: Array<[string, (...args: any[]) => void]> = [];
    const subscribe =
      (event: string) =>
      (onMsg: (data: string) => void) => {
        const fn = (d: any) => onMsg(typeof d === 'string' ? d : JSON.stringify(d));
        gee.addListener(event, fn);
        listeners.push([event, fn]);
        return () => gee.removeListener(event, fn);
      };
    const onceEvent = (event: string, ms: number) =>
      withTimeout(
        new Promise<string>((resolve) => {
          const fn = (d: any) => {
            gee.removeListener(event, fn);
            resolve(String(d ?? ''));
          };
          gee.addListener(event, fn);
          listeners.push([event, fn]);
        }),
        ms,
        `b1:${event}`
      );

    const conn = parseJson(await withTimeout(bridgeCall('wsRelayConnect', { url: wsUrl }), 10000, 'b1:connect'));
    if (!conn?.ok) throw new Error('connect failed: ' + JSON.stringify(conn));

    const rtts = await rttLoop(
      30,
      (payload) => void bridgeCall('wsRelaySend', { data: payload }),
      subscribe('wsRelay:message')
    );
    const rttStats = stats(rtts);

    const tp = await throughputRun(
      300,
      subscribe('wsRelay:message'),
      () => void bridgeCall('wsRelayTick', { n: 300, interval: 2 })
    );

    // reconnect: KICK kills server-side conns; UI drives reconnect policy
    let reconnectMs = -1;
    try {
      const closedP = onceEvent('wsRelay:close', 8000);
      void bridgeCall('wsRelaySend', { data: 'KICK' });
      await closedP;
      const t0 = now();
      const openP = onceEvent('wsRelay:open', 10000);
      const re = parseJson(await bridgeCall('wsRelayConnect', { url: wsUrl }));
      if (!re?.ok) throw new Error('reconnect failed');
      await openP;
      reconnectMs = now() - t0;
    } catch (e) {
      reconnectMs = -1;
      console.log('[P0-S2] b1 reconnect error', String(e));
    }
    for (const [ev, fn] of listeners) gee.removeListener(ev, fn);
    void bridgeCall('wsRelayClose', {});
    say('b1_main_relay', { available: true, rtt: rttStats, throughput: tp, reconnectMs });
  } catch (e) {
    say('b1_main_relay', { available: 'error', error: String(e) });
  }

  // ---- (b2) preload Node-module relay --------------------------------------
  try {
    const exposed = NM.nodejs?.exposed;
    if (!exposed) throw new Error('NativeModules.nodejs.exposed missing');
    const caps = exposed.caps ? exposed.caps() : null;
    const canWs = caps?.hasWebSocket && typeof exposed.wsConnect === 'function';
    if (!canWs) {
      say('b2_preload_relay', { available: false, caps });
    } else {
      type EvFn = (kind: string, data: string) => void;
      let evHandler: EvFn = () => {};
      const subscribe =
        () =>
        (onMsg: (data: string) => void) => {
          const prev = evHandler;
          evHandler = (kind, data) => {
            prev(kind, data);
            if (kind === 'message') onMsg(data);
          };
          return () => {};
        };
      const onceKind = (kind: string, ms: number) =>
        withTimeout(
          new Promise<string>((resolve) => {
            const prev = evHandler;
            const fn: EvFn = (k, d) => {
              if (k === kind) {
                evHandler = prev;
                resolve(d);
              } else {
                prev(k, d);
              }
            };
            evHandler = fn;
          }),
          ms,
          `b2:${kind}`
        );

      const ok = exposed.wsConnect(wsUrl, (kind: string, data: string) => evHandler(kind, data));
      if (!ok) throw new Error('wsConnect returned false');
      await onceKind('open', 10000);

      const rtts = await rttLoop(
        30,
        (payload) => exposed.wsSend(payload),
        subscribe()
      );
      const rttStats = stats(rtts);

      const tp = await throughputRun(300, subscribe(), () => exposed.wsSend('TICK:300:2'));

      let reconnectMs = -1;
      try {
        const closedP = onceKind('close', 8000);
        exposed.wsSend('KICK');
        await closedP;
        const t0 = now();
        const openP = onceKind('open', 10000);
        exposed.wsConnect(wsUrl, (kind: string, data: string) => evHandler(kind, data));
        await openP;
        reconnectMs = now() - t0;
      } catch (e) {
        console.log('[P0-S2] b2 reconnect error', String(e));
      }
      exposed.wsClose();
      say('b2_preload_relay', { available: true, caps, rtt: rttStats, throughput: tp, reconnectMs });
    }
  } catch (e) {
    say('b2_preload_relay', { available: 'error', error: String(e) });
  }

  // ---- (c) SSE + fetch -------------------------------------------------------
  try {
    const ES = (lynx as any).EventSource ?? (globalThis as any).EventSource;
    // Lynx exposes fetch on the `lynx` global, not necessarily on globalThis.
    const lynxFetch = (lynx as any).fetch ?? (globalThis as any).fetch;
    const hasFetch = typeof lynxFetch === 'function';
    if (typeof ES === 'undefined' || !hasFetch) {
      say('c_sse_fetch', {
        available: false,
        eventSource: typeof ES,
        lynxFetch: typeof (lynx as any).fetch,
        globalFetch: typeof (globalThis as any).fetch,
      });
    } else {
      // instrumentation: is the native networking module present? does the SSE
      // TCP connection even reach the sidecar?
      const netMod = NM.NetworkingModule;
      const probe1 =
        '[P0-S2] c:probe NetworkingModule=' + typeof netMod +
        (netMod ? ' methods=' + ['fetch', 'EventSource', 'eventSource'].filter((k) => typeof netMod[k] === 'function').join(',') : '');
      console.log(probe1);
      report(probe1);
      const es = new ES(`${httpBase}/sse`);
      let rawMsgCount = 0;
      es.addEventListener('message', (ev: any) => {
        if (rawMsgCount++ < 3) {
          let shape = '';
          try {
            shape = JSON.stringify({
              keys: Object.keys(ev ?? {}),
              dataType: typeof ev?.data,
              dataSnippet: String(ev?.data ?? '').slice(0, 80),
            });
          } catch {
            shape = 'unserializable';
          }
          const line = '[P0-S2] c:rawmsg ' + shape;
          console.log(line);
          report(line);
        }
      });
      es.addEventListener('error', (ev: any) => {
        const line = '[P0-S2] c:sse error event ' + JSON.stringify(ev ?? null);
        console.log(line);
        report(line);
      });
      await sleep(2000);
      try {
        const h = parseJson(await (await lynxFetch(`${httpBase}/health`)).text());
        const line = '[P0-S2] c:probe server sees sseClients=' + h?.sseClients + ' wsClients=' + h?.wsClients;
        console.log(line);
        report(line);
      } catch (e) {
        const line = '[P0-S2] c:probe health fetch failed ' + String(e);
        console.log(line);
        report(line);
      }
      // wait for hello (connection up)
      await withTimeout(
        new Promise<void>((resolve) => {
          es.addEventListener('message', function onMsg(ev: any) {
            const msg = parseJson(ev.data);
            if (msg?.kind === 'hello') {
              es.removeEventListener('message', onMsg);
              resolve();
            }
          });
        }),
        8000,
        'c:hello'
      );

      const subscribe =
        () =>
        (onMsg: (data: string) => void) => {
          const fn = (ev: any) => onMsg(String(ev.data ?? ''));
          es.addEventListener('message', fn);
          return () => es.removeEventListener('message', fn);
        };

      const rtts = await rttLoop(
        20,
        (payload) =>
          void lynxFetch(`${httpBase}/send`, { method: 'POST', body: payload }),
        subscribe()
      );
      const rttStats = stats(rtts);

      // throughput: dedicated tick stream
      const es2 = new ES(`${httpBase}/sse-tick?n=500&interval=2`);
      const tp = await throughputRun(
        500,
        (onMsg) => {
          const fn = (ev: any) => onMsg(String(ev.data ?? ''));
          es2.addEventListener('message', fn);
          return () => es2.removeEventListener('message', fn);
        },
        () => {},
        30000
      );
      es2.close();

      // reconnect: server kills stream; EventSource native retry (retry:100)
      let reconnectMs = -1;
      try {
        const t0 = now();
        const reHello = withTimeout(
          new Promise<void>((resolve) => {
            es.addEventListener('message', function onMsg(ev: any) {
              const msg = parseJson(ev.data);
              if (msg?.kind === 'hello') {
                es.removeEventListener('message', onMsg);
                resolve();
              }
            });
          }),
          10000,
          'c:re-hello'
        );
        await lynxFetch(`${httpBase}/sse-kick`);
        await reHello;
        reconnectMs = now() - t0;
      } catch (e) {
        console.log('[P0-S2] c reconnect error', String(e));
      }
      es.close();
      say('c_sse_fetch', { available: true, rtt: rttStats, throughput: tp, reconnectMs });
    }
  } catch (e) {
    say('c_sse_fetch', { available: 'error', error: String(e) });
  }

  console.log('[P0-S2] SUITE_DONE ' + JSON.stringify(R));
  report('[P0-S2] SUITE_DONE ' + JSON.stringify(R));
  onUpdate('SUITE_DONE\n' + JSON.stringify(R, null, 1));
}
