// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

// P2-V2 host services: main-process implementations backing the Lynx-side
// platform ports (slice/src/platform/*) over the `-lynx-invoke` bridge.
//
//  - KV storage: JSON file on disk (write-through from the Lynx memory mirror)
//  - clipboard: Lynxtron clipboard API
//  - dialogs: Lynxtron dialog API (confirm/pickFolder/saveFile)
//  - WS echo: loopback server for the net.socket port self-test (also the
//    first concrete use of the future sidecar slot)

import {
  app,
  clipboard,
  dialog,
  LynxWindow,
  Menu,
  nativeImage,
  shell,
} from '@lynx-js/lynxtron';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import {
  PROVIDER_SEND_TURN_MAX_ATTACHMENTS,
  PROVIDER_SEND_TURN_MAX_FILE_BYTES,
} from '@synara/contracts/attachmentLimits';
import {
  ATTACHMENT_CANCEL_ROUTE_PATH,
  ATTACHMENT_UPLOAD_ROUTE_PATH,
} from '@synara/shared/binaryTransfer';
import { WebSocketServer } from 'ws';
import {
  resolveShellPaths,
  resolveShellUserDataDir,
  SHELL_CAPABILITIES,
} from './shellRuntime';
import {
  resolveAttachmentUploadPayload,
  validatePickedFileForUpload,
} from './attachmentHost.logic';

// --- KV storage ---------------------------------------------------------------

function getKvFile(): string {
  return resolveShellPaths(
    resolveShellUserDataDir(
      app.getPath('userData'),
      process.env.SYNARA_LYNX_USER_DATA_DIR
    )
  ).kvFile;
}

let kvCache: Record<string, string> | null = null;

interface PickedFileRecord {
  readonly expiresAt: number;
  readonly mimeType: string;
  readonly name: string;
  readonly path: string;
  readonly sizeBytes: number;
  readonly token: string;
}

const PICKED_FILE_TTL_MS = 30 * 60 * 1_000;
const pickedFiles = new Map<string, PickedFileRecord>();

function mimeTypeForPath(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case '.css': return 'text/css';
    case '.csv': return 'text/csv';
    case '.gif': return 'image/gif';
    case '.htm':
    case '.html': return 'text/html';
    case '.jpeg':
    case '.jpg': return 'image/jpeg';
    case '.js':
    case '.mjs': return 'text/javascript';
    case '.json': return 'application/json';
    case '.md': return 'text/markdown';
    case '.pdf': return 'application/pdf';
    case '.png': return 'image/png';
    case '.svg': return 'image/svg+xml';
    case '.ts':
    case '.tsx': return 'text/typescript';
    case '.txt': return 'text/plain';
    case '.webp': return 'image/webp';
    case '.xml': return 'application/xml';
    case '.zip': return 'application/zip';
    default: return 'application/octet-stream';
  }
}

function prunePickedFiles(now = Date.now()): void {
  for (const [token, file] of pickedFiles) {
    if (file.expiresAt <= now) pickedFiles.delete(token);
  }
}

function attachmentHttpUrl(
  route: string,
  query: Readonly<Record<string, string>> = {}
): URL {
  const socketUrl = new URL(
    process.env.SYNARA_WS_URL ?? 'ws://127.0.0.1:58090'
  );
  if (socketUrl.protocol !== 'ws:' && socketUrl.protocol !== 'wss:') {
    throw new Error('Attachment endpoint requires a ws:// or wss:// Synara URL.');
  }
  socketUrl.protocol = socketUrl.protocol === 'wss:' ? 'https:' : 'http:';
  socketUrl.pathname = route;
  socketUrl.search = '';
  socketUrl.hash = '';
  for (const [key, value] of Object.entries(query)) {
    socketUrl.searchParams.set(key, value);
  }
  return socketUrl;
}

function loadKv(): Record<string, string> {
  if (kvCache !== null) return kvCache;
  try {
    kvCache = JSON.parse(fs.readFileSync(getKvFile(), 'utf8')) as Record<string, string>;
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      kvCache = {};
    } else {
      throw new Error(`Unable to read persisted settings: ${String(error)}`);
    }
  }
  return kvCache;
}

function saveKv(): void {
  const kvFile = getKvFile();
  const temporaryFile = `${kvFile}.tmp`;
  fs.mkdirSync(path.dirname(kvFile), { recursive: true });
  fs.writeFileSync(temporaryFile, JSON.stringify(loadKv()), 'utf8');
  fs.renameSync(temporaryFile, kvFile);
}

export function handleStorage(method: string, data: any): unknown {
  const kv = loadKv();
  switch (method) {
    case 'storageGet':
      return JSON.stringify({ value: kv[String(data.key)] ?? null });
    case 'storageSet':
      kv[String(data.key)] = String(data.value);
      saveKv();
      return JSON.stringify({ ok: true });
    case 'storageRemove':
      delete kv[String(data.key)];
      saveKv();
      return JSON.stringify({ ok: true });
    case 'storageClear':
      kvCache = {};
      saveKv();
      return JSON.stringify({ ok: true });
    case 'storageDump':
      return JSON.stringify({ entries: kv });
    default:
      return JSON.stringify({ error: 'unknown storage method ' + method });
  }
}

// --- clipboard ------------------------------------------------------------------

async function renderProfileShareCard(svg: string): Promise<Buffer> {
  if (!svg.startsWith('<svg') || svg.length > 1_000_000) {
    throw new Error('Profile share card SVG is invalid.');
  }
  const { default: sharp } = await import('sharp');
  return sharp(Buffer.from(svg, 'utf8'), {
    density: 144,
    limitInputPixels: 860 * 440 * 4,
  })
    .resize(860, 440)
    .png()
    .toBuffer();
}

export async function handleClipboard(
  method: string,
  data: any
): Promise<unknown> {
  switch (method) {
    case 'clipboardWriteText':
      clipboard.writeText(String(data.text ?? ''));
      return JSON.stringify({ ok: true });
    case 'clipboardReadText':
      return JSON.stringify({ text: clipboard.readText() });
    case 'clipboardWriteImagePngDataUrl': {
      const image = nativeImage.createFromDataURL(String(data.dataUrl ?? ''));
      if (image.isEmpty()) {
        return JSON.stringify({ ok: false });
      }
      clipboard.writeImage(image);
      return JSON.stringify({ ok: true });
    }
    case 'profileShareExport': {
      const png = await renderProfileShareCard(String(data.svg ?? ''));
      const image = nativeImage.createFromBuffer(png);
      if (image.isEmpty()) {
        throw new Error('Unable to render profile share card.');
      }
      clipboard.writeImage(image);
      return JSON.stringify({ ok: true });
    }
    default:
      return JSON.stringify({ error: 'unknown clipboard method ' + method });
  }
}

// --- context menu ---------------------------------------------------------------

export function handleContextMenu(
  w: LynxWindow,
  method: string,
  data: any
): Promise<unknown> {
  if (method !== 'contextMenuShow') {
    return Promise.resolve(
      JSON.stringify({ error: 'unknown context menu method ' + method })
    );
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const position = data?.position ?? {};
  return new Promise((resolve) => {
    let settled = false;
    const finish = (id: string | null) => {
      if (settled) return;
      settled = true;
      resolve(JSON.stringify({ id }));
    };
    const template: any[] = [];
    for (const item of items) {
      if (item?.separatorBefore && template.length > 0) {
        template.push({ type: 'separator' });
      }
      template.push({
        id: String(item?.id ?? ''),
        label: String(item?.label ?? ''),
        click: () => finish(String(item?.id ?? '')),
      });
    }
    const menu = Menu.buildFromTemplate(template);
    menu.popup({
      window: w,
      x: Math.max(0, Math.round(Number(position.x) || 0)),
      y: Math.max(0, Math.round(Number(position.y) || 0)),
      callback: () => finish(null),
    });
  });
}

// --- dialogs ----------------------------------------------------------------------

export async function handleDialogs(
  w: LynxWindow,
  method: string,
  data: any
): Promise<unknown> {
  switch (method) {
    case 'dialogsConfirm': {
      const message = String(data.message ?? '');
      const lines = message.split('\n');
      const { response } = await dialog.showMessageBox(w, {
        title: lines[0] ?? message,
        message: lines[0] ?? message,
        detail: lines.slice(1).join('\n').trim() || undefined,
        buttons: ['Cancel', 'Confirm'],
        defaultId: 1,
        cancelId: 0,
      });
      return JSON.stringify({ confirmed: response === 1 });
    }
    case 'dialogsPickFolder': {
      const { canceled, filePaths } = await dialog.showOpenDialog(w, {
        title: String(data.title ?? 'Choose folder'),
        properties: ['openDirectory', 'createDirectory'],
      });
      return JSON.stringify({ path: canceled || filePaths.length === 0 ? null : filePaths[0] });
    }
    case 'dialogsPickFiles': {
      const { canceled, filePaths } = await dialog.showOpenDialog(w, {
        title: String(data.title ?? 'Add files'),
        properties: ['openFile', 'multiSelections'],
      });
      if (canceled || filePaths.length === 0) {
        return JSON.stringify({ files: [], errors: [] });
      }
      prunePickedFiles();
      const files: Array<{
        token: string;
        name: string;
        mimeType: string;
        sizeBytes: number;
      }> = [];
      const errors: string[] = [];
      for (const filePath of filePaths.slice(0, PROVIDER_SEND_TURN_MAX_ATTACHMENTS)) {
        try {
          const resolvedPath = fs.realpathSync(filePath);
          const stat = fs.statSync(resolvedPath);
          const name = path.basename(resolvedPath);
          if (!stat.isFile()) {
            errors.push(`'${name}' is not a regular file.`);
            continue;
          }
          if (stat.size > PROVIDER_SEND_TURN_MAX_FILE_BYTES) {
            errors.push(`'${name}' exceeds the 25MB attachment limit.`);
            continue;
          }
          const token = randomUUID();
          const file = {
            token,
            path: resolvedPath,
            name,
            mimeType: mimeTypeForPath(resolvedPath),
            sizeBytes: stat.size,
            expiresAt: Date.now() + PICKED_FILE_TTL_MS,
          } satisfies PickedFileRecord;
          pickedFiles.set(token, file);
          files.push({
            token: file.token,
            name: file.name,
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
          });
        } catch (error) {
          errors.push(`Unable to add '${path.basename(filePath)}': ${String(error)}`);
        }
      }
      if (filePaths.length > PROVIDER_SEND_TURN_MAX_ATTACHMENTS) {
        errors.push(
          `You can attach up to ${PROVIDER_SEND_TURN_MAX_ATTACHMENTS} references per message.`
        );
      }
      return JSON.stringify({ files, errors });
    }
    case 'dialogsPickProfileImage': {
      const { canceled, filePaths } = await dialog.showOpenDialog(w, {
        title: 'Choose profile photo',
        properties: ['openFile'],
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
          },
        ],
      });
      if (canceled || filePaths.length === 0) {
        return JSON.stringify({ image: null });
      }
      const filePath = fs.realpathSync(filePaths[0]!);
      const stat = fs.statSync(filePath);
      if (!stat.isFile() || stat.size > 10 * 1024 * 1024) {
        throw new Error('Profile photo must be an image smaller than 10MB.');
      }
      const image = nativeImage.createFromPath(filePath);
      if (image.isEmpty()) {
        throw new Error('Unable to decode that profile photo.');
      }
      const size = image.getSize();
      const scale = Math.min(1, 256 / Math.max(size.width, size.height));
      const resized =
        scale < 1
          ? image.resize({
              width: Math.max(1, Math.round(size.width * scale)),
              height: Math.max(1, Math.round(size.height * scale)),
              quality: 'good',
            })
          : image;
      return JSON.stringify({
        image: {
          dataUrl: resized.toDataURL(),
          name: path.basename(filePath),
        },
      });
    }
    case 'dialogsSaveProfileShareCard': {
      const png = await renderProfileShareCard(String(data.svg ?? ''));
      const { canceled, filePath } = await dialog.showSaveDialog(w, {
        title: 'Save profile activity',
        defaultPath: String(data.defaultFilename ?? 'synara-stats.png'),
        filters: [{ name: 'PNG image', extensions: ['png'] }],
      });
      if (canceled || !filePath) return JSON.stringify({ path: null });
      fs.writeFileSync(filePath, png);
      return JSON.stringify({ path: filePath });
    }
    case 'dialogsSaveFile': {
      const input = data ?? {};
      const { canceled, filePath } = await dialog.showSaveDialog(w, {
        title: String(input.title ?? 'Save file'),
        defaultPath: input.defaultFilename ? String(input.defaultFilename) : undefined,
        filters: Array.isArray(input.filters)
          ? input.filters.map((f: any) => ({ name: String(f.name), extensions: f.extensions.map(String) }))
          : undefined,
      });
      if (canceled || !filePath) {
        return JSON.stringify({ path: null });
      }
      fs.writeFileSync(filePath, String(input.contents ?? ''), 'utf8');
      return JSON.stringify({ path: filePath });
    }
    case 'dialogsPing':
      return JSON.stringify({
        ok: true,
        apis: {
          showMessageBox: typeof dialog.showMessageBox === 'function',
          showOpenDialog: typeof dialog.showOpenDialog === 'function',
          showSaveDialog: typeof dialog.showSaveDialog === 'function',
        },
      });
    default:
      return JSON.stringify({ error: 'unknown dialogs method ' + method });
  }
}

// --- attachment staging ---------------------------------------------------------

export async function handleAttachments(
  method: string,
  data: any
): Promise<unknown> {
  prunePickedFiles();
  if (method === 'attachmentsReleasePickedFile') {
    return JSON.stringify({ released: pickedFiles.delete(String(data.token ?? '')) });
  }
  if (method === 'attachmentsCancel') {
    const attachmentId = String(data.attachmentId ?? '');
    if (!attachmentId || attachmentId.length > 128 || !/^[a-z0-9_-]+$/i.test(attachmentId)) {
      return JSON.stringify({ error: 'Attachment id is invalid.' });
    }
    const response = await fetch(attachmentHttpUrl(ATTACHMENT_CANCEL_ROUTE_PATH), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'synara://app',
      },
      body: JSON.stringify({ attachmentId }),
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Attachment cleanup failed with status ${response.status}.`);
    }
    return JSON.stringify({ cancelled: response.ok });
  }
  if (method !== 'attachmentsUploadPickedFile') {
    return JSON.stringify({ error: `unknown attachments method ${method}` });
  }

  const token = String(data.token ?? '');
  const threadId = String(data.threadId ?? '').trim();
  const file = pickedFiles.get(token);
  if (!file) throw new Error('The selected file is no longer available. Pick it again.');
  if (!threadId) throw new Error('A thread is required to upload an attachment.');
  const currentStat = fs.statSync(file.path);
  validatePickedFileForUpload({
    file,
    currentIsFile: currentStat.isFile(),
    currentSizeBytes: currentStat.size,
  });
  const bytes = await fs.promises.readFile(file.path);
  if (bytes.byteLength > PROVIDER_SEND_TURN_MAX_FILE_BYTES) {
    throw new Error(`'${file.name}' exceeds the 25MB attachment limit.`);
  }
  const response = await fetch(
    attachmentHttpUrl(ATTACHMENT_UPLOAD_ROUTE_PATH, {
      threadId,
      type: 'file',
      name: file.name,
      mimeType: file.mimeType,
    }),
    {
      method: 'POST',
      headers: {
        'Content-Length': String(bytes.byteLength),
        'Content-Type': file.mimeType,
        Origin: 'synara://app',
      },
      body: bytes,
    }
  );
  const payload = resolveAttachmentUploadPayload({
    ok: response.ok,
    status: response.status,
    payload: await response.json().catch(() => null),
  });
  return JSON.stringify({ attachment: payload });
}

// --- shell/window ---------------------------------------------------------------

function windowState(w: LynxWindow): {
  readonly isMaximized: boolean;
  readonly isFullscreen: boolean;
} {
  return {
    isMaximized: w.isMaximized(),
    isFullscreen: w.isFullScreen(),
  };
}

export async function handleShell(
  w: LynxWindow,
  method: string,
  data: any
): Promise<unknown> {
  switch (method) {
    case 'shellCapabilities':
      return JSON.stringify(SHELL_CAPABILITIES);
    case 'windowMinimize':
      w.minimize();
      return JSON.stringify({ ok: true });
    case 'windowToggleMaximize':
      if (w.isMaximized()) w.unmaximize();
      else w.maximize();
      return JSON.stringify(windowState(w));
    case 'windowClose':
      w.close();
      return JSON.stringify({ ok: true });
    case 'windowGetState':
      return JSON.stringify(windowState(w));
    case 'windowGetViewport': {
      const bounds = w.getContentBounds();
      return JSON.stringify({
        width: bounds.width,
        height: bounds.height,
      });
    }
    case 'shellOpenExternal': {
      const raw = String(data.url ?? '');
      let parsed: URL;
      try {
        parsed = new URL(raw);
      } catch {
        return JSON.stringify({ opened: false });
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return JSON.stringify({ opened: false });
      }
      await shell.openExternal(parsed.toString());
      return JSON.stringify({ opened: true });
    }
    default:
      return JSON.stringify({ error: 'unknown shell method ' + method });
  }
}

// --- WS echo (net.socket self-test) ------------------------------------------------

let echoPortPromise: Promise<number> | null = null;

export function ensureWsEcho(): Promise<number> {
  echoPortPromise ??= new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
    wss.once('error', reject);
    wss.once('listening', () => {
      const addr = wss.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      if (port === 0) {
        reject(new Error('WebSocket echo server did not bind a port'));
        return;
      }
      console.log('[hostServices] ws echo listening on', port);
      resolve(port);
    });
    wss.on('connection', (sock) => {
      sock.on('message', (data: Buffer | string) => {
        sock.send(data.toString());
      });
    });
  });
  echoPortPromise.catch(() => {
    echoPortPromise = null;
  });
  return echoPortPromise;
}
