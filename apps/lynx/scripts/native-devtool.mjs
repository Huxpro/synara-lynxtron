#!/usr/bin/env node
// Drive and inspect a running native Lynxtron session through Lynx DevTool.
//
//   node scripts/native-devtool.mjs texts                 visible text, in tree order
//   node scripts/native-devtool.mjs tap <text>            tap the element showing <text>
//   node scripts/native-devtool.mjs tap-label <label>     tap the element with that aria-label
//   node scripts/native-devtool.mjs tap-at <x> <y>        tap at logical coordinates
//   node scripts/native-devtool.mjs inspect <label>       attributes of the element with that aria-label
//   node scripts/native-devtool.mjs type <text>           insert text into the focused input
//   node scripts/native-devtool.mjs screenshot <out.png>  DevTool screencast frame (frame dump fallback)
//   node scripts/native-devtool.mjs console [seconds]     stream console messages and exceptions
//
// The session must run with DevTool enabled (linux-dev.mjs native does this).

import fs from "node:fs";
import path from "node:path";
import { ReadableStream } from "node:stream/web";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

import { Connector } from "@lynx-js/devtool-connector";
import { DesktopTransport } from "@lynx-js/devtool-connector/transport";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultFrameDump = path.join(appRoot, ".runtime", "linux-dev", "frame.ppm");

async function connect() {
  const connector = new Connector([new DesktopTransport()]);
  const clients = await connector.listClients();
  if (clients.length === 0) {
    throw new Error("No Lynx DevTool client on 127.0.0.1:8901-8920; is the native app running?");
  }
  const client = clients[0];
  const sessions = await connector.sendListSessionMessage(client.id);
  const session = sessions.findLast((entry) => entry.type === "lynx");
  if (!session) throw new Error(`DevTool client ${client.id} has no Lynx session`);
  const sessionId = Number(session.session_id);
  return {
    connector,
    clientId: client.id,
    sessionId,
    cdp: (method, params = {}) => connector.sendCDPMessage(client.id, sessionId, method, params),
  };
}

export function flattenDom(root) {
  const nodes = [];
  (function walk(node, parent) {
    const list = node.attributes ?? [];
    const attrs = {};
    for (let index = 0; index + 1 < list.length; index += 2) attrs[list[index]] = list[index + 1];
    const record = { id: node.nodeId, name: node.nodeName, attrs, parent, children: [] };
    nodes.push(record);
    parent?.children.push(record);
    for (const child of node.children ?? []) walk(child, record);
  })(root, null);
  return nodes;
}

export function visibleTexts(nodes) {
  return nodes
    .filter((node) => node.name === "RAW-TEXT" && node.attrs.text?.trim())
    .map((node) => node.attrs.text.trim());
}

async function snapshot(cdp) {
  const document = await cdp("DOM.getDocument", { depth: -1 });
  return flattenDom(document.root ?? document);
}

async function centerOf(cdp, nodeId) {
  const { model } = await cdp("DOM.getBoxModel", { nodeId });
  const quad = model.border ?? model.content;
  return { x: (quad[0] + quad[4]) / 2, y: (quad[1] + quad[5]) / 2 };
}

async function tapAt(cdp, x, y) {
  for (const type of ["mousePressed", "mouseReleased"]) {
    await cdp("Input.emulateTouchFromMouseEvent", {
      type,
      x: Math.round(x),
      y: Math.round(y),
      button: "left",
      clickCount: 1,
      deltaX: 0,
      deltaY: 0,
    });
  }
}

async function tapNode(cdp, node, label) {
  if (!node) throw new Error(`No element found for ${label}`);
  const point = await centerOf(cdp, node.id);
  await tapAt(cdp, point.x, point.y);
  console.log(`tapped ${label} at ${Math.round(point.x)},${Math.round(point.y)}`);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

// Binary PPM (P6, maxval 255) -> PNG.
export function ppmToPng(ppm) {
  const header = ppm.toString("latin1", 0, 64).match(/^P6\s+(\d+)\s+(\d+)\s+255\s/);
  if (!header) throw new Error("Not a binary PPM frame");
  const width = Number(header[1]);
  const height = Number(header[2]);
  const pixels = ppm.subarray(header[0].length);
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

async function screencastFrame({ connector, clientId, sessionId }) {
  let frame = null;
  let resolveFrame;
  const framePromise = new Promise((resolve) => {
    resolveFrame = resolve;
  });
  const stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    new ReadableStream({
      async start(controller) {
        controller.enqueue({
          method: "Page.startScreencast",
          params: { format: "png", mode: "lynxview" },
        });
        await Promise.race([framePromise, delay(8000)]);
        controller.close();
      },
    }),
    { signal: AbortSignal.timeout(10_000) },
  );
  try {
    for await (const message of stream) {
      if (message.method === "Page.screencastFrame" && message.params?.data) {
        frame = Buffer.from(message.params.data, "base64");
        resolveFrame();
        break;
      }
    }
  } catch {
    // Timed out without a frame.
  }
  return frame;
}

async function screenshot(out) {
  let frame = null;
  try {
    frame = await screencastFrame(await connect());
  } catch {
    // No DevTool session; fall back to the presenter's frame dump.
  }
  if (frame) {
    fs.writeFileSync(out, frame);
    console.log(`wrote ${out} from DevTool screencast`);
    return;
  }
  const dump = process.env.LYNXTRON_FRAME_DUMP ?? defaultFrameDump;
  if (!fs.existsSync(dump)) {
    throw new Error(`No DevTool screencast frame and no frame dump at ${dump}`);
  }
  fs.writeFileSync(out, ppmToPng(fs.readFileSync(dump)));
  console.log(`wrote ${out} from ${dump}`);
}

function describeRemoteObject(arg) {
  if (arg.value !== undefined)
    return typeof arg.value === "string" ? arg.value : JSON.stringify(arg.value);
  return arg.description ?? arg.type ?? "";
}

// Replays the buffered console (Runtime.enable) and keeps streaming new
// messages from both the background and main-thread VMs.
async function streamConsole({ connector, clientId, sessionId }, seconds) {
  const stream = await connector.sendCDPStream(
    clientId,
    sessionId,
    new ReadableStream({
      async start(controller) {
        controller.enqueue({ method: "Runtime.enable" });
        controller.enqueue({ method: "Runtime.enable", sessionId: "Main" });
        await delay(seconds * 1000);
        controller.close();
      },
    }),
    { signal: AbortSignal.timeout(seconds * 1000 + 2000) },
  );
  try {
    for await (const message of stream) {
      const thread =
        message.sessionId === "Main" || message.params?.consoleTag === "Lepus" ? "main" : "bg";
      if (message.method === "Runtime.consoleAPICalled") {
        const text = (message.params.args ?? []).map(describeRemoteObject).join(" ");
        console.log(`[${thread}/${message.params.type}] ${text}`);
      } else if (message.method === "Runtime.exceptionThrown") {
        const details = message.params.exceptionDetails ?? {};
        console.log(
          `[${thread}/exception] ${details.exception?.description ?? details.text ?? ""}`,
        );
      }
    }
  } catch {
    // The stream ends by timeout.
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === "screenshot") return screenshot(args[0] ?? "native.png");
  const session = await connect();
  const { cdp } = session;
  if (command === "texts") {
    console.log(visibleTexts(await snapshot(cdp)).join("\n"));
  } else if (command === "tap") {
    const text = args.join(" ");
    const nodes = await snapshot(cdp);
    const raw = nodes.find((node) => node.name === "RAW-TEXT" && node.attrs.text?.trim() === text);
    await tapNode(cdp, raw?.parent, JSON.stringify(text));
  } else if (command === "tap-label") {
    const label = args.join(" ");
    const nodes = await snapshot(cdp);
    await tapNode(
      cdp,
      nodes.find((node) => node.attrs["aria-label"] === label),
      `[aria-label=${JSON.stringify(label)}]`,
    );
  } else if (command === "inspect") {
    const label = args.join(" ");
    const node = (await snapshot(cdp)).find((entry) => entry.attrs["aria-label"] === label);
    if (!node) throw new Error(`No element with aria-label ${JSON.stringify(label)}`);
    console.log(JSON.stringify({ name: node.name, ...node.attrs }, null, 2));
  } else if (command === "tap-at") {
    await tapAt(cdp, Number(args[0]), Number(args[1]));
  } else if (command === "console") {
    await streamConsole(session, Number(args[0] ?? 5));
  } else if (command === "type") {
    await cdp("Input.insertText", { text: args.join(" ") });
  } else {
    console.log(
      fs
        .readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("\n")
        .slice(1, 11)
        .join("\n"),
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    () => process.exit(0),
    (error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    },
  );
}
