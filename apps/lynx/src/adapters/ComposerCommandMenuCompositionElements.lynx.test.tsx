import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { ComposerCommandRowElement } from './ComposerCommandMenuCompositionElements.lynx';

const noop = () => undefined;

describe('native Composer command menu row', () => {
  it('uses semantic SVG icons instead of trigger-character glyphs', () => {
    const items = [
      {
        id: 'slash:plan',
        type: 'slash-command' as const,
        command: 'plan' as const,
        label: '/plan',
        description: 'Switch to plan mode',
        source: 'app' as const,
      },
      {
        id: 'skill:review',
        type: 'skill' as const,
        skill: {
          name: 'review',
          description: 'Review changes',
          path: '/skills/review/SKILL.md',
          scope: 'project' as const,
        },
        label: 'review',
        description: 'Review changes',
      },
      {
        id: 'thread:release',
        type: 'thread' as const,
        threadId: 'release',
        provider: 'codex' as const,
        mention: { name: 'Release prep', path: 'thread://release' },
        label: 'Release prep',
        description: 'Synara',
      },
      {
        id: 'path:agents',
        type: 'path' as const,
        path: '/workspace/AGENTS.md',
        pathKind: 'file' as const,
        label: 'AGENTS.md',
        description: '/workspace',
      },
      {
        id: 'model:gpt',
        type: 'model' as const,
        provider: 'codex' as const,
        model: 'gpt-5' as never,
        label: 'GPT-5',
        description: 'Model',
      },
    ];

    render(
      <>
        {items.map((item) => (
          <ComposerCommandRowElement
            key={item.id}
            item={item}
            title={item.label}
            secondaryText={item.description}
            trailingMeta={null}
            resolvedTheme="dark"
            active={false}
            onHighlight={noop}
            onItemRef={noop}
            onSelect={noop}
          />
        ))}
      </>
    );

    expect(
      elementTree.root?.querySelectorAll('.ComposerCommandIconLynx')
    ).toHaveLength(items.length);
    expect(
      elementTree.root?.querySelector('.ComposerCommandGlyphLynx')
    ).toBeNull();
  });
});
