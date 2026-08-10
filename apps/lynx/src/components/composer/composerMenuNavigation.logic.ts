import type { ComposerCommandItem } from '@synara-web/components/chat/ComposerCommandMenuComposition';

export function resolveComposerMenuActiveItemId(input: {
  readonly activeItemId: string | null;
  readonly items: ReadonlyArray<ComposerCommandItem>;
}): string | null {
  if (input.items.length === 0) return null;
  if (
    input.activeItemId &&
    input.items.some((item) => item.id === input.activeItemId)
  ) {
    return input.activeItemId;
  }
  return input.items[0]?.id ?? null;
}

export function nudgeComposerMenuActiveItemId(input: {
  readonly activeItemId: string | null;
  readonly direction: 'next' | 'previous';
  readonly items: ReadonlyArray<ComposerCommandItem>;
}): string | null {
  if (input.items.length === 0) return null;
  const activeIndex = input.items.findIndex(
    (item) => item.id === input.activeItemId
  );
  const normalizedIndex =
    activeIndex >= 0 ? activeIndex : input.direction === 'next' ? -1 : 0;
  const offset = input.direction === 'next' ? 1 : -1;
  const nextIndex =
    (normalizedIndex + offset + input.items.length) % input.items.length;
  return input.items[nextIndex]?.id ?? null;
}

export function findComposerMenuActiveItem(input: {
  readonly activeItemId: string | null;
  readonly items: ReadonlyArray<ComposerCommandItem>;
}): ComposerCommandItem | null {
  const activeItemId = resolveComposerMenuActiveItemId(input);
  return input.items.find((item) => item.id === activeItemId) ?? null;
}
