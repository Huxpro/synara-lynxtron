import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx responsive layout contract', () => {
  it('hydrates from content bounds and subscribes to both host and Lynx resize events', () => {
    const hook = readFileSync(
      new URL('../hooks/useViewportLayout.lynx.ts', import.meta.url),
      'utf8'
    );
    const host = readFileSync(
      new URL('../main/desktop/main.ts', import.meta.url),
      'utf8'
    );
    const services = readFileSync(
      new URL('../main/desktop/hostServices.ts', import.meta.url),
      'utf8'
    );
    const webHost = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );

    expect(hook).toContain(
      "useLynxGlobalEventListener('onWindowResize', update)"
    );
    expect(hook).toContain('platformWindow.getViewportSize()');
    expect(hook).toContain('platformWindow.onViewportResize');
    expect(host).toContain("w.sendGlobalEvent('viewport:resize'");
    expect(host).toContain(
      'process.env.SYNARA_VIEWPORT_PROBE_SEQUENCE'
    );
    expect(host).toContain('w.setContentSize(size.width, size.height)');
    expect(services).toContain("case 'windowGetViewport'");
    expect(services).toContain('w.getContentBounds()');
    expect(webHost).toContain("if (method === 'windowGetViewport')");
    expect(webHost).toContain("lynxView.sendGlobalEvent?.('viewport:resize'");
    expect(webHost).toContain(
      "globalThis.addEventListener('resize', publishViewportSize)"
    );
    expect(webHost).toContain(
      "globalThis.removeEventListener('resize', publishViewportSize)"
    );
  });

  it('projects root viewport classes and replaces unsupported media-query layout', () => {
    const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const composer = readFileSync(
      new URL(
        '../adapters/composer-column-frame-surface-elements.css',
        import.meta.url
      ),
      'utf8'
    );
    const composerElement = readFileSync(
      new URL(
        '../adapters/ComposerColumnFrameSurfaceElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const tray = readFileSync(
      new URL('./empty-thread-context-tray.css', import.meta.url),
      'utf8'
    );
    const rows = readFileSync(
      new URL('../adapters/settings-row-elements.css', import.meta.url),
      'utf8'
    );

    expect(app).toContain('viewportLayoutClassName(viewportLayout)');
    expect(app).toContain('viewportBreakpointClassNames(viewportLayout)');
    expect(app).toContain('viewportHeightClassNames(viewportLayout)');
    expect(app).toContain(".filter(Boolean)\n          .join(' ')");
    expect(app).toContain('data-viewport-width={viewportLayout.width}');
    expect(composerElement).not.toContain("maxWidth: '736px'");
    expect(composer).toContain('width: calc(100% - 24px)');
    expect(composer).toContain('.SliceRoot--viewport-medium');
    expect(tray).toContain('width: calc(100% - 24px)');
    expect(tray).toContain('max-width: 736px');
    expect(rows).toContain(
      '.SliceRoot--viewport-compact .SharedSettingsRowLayout'
    );
    expect(rows).not.toContain('@media');
  });
});
