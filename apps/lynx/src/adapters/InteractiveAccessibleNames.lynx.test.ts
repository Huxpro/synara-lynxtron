import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}

describe('shared interactive accessible names', () => {
  it('routes Composer names and selected state through the native interaction owner', () => {
    const command = source('./ComposerCommandMenuCompositionElements.lynx.tsx');
    const traits = source(
      './ComposerTraitRadioSectionCompositionElements.lynx.tsx'
    );
    const models = source(
      './ProviderModelOptionGroupListCompositionElements.lynx.tsx'
    );
    const control = source('../components/composer/ComposerModelControl.lynx.tsx');

    expect(command).toContain('accessibleLabel: props.title');
    expect(command).toContain(
      "accessibilityValue: props.active ? 'Selected' : undefined"
    );
    expect(traits).toContain("accessibleLabel: 'Fast mode'");
    expect(traits).toContain(
      "accessibilityValue: props.enabled ? 'On' : 'Off'"
    );
    expect(models).toContain(
      'accessibleLabel: `Select ${props.modelName}`'
    );
    expect(models).toContain(
      "accessibilityValue: props.isFavorite ? 'On' : 'Off'"
    );
    expect(control).toContain(
      'accessibleLabel: `Browse ${props.item.label} models`'
    );
    expect(control).toContain("accessibleLabel: 'Back to providers'");
  });

  it('routes Kanban and pull request names through the native interaction owner', () => {
    const column = source('./KanbanColumnCompositionElements.lynx.tsx');
    const route = source('./KanbanRouteHeaderCompositionElements.lynx.tsx');
    const overview = source('./KanbanOverviewCompositionElements.lynx.tsx');
    const tabs = source('./PullRequestDetailTabsCompositionElements.lynx.tsx');
    const close = source(
      './PullRequestDetailCloseCompositionElements.lynx.tsx'
    );
    const summary = source('./PullRequestSummaryCompositionElements.lynx.tsx');

    expect(column.match(/accessibleLabel: props\.label/g)).toHaveLength(2);
    expect(route).toContain("accessibleLabel: 'Back to Kanban'");
    expect(route).toContain("accessibleLabel: 'New task'");
    expect(overview.match(/accessibleLabel: props\.label/g)).toHaveLength(2);
    expect(tabs).toContain('accessibleLabel: props.label');
    expect(close).toContain('accessibleLabel: props.accessibleLabel');
    expect(summary).toContain(
      "accessibilityValue: open ? 'Expanded' : 'Collapsed'"
    );
  });
});
