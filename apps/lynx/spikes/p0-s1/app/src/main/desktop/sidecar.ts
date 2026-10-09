// P0-S1/P0-S2 spike sidecar: Node HTTP + WebSocket server forked from the
// Lynxtron main process via utilityProcess.fork.
//
// Endpoints:
//   GET  /health            -> JSON liveness (+ hasParentPort probe)
//   GET  /echo?msg=         -> JSON echo
//   GET  /sse               -> persistent SSE channel (retry:100); echoes /send
//   POST /send              -> broadcasts body to all /sse clients (SSE echo)
//   GET  /sse-kick          -> terminates all /sse streams (reconnect test)
//   GET  /sse-tick?n=&interval= -> SSE stream of n messages then close (throughput)
//   WS   /ws                -> echo server; "KICK" terminates all clients;
//                              "TICK:<n>:<interval>" pushes n msgs (throughput)
//
// Protocol: prints `SIDECAR_PORT=<port>` on stdout once listening.

import http from 'node:http';
import fs from 'node:fs';
import { WebSocketServer, WebSocket as WsSocket } from 'ws';

const startedAt = Date.now();
const sseClients = new Set<http.ServerResponse>();
const reportFile = process.env.SIDECAR_REPORT_FILE;

function sseWrite(res: http.ServerResponse, data: string) {
  // Explicit `event: message` for engines that don't default to it (P0-S2 probe).
  res.write(`event: message\ndata: ${data}\n\n`);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');

  if (url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        pid: process.pid,
        node: process.version,
        uptimeMs: Date.now() - startedAt,
        hasParentPort: typeof (process as any).parentPort !== 'undefined',
        sseClients: sseClients.size,
        wsClients: wsClients.size,
      })
    );
    return;
  }

  if (url.pathname === '/echo') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ echo: url.searchParams.get('msg') ?? '' }));
    return;
  }

  if (url.pathname === '/sse') {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    res.write('retry: 100\n\n');
    sseWrite(res, JSON.stringify({ kind: 'hello', t: Date.now() }));
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // P0-S5: trivial page for webview smoke (stage A)
  if (url.pathname === '/page') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<!doctype html><html><head><meta charset="utf-8"><title>P0-S5 webview smoke</title>
<style>body{margin:0;font-family:system-ui;background:#0b5fff;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column}
.box{padding:24px 32px;border-radius:12px;background:rgba(255,255,255,.15)}h1{font-size:28px;margin:0 0 8px}p{margin:0;opacity:.85}</style></head>
<body><div class="box"><h1>CEF webview OK</h1><p>served by sidecar /page — <span id="t"></span></p></div>
<script>document.getElementById('t').textContent = 'js-ran@' + new Date().toISOString();</script>
</body></html>`);
    return;
  }

  // P0-S5 stage B: redirect into the synara web dev instance
  if (url.pathname === '/synara') {
    // NOTE: vite dev binds IPv6 [::1] only — 127.0.0.1 would get RST (verified).
    const target = `http://localhost:${process.env.SYNARA_WEB_PORT ?? '8892'}/`;
    res.writeHead(302, { location: target });
    res.end();
    return;
  }

  if (url.pathname === '/report' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (reportFile) {
        try {
          fs.appendFileSync(reportFile, body + '\n');
        } catch {}
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  if (url.pathname === '/send' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      for (const c of sseClients) sseWrite(c, body);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  if (url.pathname === '/sse-kick') {
    for (const c of sseClients) c.end();
    sseClients.clear();
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }

  if (url.pathname === '/sse-tick') {
    const n = Number(url.searchParams.get('n') ?? '100');
    const interval = Number(url.searchParams.get('interval') ?? '2');
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      sseWrite(res, JSON.stringify({ kind: 'tick', seq: i, t: Date.now() }));
      if (i >= n) {
        clearInterval(timer);
        sseWrite(res, JSON.stringify({ kind: 'tick-done', seq: n }));
        res.end();
      }
    }, interval);
    req.on('close', () => clearInterval(timer));
    return;
  }

  res.writeHead(404);
  res.end();
});

// --- WebSocket echo server --------------------------------------------------
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Set<WsSocket>();

wss.on('connection', (sock) => {
  wsClients.add(sock);
  sock.on('message', (data: Buffer | string) => {
    const s = data.toString();
    if (s === 'KICK') {
      for (const c of wsClients) c.terminate();
      return;
    }
    if (s.startsWith('TICK:')) {
      const [, ns, is] = s.split(':');
      const n = Number(ns), interval = Number(is);
      let i = 0;
      const timer = setInterval(() => {
        i += 1;
        try {
          sock.send(JSON.stringify({ kind: 'tick', seq: i, t: Date.now() }));
        } catch {
          clearInterval(timer);
        }
        if (i >= n) {
          clearInterval(timer);
          try {
            sock.send(JSON.stringify({ kind: 'tick-done', seq: n }));
          } catch {}
        }
      }, interval);
      return;
    }
    sock.send(s); // plain echo
  });
  sock.on('close', () => wsClients.delete(sock));
  sock.on('error', () => wsClients.delete(sock));
});

server.listen(0, '127.0.0.1', () => {
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : 0;
  console.log(`SIDECAR_PORT=${port}`);
});

process.on('disconnect', () => {
  server.close();
  process.exit(0);
});
