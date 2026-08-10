import fs from "node:fs/promises";

import { createCanvas } from "@napi-rs/canvas";

import { resolveAllowedLocalPreviewFile } from "./localImageFiles";

const MAX_PDF_BYTES = 32 * 1024 * 1024;
const MAX_PDF_PAGES = 500;
const MIN_RENDER_WIDTH = 320;
const MAX_RENDER_WIDTH = 1600;
const PAGE_CACHE_LIMIT = 32;

export interface LocalPdfPreviewInput {
  readonly requestedPath: string | null;
  readonly cwd: string | null;
  readonly allowAbsoluteLocalPreviewFile?: boolean;
  readonly previewGrant?: string | null;
}

export interface LocalPdfMetadata {
  readonly pageCount: number;
}

export interface RenderedLocalPdfPage extends LocalPdfMetadata {
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
}

const pageCache = new Map<string, Promise<RenderedLocalPdfPage>>();
let pdfjsPromise: Promise<typeof import("pdfjs-dist/legacy/build/pdf.mjs")> | null = null;

function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs");
  return pdfjsPromise;
}

function clampRenderWidth(width: number): number {
  if (!Number.isFinite(width)) return 960;
  return Math.min(MAX_RENDER_WIDTH, Math.max(MIN_RENDER_WIDTH, Math.round(width)));
}

async function resolvePdf(input: LocalPdfPreviewInput) {
  const previewFile = await resolveAllowedLocalPreviewFile(input);
  if (!previewFile || !previewFile.path.toLowerCase().endsWith(".pdf")) {
    throw new Error("PDF preview file not found.");
  }
  if (previewFile.sizeBytes > MAX_PDF_BYTES) {
    throw new Error("PDF preview exceeds the 32 MB limit.");
  }
  const stat = await fs.stat(previewFile.path);
  return { previewFile, mtimeMs: stat.mtimeMs };
}

async function loadPdf(input: LocalPdfPreviewInput) {
  const resolved = await resolvePdf(input);
  const data = new Uint8Array(await fs.readFile(resolved.previewFile.path));
  const pdfjs = await loadPdfjs();
  const document = await pdfjs.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true,
  }).promise;
  if (document.numPages < 1 || document.numPages > MAX_PDF_PAGES) {
    await document.destroy();
    throw new Error(`PDF preview supports between 1 and ${MAX_PDF_PAGES} pages.`);
  }
  return { ...resolved, document };
}

export async function inspectLocalPdf(input: LocalPdfPreviewInput): Promise<LocalPdfMetadata> {
  const { document } = await loadPdf(input);
  try {
    return { pageCount: document.numPages };
  } finally {
    await document.destroy();
  }
}

export async function renderLocalPdfPage(
  input: LocalPdfPreviewInput & {
    readonly page: number;
    readonly width: number;
  },
): Promise<RenderedLocalPdfPage> {
  const resolved = await resolvePdf(input);
  const pageNumber = Math.round(input.page);
  const width = clampRenderWidth(input.width);
  const cacheKey = [
    resolved.previewFile.path,
    resolved.previewFile.sizeBytes,
    resolved.mtimeMs,
    pageNumber,
    width,
  ].join("\0");
  const cached = pageCache.get(cacheKey);
  if (cached) return cached;

  const pending = (async () => {
    const data = new Uint8Array(await fs.readFile(resolved.previewFile.path));
    const pdfjs = await loadPdfjs();
    const document = await pdfjs.getDocument({
      data,
      disableWorker: true,
      useSystemFonts: true,
    }).promise;
    try {
      if (document.numPages < 1 || document.numPages > MAX_PDF_PAGES) {
        throw new Error(`PDF preview supports between 1 and ${MAX_PDF_PAGES} pages.`);
      }
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > document.numPages) {
        throw new Error("PDF page is out of range.");
      }
      const page = await document.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / baseViewport.width });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const canvasContext = canvas.getContext("2d");
      await page.render({
        canvas,
        canvasContext,
        viewport,
      }).promise;
      return {
        bytes: canvas.toBuffer("image/png"),
        width: canvas.width,
        height: canvas.height,
        pageCount: document.numPages,
      };
    } finally {
      await document.destroy();
    }
  })();

  pageCache.set(cacheKey, pending);
  if (pageCache.size > PAGE_CACHE_LIMIT) {
    const oldestKey = pageCache.keys().next().value;
    if (oldestKey !== undefined) pageCache.delete(oldestKey);
  }
  void pending.catch(() => {
    if (pageCache.get(cacheKey) === pending) pageCache.delete(cacheKey);
  });
  return pending;
}
