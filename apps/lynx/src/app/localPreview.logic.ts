import {
  LOCAL_IMAGE_ROUTE_PATH,
  LOCAL_PDF_PAGE_ROUTE_PATH,
} from '@synara/shared/localPreviewFiles';

export function buildWorkspaceLocalPreviewUrl(input: {
  readonly cwd: string;
  readonly path: string;
  readonly wsUrl: string;
}): string {
  const match = input.wsUrl.match(/^(ws|wss):\/\/([^/?#]+)/);
  if (!match) throw new Error('Synara preview URL must use ws: or wss:.');
  const protocol = match[1] === 'wss' ? 'https' : 'http';
  const query = [
    `path=${encodeURIComponent(input.path).replace(/%20/g, '+')}`,
    `cwd=${encodeURIComponent(input.cwd).replace(/%20/g, '+')}`,
  ].join('&');
  return `${protocol}://${match[2]}${LOCAL_IMAGE_ROUTE_PATH}?${query}`;
}

export function buildPdfPagePreviewUrl(input: {
  readonly page: number;
  readonly previewUrl: string;
  readonly width?: number;
}): string {
  const match = input.previewUrl.match(/^(https?:\/\/[^/?#]+)(?:\/[^?#]*)?(\?[^#]*)?/);
  if (!match) throw new Error('PDF preview URL must use http: or https:.');
  const existingQuery = match[2]?.slice(1);
  const query = [
    ...(existingQuery ? [existingQuery] : []),
    `page=${encodeURIComponent(String(input.page))}`,
    `width=${encodeURIComponent(String(input.width ?? 960))}`,
  ].join('&');
  return `${match[1]}${LOCAL_PDF_PAGE_ROUTE_PATH}?${query}`;
}
