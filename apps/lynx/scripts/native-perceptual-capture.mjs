#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ReadableStream } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";

const DEFAULT_CONNECTOR_PATH = "/Users/bytedance/.agents/skills/lynx-devtool/scripts/connector.mjs";

function parseArguments(argv) {
  const options = {
    connectorPath: process.env.LYNX_DEVTOOL_CONNECTOR ?? DEFAULT_CONNECTOR_PATH,
    roles: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--root-pid") options.rootPid = Number(argv[++index]);
    else if (argument === "--output") options.output = path.resolve(argv[++index] ?? "");
    else if (argument === "--state-id") options.stateId = argv[++index];
    else if (argument === "--semantic-route") options.semanticRoute = argv[++index];
    else if (argument === "--theme") options.theme = argv[++index];
    else if (argument === "--density") options.density = argv[++index];
    else if (argument === "--interaction-state") options.interactionState = argv[++index];
    else if (argument === "--build-sha256") options.buildSha256 = argv[++index];
    else if (argument === "--snapshot-sha256") options.snapshotSha256 = argv[++index];
    else if (argument === "--connector") {
      options.connectorPath = path.resolve(argv[++index] ?? "");
    } else if (argument === "--role") {
      const value = argv[++index] ?? "";
      const separator = value.indexOf("=");
      if (separator <= 0 || !value.slice(separator + 1).startsWith(".")) {
        throw new Error(`Invalid --role ${value}; expected name=.ClassName`);
      }
      options.roles.push({
        name: value.slice(0, separator),
        className: value.slice(separator + 2),
      });
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  for (const key of [
    "rootPid",
    "output",
    "stateId",
    "semanticRoute",
    "theme",
    "density",
    "interactionState",
    "buildSha256",
    "snapshotSha256",
  ]) {
    if (!options[key])
      throw new Error(`--${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)} is required`);
  }
  if (!Number.isSafeInteger(options.rootPid) || options.rootPid <= 0) {
    throw new Error("--root-pid must be a positive integer");
  }
  if (options.roles.length === 0) throw new Error("At least one --role is required");
  return options;
}

export function collectDescendantPids(rootPid, listChildren) {
  const result = [rootPid];
  for (let index = 0; index < result.length; index += 1) {
    for (const child of listChildren(result[index])) {
      if (!result.includes(child)) result.push(child);
    }
  }
  return result;
}

function childPids(parentPid) {
  try {
    return execFileSync("pgrep", ["-P", String(parentPid)], { encoding: "utf8" })
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(Number)
      .filter(Number.isSafeInteger);
  } catch {
    return [];
  }
}

export function parseListeningPorts(output) {
  return new Set(
    String(output)
      .split("\n")
      .map((line) => /^n.*:(\d+)$/.exec(line)?.[1])
      .filter(Boolean)
      .map(Number),
  );
}

function listeningPortsForPid(pid) {
  try {
    return parseListeningPorts(
      execFileSync("lsof", ["-nP", "-a", "-p", String(pid), "-iTCP", "-sTCP:LISTEN", "-Fn"], {
        encoding: "utf8",
      }),
    );
  } catch {
    return new Set();
  }
}

export function clientMatchesOwnedPorts(client, ports) {
  const serialized = JSON.stringify(client);
  return [...ports].some((port) =>
    new RegExp(`(?:localhost|127\\.0\\.0\\.1):${port}\\b`).test(serialized),
  );
}

function unwrap(result) {
  return result?.result ?? result;
}

function nodeAttributes(node) {
  const attributes = {};
  const values = node?.attributes ?? [];
  for (let index = 0; index < values.length; index += 2) {
    attributes[values[index]] = values[index + 1] ?? "";
  }
  return attributes;
}

export function findFirstNodeByClass(root, className) {
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    const classes = nodeAttributes(node).class?.split(/\s+/) ?? [];
    if (classes.includes(className)) return node;
    queue.push(...(node?.children ?? []));
    if (node?.shadowRoots) queue.push(...node.shadowRoots);
    if (node?.contentDocument) queue.push(node.contentDocument);
  }
  return null;
}

export function quadBounds(quad) {
  if (!Array.isArray(quad) || quad.length !== 8) return null;
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return {
    x: left,
    y: top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  };
}

function computedStyleMap(result) {
  return Object.fromEntries(
    (unwrap(result)?.computedStyle ?? []).map(({ name, value }) => [name, value]),
  );
}

async function captureRole(connector, clientId, sessionId, node) {
  const boxResult = await connector.sendCDPMessage(clientId, sessionId, "DOM.getBoxModel", {
    nodeId: node.nodeId,
  });
  const styleResult = await connector.sendCDPMessage(
    clientId,
    sessionId,
    "CSS.getComputedStyleForNode",
    { nodeId: node.nodeId },
  );
  const model = unwrap(boxResult)?.model;
  const style = computedStyleMap(styleResult);
  return {
    nodeId: node.nodeId,
    nodeName: node.nodeName,
    attributes: nodeAttributes(node),
    text: node.nodeValue ?? "",
    box: quadBounds(model?.border ?? model?.content),
    font: {
      family: style["font-family"] ?? null,
      size: style["font-size"] ?? null,
      weight: style["font-weight"] ?? null,
      lineHeight: style["line-height"] ?? null,
      letterSpacing: style["letter-spacing"] ?? null,
    },
    paint: {
      color: style.color ?? null,
      background: style["background-color"] ?? null,
      borderColor: style["border-color"] ?? null,
      borderWidth: style["border-width"] ?? null,
      radius: style["border-radius"] ?? null,
      shadow: style["box-shadow"] ?? null,
      opacity: style.opacity ?? null,
    },
  };
}

async function readStreamUntilIdle(stream, { idleMs = 400, maxMs = 4000 } = {}) {
  const reader = stream.getReader();
  const values = [];
  const deadline = Date.now() + maxMs;
  try {
    while (Date.now() < deadline) {
      const remaining = Math.min(idleMs, deadline - Date.now());
      const next = await Promise.race([reader.read(), delay(remaining, { timeout: true })]);
      if (next?.timeout) break;
      if (next.done) break;
      values.push(next.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  return values;
}

async function collectConsole(connector, clientId, sessionId) {
  const stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    ReadableStream.from([
      { method: "Page.enable" },
      { method: "Runtime.enable" },
      { method: "Runtime.enable", sessionId: "Main" },
    ]),
  );
  const values = await readStreamUntilIdle(stream);
  return values
    .filter(
      ({ method, params }) =>
        method === "Runtime.consoleAPICalled" && ["warning", "error"].includes(params?.type),
    )
    .map(({ params }) => ({
      type: params.type,
      thread: params.consoleTag === "Lepus" ? "main" : "background",
      text: (params.args ?? []).map((arg) => arg.value ?? arg.description ?? "").join(" "),
      stackTrace: params.stackTrace ?? null,
    }));
}

async function capturePng(connector, clientId, sessionId, outputPath) {
  const signal = AbortSignal.timeout(15000);
  let frame = null;
  let resolveFrame;
  const framePromise = new Promise((resolve) => {
    resolveFrame = resolve;
  });
  let resolveAck;
  const ackPromise = new Promise((resolve) => {
    resolveAck = resolve;
  });
  const stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    new ReadableStream({
      async start(controller) {
        controller.enqueue({
          method: "Page.startScreencast",
          params: { format: "jpeg", quality: 100, mode: "lynxview" },
        });
        await Promise.race([framePromise, delay(12000)]);
        if (frame) controller.enqueue({ method: "Page.screencastFrameAck" });
        controller.close();
        resolveAck();
      },
    }),
    { signal },
  );
  for await (const message of stream) {
    if (message.method !== "Page.screencastFrame" || !message.params?.data) continue;
    frame = Buffer.from(message.params.data, "base64");
    resolveFrame();
    await ackPromise;
    break;
  }
  await stream[Symbol.asyncDispose]?.();
  if (!frame) throw new Error("No Page.screencastFrame received");
  if (frame.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") {
    await fs.promises.writeFile(outputPath, frame);
    return;
  }
  if (frame.subarray(0, 3).toString("hex") !== "ffd8ff") {
    throw new Error("DevTool did not return PNG or JPEG bytes");
  }
  const jpegPath = `${outputPath}.capture.jpg`;
  await fs.promises.writeFile(jpegPath, frame);
  try {
    execFileSync("sips", ["-s", "format", "png", jpegPath, "--out", outputPath], {
      stdio: "ignore",
    });
  } finally {
    await fs.promises.rm(jpegPath, { force: true });
  }
  const png = await fs.promises.readFile(outputPath);
  if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error("Unable to convert DevTool frame to PNG");
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!fs.existsSync(options.connectorPath)) {
    throw new Error(`Missing DevTool connector: ${options.connectorPath}`);
  }
  process.kill(options.rootPid, 0);
  const descendants = collectDescendantPids(options.rootPid, childPids);
  const ownedPorts = new Set(descendants.flatMap((pid) => [...listeningPortsForPid(pid)]));
  const { createDefaultConnector } = await import(options.connectorPath);
  const connector = createDefaultConnector();
  const clients = await connector.listClients();
  const matches = clients.filter((client) => clientMatchesOwnedPorts(client, ownedPorts));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one PID-owned DevTool client, found ${matches.length}`);
  }
  const client = matches[0];
  const sessions = (await connector.sendListSessionMessage(client.id))
    .filter((session) => session.type === "lynx")
    .sort((left, right) => Number(left.session_id) - Number(right.session_id));
  const session = sessions.at(-1);
  if (!session) throw new Error("PID-owned client has no Lynx session");

  fs.mkdirSync(options.output, { recursive: true });
  await capturePng(
    connector,
    client.id,
    Number(session.session_id),
    path.join(options.output, "raw.png"),
  );
  const documentResult = await connector.sendCDPMessage(
    client.id,
    Number(session.session_id),
    "DOM.getDocument",
    { depth: -1 },
  );
  const document = unwrap(documentResult);
  const root = document?.root;
  if (!root) throw new Error("DOM.getDocument returned no root");
  const roles = {};
  for (const role of options.roles) {
    const node = findFirstNodeByClass(root, role.className);
    if (!node) throw new Error(`Missing required role ${role.name}=.${role.className}`);
    roles[role.name] = await captureRole(connector, client.id, Number(session.session_id), node);
  }
  const consoleMessages = await collectConsole(connector, client.id, Number(session.session_id));
  process.kill(options.rootPid, 0);

  const identity = {
    rootPid: options.rootPid,
    descendantPids: descendants,
    ownedPorts: [...ownedPorts].sort((left, right) => left - right),
    client,
    session,
  };
  const stateEcho = {
    semanticRoute: options.semanticRoute,
    theme: options.theme,
    density: options.density,
    interactionState: options.interactionState,
  };
  await Promise.all([
    fs.promises.writeFile(
      path.join(options.output, "dom.json"),
      `${JSON.stringify({ client: "native", stateId: options.stateId, root }, null, 2)}\n`,
    ),
    fs.promises.writeFile(
      path.join(options.output, "geometry.json"),
      `${JSON.stringify({ client: "native", stateId: options.stateId, roles }, null, 2)}\n`,
    ),
    fs.promises.writeFile(
      path.join(options.output, "styles.json"),
      `${JSON.stringify(
        {
          client: "native",
          stateId: options.stateId,
          roles: Object.fromEntries(
            Object.entries(roles).map(([name, value]) => [
              name,
              { font: value.font, paint: value.paint },
            ]),
          ),
        },
        null,
        2,
      )}\n`,
    ),
    fs.promises.writeFile(
      path.join(options.output, "console.txt"),
      consoleMessages
        .map((message) => `[${message.type}/${message.thread}] ${message.text}`)
        .join("\n"),
    ),
    fs.promises.writeFile(
      path.join(options.output, "capture.json"),
      `${JSON.stringify(
        {
          client: "native",
          stateId: options.stateId,
          buildSha256: options.buildSha256,
          snapshotSha256: options.snapshotSha256,
          stateEcho,
          identity,
          consoleMessages,
        },
        null,
        2,
      )}\n`,
    ),
  ]);
  console.log(
    JSON.stringify({
      output: options.output,
      stateId: options.stateId,
      clientId: client.id,
      sessionId: session.session_id,
      roleCount: Object.keys(roles).length,
      consoleMessageCount: consoleMessages.length,
    }),
  );
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().then(
    () => process.exit(0),
    (error) => {
      console.error(error instanceof Error ? error.stack : String(error));
      process.exit(1);
    },
  );
}
