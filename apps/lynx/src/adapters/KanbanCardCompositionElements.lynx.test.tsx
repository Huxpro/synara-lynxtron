import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  KanbanCardAttachmentElement,
  KanbanCardForkElement,
  KanbanCardPinElement,
  KanbanCardPullRequestElement,
  KanbanCardWorktreeElement,
} from './KanbanCardCompositionElements.lynx';

describe('Kanban card metadata icon fidelity', () => {
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
});
