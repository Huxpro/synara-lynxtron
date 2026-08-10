import { describe, expect, it } from '@rstest/core';
import {
  SUPPORTED_LOCAL_IMAGE_EXTENSIONS,
  SUPPORTED_LOCAL_IMAGE_EXTENSION_REGEX,
} from '@synara/shared/localPreviewFiles';

import { buildWorkspaceLocalPreviewUrl } from './localPreview.logic';

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
});
