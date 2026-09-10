#!/usr/bin/env node

import WebSocket from 'ws';

const serverUrl = process.argv[2] ?? 'ws://127.0.0.1:58090';
const timeoutMs = 10_000;
let sequence = 0;

function openSocket(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`open timeout: ${url}`));
    }, timeoutMs);
    socket.once('open', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('error', reject);
  });
}

function request(socket, tag, payload = {}) {
  const requestId = String(++sequence);
  const startedAt = performance.now();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('message', onMessage);
      reject(new Error(`${tag} requestId=${requestId} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const onMessage = (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (message?._tag !== 'Exit' || message.requestId !== requestId) return;
      clearTimeout(timer);
      socket.off('message', onMessage);
      const elapsedMs = Math.round(performance.now() - startedAt);
      if (message.exit?._tag === 'Success') {
        resolve({ tag, requestId, elapsedMs, value: message.exit.value });
      } else {
        reject(
          new Error(
            `${tag} requestId=${requestId} failed after ${elapsedMs}ms: ${JSON.stringify(
              message.exit?.cause
            )}`
          )
        );
      }
    };
    socket.on('message', onMessage);
    socket.send(JSON.stringify({ _tag: 'Request', id: requestId, tag, payload, headers: [] }));
  });
}

async function main() {
  const bootstrapUrl = new URL(serverUrl);
  bootstrapUrl.pathname = '/ws/bootstrap';
  const bootstrap = await openSocket(bootstrapUrl.toString());
  const negotiated = await request(bootstrap, 'bootstrap.negotiate', {
    protocolEpoch: 1,
    minRevision: 1,
    maxRevision: 1,
    clientBuild: '0.5.5-lynx-snapshot-probe',
    requiredCapabilities: ['orchestration.cursor-safe-streams', 'rpc.typed-errors'],
  });
  bootstrap.close();

  const featureUrl = new URL(serverUrl);
  featureUrl.pathname = '/ws';
  featureUrl.searchParams.set('x-synara-client-build', '0.5.5-lynx-snapshot-probe');
  featureUrl.searchParams.set('x-synara-protocol-epoch', '1');
  featureUrl.searchParams.set(
    'x-synara-protocol-revision',
    String(negotiated.value.negotiatedRevision)
  );
  featureUrl.searchParams.set(
    'x-synara-server-instance',
    String(negotiated.value.serverInstanceId)
  );
  const feature = await openSocket(featureUrl.toString());
  const results = [];
  try {
    for (const tag of [
      'orchestration.getSnapshot',
      'orchestration.getShellSnapshot',
      'orchestration.getSidebarShellSnapshot',
      'orchestration.getSidebarSearchSnapshot',
    ]) {
      const result = await request(feature, tag);
      results.push({
        tag: result.tag,
        requestId: result.requestId,
        elapsedMs: result.elapsedMs,
        snapshotSequence: result.value?.snapshotSequence ?? null,
        projects: result.value?.projects?.length ?? null,
        threads: result.value?.threads?.length ?? null,
      });
    }
  } finally {
    feature.close();
  }
  process.stdout.write(`${JSON.stringify({ serverUrl, results }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
