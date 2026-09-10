import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Electron Components Lab menu navigation', () => {
  it('routes the native menu action from the root shell', () => {
    const root = readFileSync(new URL('./__root.tsx', import.meta.url), 'utf8');
    const desktop = readFileSync(
      new URL('../../../desktop/src/main.ts', import.meta.url),
      'utf8'
    );
    expect(desktop).toContain('label: "Components Lab…"');
    expect(desktop).toContain('dispatchMenuAction("open-components-lab")');
    expect(root).toContain('<GlobalComponentsLabMenuNavigation />');
    expect(root).toContain('action !== "open-components-lab"');
    expect(root).toContain('navigate({ to: "/components-lab", search: {} })');
  });

  it('isolates the lab from product-global notification surfaces', () => {
    const root = readFileSync(new URL('./__root.tsx', import.meta.url), 'utf8');
    expect(root).toContain('const componentsLabActive = pathname === "/components-lab"');
    expect(root).toContain(
      'componentsLabActive ? null : <ProviderUpdateNotifications />'
    );
    expect(root).toContain(
      'componentsLabActive ? null : <TaskCompletionNotifications />'
    );
    expect(root).toContain('if (activeToast?.kind !== "prompt") return');
    expect(root).toContain('toastManager.close(activeToast.toastId)');
  });
});
