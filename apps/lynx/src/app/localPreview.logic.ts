import {
  LOCAL_IMAGE_ROUTE_PATH,
  LOCAL_PDF_PAGE_ROUTE_PATH,
} from "@synara/shared/localPreviewFiles";

export function buildRuntimeHttpUrl(input: {
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly wsUrl: string;
}): string {
  const endpoint = new URL(input.wsUrl);
  if (endpoint.protocol !== "ws:" && endpoint.protocol !== "wss:") {
    throw new Error("Synara runtime URL must use ws: or wss:.");
  }
  endpoint.protocol = endpoint.protocol === "wss:" ? "https:" : "http:";
  endpoint.pathname = input.path;
  endpoint.hash = "";
  for (const [key, value] of Object.entries(input.query ?? {})) {
    endpoint.searchParams.set(key, value);
  }
  return endpoint.toString();
}

export function buildWorkspaceLocalPreviewUrl(input: {
  readonly cwd: string;
  readonly path: string;
  readonly wsUrl: string;
}): string {
  return buildRuntimeHttpUrl({
    wsUrl: input.wsUrl,
    path: LOCAL_IMAGE_ROUTE_PATH,
    query: { path: input.path, cwd: input.cwd },
  });
}

export function buildPdfPagePreviewUrl(input: {
  readonly page: number;
  readonly previewUrl: string;
  readonly width?: number;
}): string {
  const match = input.previewUrl.match(/^(https?:\/\/[^/?#]+)(?:\/[^?#]*)?(\?[^#]*)?/);
  if (!match) throw new Error("PDF preview URL must use http: or https:.");
  const existingQuery = match[2]?.slice(1);
  const query = [
    ...(existingQuery ? [existingQuery] : []),
    `page=${encodeURIComponent(String(input.page))}`,
    `width=${encodeURIComponent(String(input.width ?? 960))}`,
  ].join("&");
  return `${match[1]}${LOCAL_PDF_PAGE_ROUTE_PATH}?${query}`;
}
