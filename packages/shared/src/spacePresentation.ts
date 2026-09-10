import { SPACE_ICON_NAMES, type SpaceIconName } from '@synara/contracts';

const SPACE_ICON_LABELS: Readonly<Record<SpaceIconName, string>> = {
  bag: 'Bag',
  home: 'Home',
  'code-brackets': 'Code',
  rocket: 'Rocket',
  'light-bulb': 'Idea',
  'color-palette': 'Palette',
  book: 'Book',
  lab: 'Lab',
  heart: 'Heart',
  star: 'Star',
  globe: 'Globe',
  cloud: 'Cloud',
  hammer: 'Hammer',
  'chart-2': 'Chart',
  gamecontroller: 'Games',
  'camera-1': 'Camera',
  target: 'Target',
  tree: 'Tree',
  school: 'School',
  backpack: 'Backpack',
};

export const SPACE_ICON_OPTIONS: ReadonlyArray<{
  readonly name: SpaceIconName;
  readonly label: string;
}> = SPACE_ICON_NAMES.map((name) => ({ name, label: SPACE_ICON_LABELS[name] }));

export function validateSpaceName(
  name: string,
  existingNames: readonly string[]
): string | null {
  const normalized = name.trim().toLocaleLowerCase();
  if (normalized.length === 0) return 'Enter a space name.';
  if (normalized === 'void') return 'Void is reserved for unassigned projects.';
  if (existingNames.some((existing) => existing.trim().toLocaleLowerCase() === normalized)) {
    return 'A space with this name already exists.';
  }
  return null;
}
