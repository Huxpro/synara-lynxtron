export type IndependentTabRowMode = 'expanded' | 'tabs-only';

export type IndependentTabRowPresentation = {
  readonly mode: IndependentTabRowMode;
  readonly showActions: boolean;
  readonly toggleLabel: string;
};

export function resolveIndependentTabRowPresentation(
  collapsed: boolean
): IndependentTabRowPresentation {
  return collapsed
    ? {
        mode: 'tabs-only',
        showActions: false,
        toggleLabel: 'Restore tab actions',
      }
    : {
        mode: 'expanded',
        showActions: true,
        toggleLabel: 'Collapse to tabs only',
      };
}
