import fs from "node:fs/promises";
import path from "node:path";

import type { Plugin } from "vite";

const LYNX_DEV_PREFIX = "/lynx";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".bundle": "application/octet-stream",
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
};

export function injectLynxRuntimeConfig(html: string, wsUrl: string): string {
  const serializedConfig = JSON.stringify({ wsUrl }).replaceAll("<", "\\u003c");
  const script = `<script>globalThis.__SYNARA_LYNX_RUNTIME__=${serializedConfig};</script>`;
  return html.includes("</head>") ? html.replace("</head>", `${script}</head>`) : `${script}${html}`;
}

export function resolveLynxDevAssetPath(
  requestUrl: string,
  lynxDistDir: string,
): string | null {
  const url = new URL(requestUrl, "http://localhost");
  if (url.pathname !== LYNX_DEV_PREFIX && !url.pathname.startsWith(`${LYNX_DEV_PREFIX}/`)) {
    return null;
  }
  const rawRelativePath =
    url.pathname === LYNX_DEV_PREFIX || url.pathname === `${LYNX_DEV_PREFIX}/`
      ? "index.html"
      : url.pathname.slice(LYNX_DEV_PREFIX.length + 1);
  const relativePath = path.normalize(rawRelativePath).replace(/^[/\\]+/, "");
  if (
    relativePath.length === 0 ||
    rawRelativePath.startsWith("..") ||
    relativePath.startsWith("..") ||
    relativePath.includes("\0")
  ) {
    return null;
  }
  const root = path.resolve(lynxDistDir);
  const assetPath = path.resolve(root, relativePath);
  return assetPath.startsWith(`${root}${path.sep}`) ? assetPath : null;
}

export function lynxDevSurfacePlugin(options: {
  readonly lynxDistDir: string;
  readonly wsUrl: string;
}): Plugin {
  return {
    name: "synara-lynx-dev-surface",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const assetPath = resolveLynxDevAssetPath(request.url ?? "/", options.lynxDistDir);
        if (!assetPath) {
          next();
          return;
        }
        try {
          const extension = path.extname(assetPath);
          const raw = await fs.readFile(assetPath);
          const body =
            extension === ".html"
              ? Buffer.from(injectLynxRuntimeConfig(raw.toString("utf8"), options.wsUrl))
              : raw;
          response.statusCode = 200;
          response.setHeader("Cache-Control", "no-store");
          response.setHeader("Content-Type", CONTENT_TYPES[extension] ?? "application/octet-stream");
          response.end(body);
        } catch (error) {
          const code =
            error && typeof error === "object" && "code" in error ? String(error.code) : "";
          if (code !== "ENOENT") {
            next(error as Error);
            return;
          }
          response.statusCode = 503;
          response.setHeader("Content-Type", "text/plain; charset=utf-8");
          response.end(
            "Lynx-for-Web bundle is unavailable. Run `bun run --cwd apps/lynx build:web`.",
          );
        }
      });
    },
  };
}
