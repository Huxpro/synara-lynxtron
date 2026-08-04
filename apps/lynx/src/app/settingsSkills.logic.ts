import type {
  ProviderKind,
  ProviderSkillDescriptor,
} from '@synara/contracts';
import { PROVIDER_DISPLAY_NAMES } from '@synara/contracts';

export interface SettingsSkillSource {
  readonly skill: ProviderSkillDescriptor;
  readonly origin: string;
  readonly label: string;
  readonly provider: ProviderKind | null;
}

export interface SettingsSkillGroup {
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly primarySkill: ProviderSkillDescriptor;
  readonly providers: readonly ProviderKind[];
  readonly sources: readonly SettingsSkillSource[];
  readonly section: string;
}

export interface SettingsSkillSection {
  readonly key: string;
  readonly title: string;
  readonly groups: readonly SettingsSkillGroup[];
}

const SHARED_SECTION = 'shared';
const PERSONAL_ORIGIN = 'personal';
const ORIGIN_ORDER = [
  'synara',
  'codex',
  'claude',
  'cursor',
  'antigravity',
  'grok',
  'droid',
  'kilo',
  'opencode',
  'pi',
  'agents',
  'project',
] as const;
const PROVIDER_ORDER: readonly ProviderKind[] = [
  'codex',
  'claudeAgent',
  'cursor',
  'antigravity',
  'grok',
  'droid',
  'kilo',
  'opencode',
  'pi',
];

function compareAscending(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function originRank(origin: string): number {
  const index = (ORIGIN_ORDER as readonly string[]).indexOf(origin);
  return index >= 0 ? index : ORIGIN_ORDER.length;
}

function originInfo(origin: string): {
  readonly label: string;
  readonly provider: ProviderKind | null;
} {
  switch (origin) {
    case 'synara':
      return { label: 'Synara', provider: null };
    case 'codex':
      return { label: PROVIDER_DISPLAY_NAMES.codex, provider: 'codex' };
    case 'claude':
      return {
        label: PROVIDER_DISPLAY_NAMES.claudeAgent,
        provider: 'claudeAgent',
      };
    case 'cursor':
    case 'antigravity':
    case 'grok':
    case 'droid':
    case 'kilo':
    case 'opencode':
    case 'pi':
      return {
        label: PROVIDER_DISPLAY_NAMES[origin],
        provider: origin,
      };
    case 'agents':
      return { label: 'Shared (.agents)', provider: null };
    case 'project':
      return { label: 'Project', provider: null };
    default:
      return { label: origin || 'Personal', provider: null };
  }
}

export function settingsSkillNameKey(name: string): string {
  return name.trim().toLowerCase();
}

function sectionTitle(section: string): string {
  return section === SHARED_SECTION
    ? 'Shared skills'
    : `From ${originInfo(section).label}`;
}

export function buildSettingsSkillGroups(
  skills: readonly ProviderSkillDescriptor[]
): readonly SettingsSkillGroup[] {
  const sourceGroups = new Map<string, SettingsSkillSource[]>();
  for (const skill of skills) {
    const key = settingsSkillNameKey(skill.name);
    const origin = skill.scope ?? PERSONAL_ORIGIN;
    const info = originInfo(origin);
    sourceGroups.set(key, [
      ...(sourceGroups.get(key) ?? []),
      {
        skill,
        origin,
        label: info.label,
        provider: info.provider,
      },
    ]);
  }

  const groups: SettingsSkillGroup[] = [];
  for (const [key, unsortedSources] of sourceGroups) {
    const sources = [...unsortedSources].sort((left, right) => {
      const rank = originRank(left.origin) - originRank(right.origin);
      return rank || compareAscending(left.skill.path, right.skill.path);
    });
    const primarySkill = sources[0]?.skill;
    if (!primarySkill) continue;
    const providers = sources
      .map((source) => source.provider)
      .filter((provider): provider is ProviderKind => provider !== null)
      .filter((provider, index, all) => all.indexOf(provider) === index)
      .sort(
        (left, right) =>
          PROVIDER_ORDER.indexOf(left) - PROVIDER_ORDER.indexOf(right)
      );
    groups.push({
      key,
      displayName: primarySkill.interface?.displayName ?? primarySkill.name,
      description:
        primarySkill.interface?.shortDescription ??
        primarySkill.description ??
        'No description.',
      primarySkill,
      providers,
      sources,
      section:
        sources.length > 1
          ? SHARED_SECTION
          : (sources[0]?.origin ?? PERSONAL_ORIGIN),
    });
  }
  return groups.sort((left, right) =>
    compareAscending(left.displayName, right.displayName)
  );
}

export function buildSettingsSkillSections(
  skills: readonly ProviderSkillDescriptor[]
): readonly SettingsSkillSection[] {
  const sections = new Map<string, SettingsSkillGroup[]>();
  for (const group of buildSettingsSkillGroups(skills)) {
    sections.set(group.section, [
      ...(sections.get(group.section) ?? []),
      group,
    ]);
  }
  return [...sections.entries()]
    .map(([key, groups]) => ({
      key,
      title: sectionTitle(key),
      groups,
    }))
    .sort((left, right) => {
      if (left.key === SHARED_SECTION) return -1;
      if (right.key === SHARED_SECTION) return 1;
      return originRank(left.key) - originRank(right.key);
    });
}

export function nextDisabledSkillNames(input: {
  readonly current: readonly string[];
  readonly skillName: string;
  readonly enabled: boolean;
}): readonly string[] {
  const next = new Set(input.current.map(settingsSkillNameKey));
  const key = settingsSkillNameKey(input.skillName);
  if (input.enabled) next.delete(key);
  else next.add(key);
  return [...next].sort(compareAscending);
}
