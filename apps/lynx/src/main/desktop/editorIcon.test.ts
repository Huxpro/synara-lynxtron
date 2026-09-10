import { describe, expect, it } from '@rstest/core';

import { fetchEditorIconDataUrl } from './editorIcon';

describe('desktop editor icon bridge', () => {
  it('returns a bounded image data URL from the configured Synara endpoint', async () => {
    let requestedUrl = '';
    const result = await fetchEditorIconDataUrl({
      editorId: 'cursor',
      wsUrl: 'ws://127.0.0.1:53742/?token=secret',
      fetchImpl: async (input) => {
        requestedUrl = String(input);
        return new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: { 'content-type': 'image/png' },
        });
      },
    });

    expect(requestedUrl).toBe(
      'http://127.0.0.1:53742/api/editor-icon?token=secret&id=cursor'
    );
    expect(result).toBe('data:image/png;base64,iVBORw==');
  });

  it('rejects missing, non-image, and failed icon responses', async () => {
    await expect(
      fetchEditorIconDataUrl({
        editorId: '',
        wsUrl: 'ws://127.0.0.1:53742',
      })
    ).resolves.toBeNull();
    await expect(
      fetchEditorIconDataUrl({
        editorId: 'cursor',
        wsUrl: 'ws://127.0.0.1:53742',
        fetchImpl: async () => new Response('missing', { status: 404 }),
      })
    ).resolves.toBeNull();
    await expect(
      fetchEditorIconDataUrl({
        editorId: 'cursor',
        wsUrl: 'ws://127.0.0.1:53742',
        fetchImpl: async () =>
          new Response('not an image', {
            headers: { 'content-type': 'text/plain' },
          }),
      })
    ).resolves.toBeNull();
  });
});
