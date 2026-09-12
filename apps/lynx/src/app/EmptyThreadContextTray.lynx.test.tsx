import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';

import { EmptyThreadContextTray } from './EmptyThreadContextTray.lynx';

const defaultProps = {
  envMode: 'local' as const,
  onTemporaryChange: rs.fn(),
  projectName: 'Environment Current',
  temporary: false,
};

describe('empty Thread context tray', () => {
  it('does not invent a branch when the server snapshot has none', () => {
    render(<EmptyThreadContextTray {...defaultProps} branch={null} />);

    const statuses = elementTree.root?.querySelectorAll(
      '.EmptyThreadContextStatus'
    );
    expect(statuses).toHaveLength(1);
    expect(elementTree.root?.textContent).toContain('Environment Current');
    expect(elementTree.root?.textContent).toContain('Local');
    expect(elementTree.root?.textContent).not.toContain('main');
  });

  it('renders the exact branch supplied by the server snapshot', () => {
    render(
      <EmptyThreadContextTray
        {...defaultProps}
        branch="feature/fidelity"
      />
    );

    const statuses = elementTree.root?.querySelectorAll(
      '.EmptyThreadContextStatus'
    );
    expect(statuses).toHaveLength(2);
    expect(elementTree.root?.textContent).toContain('feature/fidelity');
  });

  it('renders live environment and temporary controls for landing drafts', () => {
    const onEnvModeChange = rs.fn();
    const onTemporaryChange = rs.fn();
    render(
      <EmptyThreadContextTray
        {...defaultProps}
        onEnvModeChange={onEnvModeChange}
        onTemporaryChange={onTemporaryChange}
        projectControl={<text className="ProjectControl">github</text>}
      />
    );

    expect(elementTree.root?.querySelector('.ProjectControl')?.textContent).toBe(
      'github'
    );
    expect(elementTree.root?.textContent).toContain('Local');
    expect(elementTree.root?.textContent).toContain('Temporary');
    expect(
      elementTree.root?.querySelector('.EmptyThreadContextStatus--interactive')
    ).not.toBeNull();
  });
});
