import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';

const sidebarHeaderSource = fs.readFileSync(
  path.resolve(__dirname, 'SidebarDesktopHeaderElements.lynx.tsx'),
  'utf8'
);
const chatHeaderSource = fs.readFileSync(
  path.resolve(__dirname, 'ChatSurfaceHeaderFrameElements.lynx.tsx'),
  'utf8'
);
const appStyles = fs.readFileSync(
  path.resolve(__dirname, '../app/App.css'),
  'utf8'
);

describe('desktop window drag regions', () => {
  it('marks both shared top chrome frames as draggable', () => {
    expect(sidebarHeaderSource).toContain(
      'className="AppSidebarTitlebar AppWindowDragRegion"'
    );
    expect(chatHeaderSource).toContain('AppWindowDragRegion');
  });

  it('uses the Lynxtron app-region property and protects controls', () => {
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion\s*\{[^}]*-x-app-region:\s*drag;/s
    );
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion \.LxButton,[^{]*\{[^}]*-x-app-region:\s*no-drag;/s
    );
  });
});
