#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import WebSocket from "ws";

const CLIENT_BUILD = "0.5.5-lynx-preflight";
const REQUIRED_CAPABILITIES = ["orchestration.cursor-safe-streams", "rpc.typed-errors"];
const OPEN_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 10_000;
let requestSequence = 0;

export function parseRuntimeWsUrl(html) {
  const match = html.match(/globalThis\.__SYNARA_LYNX_RUNTIME__=(\{[^<]+\});<\/script>/);
  if (!match?.[1]) return null;
  const parsed = JSON.parse(match[1]);
  return typeof parsed.wsUrl === "string" ? parsed.wsUrl : null;
}

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    values.set(key, argv[index + 1] ?? "");
    index += 1;
  }
  return {
    serverUrl: values.get("--server-url") ?? "ws://127.0.0.1:58090",
    webOrigin: values.get("--web-origin") ?? "http://localhost:5733",
  };
}

function withProtocol(url, protocol) {
  const parsed = new URL(url);
  parsed.protocol = protocol;
  return parsed;
}

export function buildProbeSocketUrl(serverUrl, pathname, query = {}) {
  const url = new URL(serverUrl);
  url.pathname = pathname;
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function fetchOk(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response;
}

function openSocket(url, origin) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, origin ? { origin } : undefined);
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error(`WebSocket open timed out: ${url}`));
    }, OPEN_TIMEOUT_MS);
    socket.once("open", () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function request(socket, tag, payload, requestId) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${tag} (${requestId}) timed out after ${REQUEST_TIMEOUT_MS}ms`)),
      REQUEST_TIMEOUT_MS,
    );
    const onMessage = (data) => {
      let message;
      try {
        message = JSON.parse(String(data));
      } catch {
        return;
      }
      if (message?._tag !== "Exit" || message.requestId !== requestId) return;
      clearTimeout(timer);
      socket.off("message", onMessage);
      if (message.exit?._tag === "Success") {
        resolve(message.exit.value);
      } else {
        reject(new Error(`${tag} failed: ${JSON.stringify(message.exit?.cause)}`));
      }
    };
    socket.on("message", onMessage);
    socket.send(JSON.stringify({ _tag: "Request", id: requestId, tag, payload, headers: [] }));
  });
}

async function probeRpc(serverUrl, origin, label) {
  const bootstrap = await openSocket(buildProbeSocketUrl(serverUrl, "/ws/bootstrap"), origin);
  let compatibility;
  try {
    compatibility = await request(
      bootstrap,
      "bootstrap.negotiate",
      {
        protocolEpoch: 1,
        minRevision: 1,
        maxRevision: 1,
        clientBuild: CLIENT_BUILD,
        requiredCapabilities: REQUIRED_CAPABILITIES,
      },
      String(++requestSequence),
    );
  } finally {
    bootstrap.close();
  }
  const query = {
    "x-synara-client-build": CLIENT_BUILD,
    "x-synara-protocol-epoch": String(compatibility.protocolEpoch),
    "x-synara-protocol-revision": String(compatibility.negotiatedRevision),
    "x-synara-server-instance": compatibility.serverInstanceId,
  };
  const feature = await openSocket(buildProbeSocketUrl(serverUrl, "/ws", query), origin);
  try {
    const snapshot = await request(
      feature,
      "orchestration.getSnapshot",
      {},
      String(++requestSequence),
    );
    return {
      label,
      origin: origin ?? null,
      serverInstanceId: compatibility.serverInstanceId,
      snapshotSequence: snapshot.snapshotSequence,
    };
  } finally {
    feature.close();
  }
}

export async function runConnectionPreflight({ serverUrl, webOrigin }) {
  const httpOrigin = withProtocol(
    serverUrl,
    serverUrl.startsWith("wss:") ? "https:" : "http:",
  ).origin;
  await fetchOk(`${httpOrigin}/health`);
  await fetchOk(`${webOrigin}/`);
  const lynxResponse = await fetchOk(`${webOrigin}/lynx/index.html`);
  const runtimeWsUrl = parseRuntimeWsUrl(await lynxResponse.text());
  if (runtimeWsUrl !== serverUrl) {
    throw new Error(
      `Lynx runtime endpoint mismatch: expected ${serverUrl}, received ${runtimeWsUrl ?? "<missing>"}`,
    );
  }
  // Keep the gate deterministic and avoid turning certification itself into a
  // burst-load test. The three cells exercise distinct trust/provenance paths
  // but do not need concurrent bootstrap sockets.
  const web = await probeRpc(serverUrl, webOrigin, "web");
  const lynx = await probeRpc(serverUrl, webOrigin, "lynx-for-web");
  const native = await probeRpc(serverUrl, null, "lynxtron-native");
  return { serverUrl, webOrigin, runtimeWsUrl, probes: [web, lynx, native] };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  runConnectionPreflight(parseArgs(process.argv.slice(2)))
    .then((result) => {
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
      process.exitCode = 1;
    });
}
