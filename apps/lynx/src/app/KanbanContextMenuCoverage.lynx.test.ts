import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native Kanban context-menu coverage', () => {
  it('wires the shared card controller into overview and project routes', () => {
    const source = readFileSync(
      new URL('./FeatureListsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source.match(/useNativeKanbanCardActions\(\{/g)).toHaveLength(2);
    expect(
      source.match(/onCardContextMenu=\{cardActions\.openCardContextMenu\}/g)
    ).toHaveLength(2);
    expect(source.match(/\{cardActions\.actionPanels\}/g)).toHaveLength(2);
    expect(source).toContain('cardActions.selectAction,');
    expect(source).toContain('cardActions.startCard,');
  });

  it('keeps menu policy, host transport, mutation dispatch, and focus restoration together', () => {
    const controller = readFileSync(
      new URL('./useNativeKanbanCardActions.lynx.tsx', import.meta.url),
      'utf8'
    );
    const cardAdapter = readFileSync(
      new URL('../adapters/KanbanCardCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(controller).toContain('resolveKanbanCardActions(card, {');
    expect(controller).toContain("'../platform/contextMenu'");
    expect(controller).toContain('await selectAction(card, action)');
    expect(controller).toContain("'../data/synaraClient'");
    expect(cardAdapter).toContain('() => focusLynxNode(rootRef)');
  });
});
