import { LOCAL_IMAGE_ROUTE_PATH } from '@synara/shared/localPreviewFiles';

export function buildWorkspaceLocalPreviewUrl(input: {
  readonly cwd: string;
  readonly path: string;
  readonly wsUrl: string;
}): string {
  const url = new URL(input.wsUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = LOCAL_IMAGE_ROUTE_PATH;
  url.search = new URLSearchParams({
    path: input.path,
    cwd: input.cwd,
  }).toString();
  url.hash = '';
  return url.toString();
}
