import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';
import { WorkspaceFilePreviewErrorStateElement } from './WorkspaceFilePreviewErrorStateElements.lynx';

describe('WorkspaceFilePreviewErrorState Native adapter', () => {
  it('renders the shared copy and action ownership', () => {
    render(<WorkspaceFilePreviewErrorStateElement title="Could not read this file." description="The file may have moved, changed, or become unavailable." detail="ENOENT: missing.ts" retryLabel="Retry" onRetry={() => {}} onClose={() => {}} />);
    expect(elementTree.root?.textContent).toContain('Could not read this file.');
    expect(elementTree.root?.textContent).toContain('Retry');
    expect(elementTree.root?.textContent).toContain('Close preview');
    expect(elementTree.root?.textContent).toContain('ENOENT: missing.ts');
    expect(elementTree.root?.querySelector('.SharedFilePreviewErrorState')).not.toBeNull();
    const composition = readFileSync(
      new URL('../../../web/src/components/WorkspaceFilePreviewErrorState.tsx', import.meta.url),
      'utf8'
    );
    expect(composition).toContain('WorkspaceFilePreviewErrorStateElement');
    expect(composition).toContain('retryLabel={props.retrying ? "Retrying…" : "Retry"}');
  });
});
