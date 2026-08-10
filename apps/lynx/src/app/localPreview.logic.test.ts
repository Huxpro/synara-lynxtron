import { describe, expect, it } from '@rstest/core';
import {
  LOCAL_PDF_PAGE_ROUTE_PATH,
  SUPPORTED_LOCAL_IMAGE_EXTENSIONS,
  SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX,
} from '@synara/shared/localPreviewFiles';

import {
  buildPdfPagePreviewUrl,
  buildWorkspaceLocalPreviewUrl,
} from './localPreview.logic';

describe('workspace local preview URL', () => {
  it('maps ws and wss endpoints to the shared HTTP preview route', () => {
    expect(
      buildWorkspaceLocalPreviewUrl({
        wsUrl: 'ws://127.0.0.1:58090/stale?token=x',
        cwd: '/tmp/project',
        path: 'images/preview one.png',
      })
    ).toBe(
      'http://127.0.0.1:58090/api/local-image?path=images%2Fpreview+one.png&cwd=%2Ftmp%2Fproject'
    );
    expect(
      buildWorkspaceLocalPreviewUrl({
        wsUrl: 'wss://synara.example/socket',
        cwd: '/repo',
        path: 'image.webp',
      })
    ).toBe(
      'https://synara.example/api/local-image?path=image.webp&cwd=%2Frepo'
    );
  });

  it('keeps the static image regex aligned with the canonical allowlist', () => {
    for (const extension of SUPPORTED_LOCAL_IMAGE_EXTENSIONS) {
      expect(`preview${extension}`).toMatch(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX);
    }
    expect('preview.pdf').not.toMatch(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX);
    expect('preview.png.txt').not.toMatch(SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX);
  });

  it('derives a rendered PDF page URL without dropping safe file identity', () => {
    expect(
      buildPdfPagePreviewUrl({
        previewUrl:
          'http://127.0.0.1:58090/api/local-image?path=reports%2Fpreview.pdf&cwd=%2Frepo',
        page: 3,
        width: 1200,
      })
    ).toBe(
      `http://127.0.0.1:58090${LOCAL_PDF_PAGE_ROUTE_PATH}?path=reports%2Fpreview.pdf&cwd=%2Frepo&page=3&width=1200`
    );
  });
});
