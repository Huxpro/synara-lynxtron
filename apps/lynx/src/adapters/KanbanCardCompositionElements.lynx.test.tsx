import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  KanbanCardAttachmentElement,
  KanbanCardForkElement,
  KanbanCardPinElement,
  KanbanCardProviderElement,
  KanbanCardPullRequestElement,
  KanbanCardWorktreeElement,
} from './KanbanCardCompositionElements.lynx';

describe('Kanban card metadata icon fidelity', () => {
  it('returns focus to the exact card after its native context menu closes', () => {
    const source = readFileSync(
      new URL('./KanbanCardCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('() => focusLynxNode(rootRef)');
  });

  it('uses canonical pin, worktree, fork, attachment, and PR identities', () => {
    render(
      <view>
        <KanbanCardPinElement />
        <KanbanCardWorktreeElement label="/worktrees/task" />
        <KanbanCardForkElement />
        <KanbanCardAttachmentElement />
        <KanbanCardPullRequestElement
          number={42}
          title="Ship icon fidelity"
          presentation={{
            label: 'PR merged',
            colorClass: 'text-status-merged',
            iconKind: 'merged-simple',
          }}
        />
      </view>
    );

    expect(elementTree.root?.querySelector('.SharedKanbanCardPin')).toBeTruthy();
    expect(
      elementTree.root?.querySelector('.SharedKanbanCardForkIcon')
    ).toBeTruthy();
    expect(
      elementTree.root?.querySelectorAll('.SharedKanbanCardMetaIcon')
    ).toHaveLength(2);
    expect(
      elementTree.root
        ?.querySelector('.SharedKanbanCardPrIcon')
        ?.getAttribute('content')
    ).toContain('#5e6ad2');
    expect(
      elementTree.root?.querySelector('.SharedKanbanCardPrText')?.textContent
    ).toBe('#42');

    const source = readFileSync(
      new URL('./KanbanCardCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain(
      "import worktreeSvg from '@synara-central-icons/arrow-split-right.svg?raw';"
    );
    expect(source).toContain(
      "import forkSvg from '@synara-central-icons/fork.svg?raw';"
    );
    expect(source).toContain(
      "import pinFilledSvg from '@synara-central-icons-fill/pin.svg?raw';"
    );
    expect(source).not.toContain(
      '<text className="SharedKanbanCardMetaIcon">W</text>'
    );
    expect(source).not.toContain(
      '<text className="SharedKanbanCardMetaIcon">⑂</text>'
    );
    expect(source).not.toContain(
      '<text className="SharedKanbanCardMetaIcon">＋</text>'
    );
  });

  it('keeps every compact metadata icon at the Web 12px role', () => {
    const styles = readFileSync(
      new URL('./kanban-card-composition-elements.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardPin\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardMetaIcon,\s*\.SharedKanbanCardForkIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCardPrIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
  });

  it('uses the Electron fallback instead of inventing Codex for an unknown provider', () => {
    render(<KanbanCardProviderElement provider={null} />);

    expect(
      elementTree.root?.querySelector('.SharedKanbanCardProviderFallback')
    ).toBeTruthy();
    expect(
      elementTree.root?.querySelector('.SharedKanbanCardProvider')
    ).toBeFalsy();
  });

  it('matches raised-surface and interaction chrome semantics', () => {
    const styles = readFileSync(
      new URL('./kanban-card-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.SharedKanbanCard\s*\{[^}]*border-color:\s*rgba\(255, 255, 255, 0\.05\);[^}]*box-shadow:\s*0 6px 24px -10px rgba\(0, 0, 0, 0\.3\);/s
    );
    expect(styles).toMatch(
      /\.SharedKanbanCard\.ui-hover\s*\{[^}]*background-color:\s*var\(--card\);/s
    );
    expect(styles).not.toMatch(
      /\.SharedKanbanCard\.ui-hover\s*\{[^}]*border-color:\s*var\(--ring\);/s
    );
    expect(styles).toContain('.SharedKanbanCardActions.ui-hover');
  });

  it('reuses the canonical status icon instead of a substitute dot', () => {
    const source = readFileSync(
      new URL('./KanbanCardCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('<KanbanStatusIcon');
    expect(source).toContain('className="SharedKanbanCardColumnIcon"');
    expect(source).toContain(
      "import terminalSvg from '@synara-central-icons/console.svg?raw';"
    );
    expect(source).not.toContain('SharedKanbanCardColumnDot');
  });
});
