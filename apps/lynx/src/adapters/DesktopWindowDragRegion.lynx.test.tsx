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
const sharedChatHeaderSource = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../web/src/components/chat/ChatSurfaceHeaderFrame.tsx'
  ),
  'utf8'
);
const webChatHeaderSource = fs.readFileSync(
  path.resolve(
    __dirname,
    '../../../web/src/components/chat/ChatSurfaceHeaderFrameElements.tsx'
  ),
  'utf8'
);
const appStyles = fs.readFileSync(
  path.resolve(__dirname, '../app/App.css'),
  'utf8'
);
const sidebarStyles = fs.readFileSync(
  path.resolve(__dirname, '../components/sidebar/sidebar.css'),
  'utf8'
);

describe('desktop window drag regions', () => {
  it('marks both shared top chrome frames as draggable', () => {
    expect(sidebarHeaderSource).toContain(
      'className="AppSidebarTitlebar AppWindowDragRegion"'
    );
    expect(chatHeaderSource).toContain('AppWindowDragRegion');
  });

  it('maps the standard header padding to the same physical 20px', () => {
    expect(sharedChatHeaderSource).toContain('padded={!editorRail}');
    expect(webChatHeaderSource).toContain('padded: _padded');
    expect(chatHeaderSource).toContain('AppWindowDragRegion--padded');
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion--padded\s*\{[^}]*padding-left:\s*20px;[^}]*padding-right:\s*20px;/s
    );
  });

  it('aligns the sidebar titlebar with the shared 46px desktop chrome', () => {
    expect(sidebarStyles).toMatch(
      /\.AppSidebarTitlebar\s*\{[^}]*height:\s*46px;[^}]*padding:\s*0 12px 0 14px;/s
    );
  });

  it('uses the Lynxtron app-region property and protects controls', () => {
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion\s*\{[^}]*-x-app-region:\s*drag;/s
    );
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion \.LxButton,[^{]*\.AppWindowDragRegion \[focusable='true'\],[^{]*\{[^}]*-x-app-region:\s*no-drag;/s
    );
  });
});
