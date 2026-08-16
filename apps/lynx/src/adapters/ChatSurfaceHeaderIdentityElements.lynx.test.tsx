import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('chat surface header identity fidelity', () => {
  it('uses the Web title typography across Landing and Thread headers', () => {
    const styles = readFileSync(
      new URL('../app/App.css', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('../app/router.tsx', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedChatHeaderIdentityTitle\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;[^}]*font-weight:\s*400;/s
    );
    expect(routerSource).toContain('title={routePresentation.headerTitle}');
    expect(routerSource).toContain(
      "title={currentThread?.title ?? 'Thread'}"
    );
    expect(routerSource).toContain('title="New chat"');
  });

  it('publishes the shared rename action instead of dropping it', () => {
    const adapterSource = readFileSync(
      new URL('./ChatSurfaceHeaderIdentityElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('../app/router.tsx', import.meta.url),
      'utf8'
    );
    expect(adapterSource).toContain('onActivate: props.onRename');
    expect(adapterSource).toContain('`Rename thread ${props.title}`');
    expect(routerSource).toContain("type: 'thread.meta.update'");
    expect(routerSource).toContain('onRename={currentThread ? beginThreadRename');
    expect(routerSource).toContain('onConfirm={() => void commitThreadRename()}');
  });
});
