import { EDITOR_ICON_ROUTE_PATH } from '@synara/shared/editorIcons';

import { resolveSynaraWsUrl } from './runtimeEndpoint.logic';

const MAX_EDITOR_ICON_BYTES = 1024 * 1024;

export async function fetchEditorIconDataUrl(input: {
  readonly editorId: string;
  readonly wsUrl: unknown;
  readonly fetchImpl?: typeof fetch;
}): Promise<string | null> {
  const editorId = input.editorId.trim();
  if (!editorId) return null;
  const endpoint = new URL(resolveSynaraWsUrl(input.wsUrl));
  endpoint.protocol = endpoint.protocol === 'wss:' ? 'https:' : 'http:';
  endpoint.pathname = EDITOR_ICON_ROUTE_PATH;
  endpoint.hash = '';
  endpoint.searchParams.set('id', editorId);
  const response = await (input.fetchImpl ?? fetch)(endpoint);
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type')?.split(';', 1)[0];
  if (!contentType?.startsWith('image/')) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_EDITOR_ICON_BYTES) {
    return null;
  }
  return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`;
}
