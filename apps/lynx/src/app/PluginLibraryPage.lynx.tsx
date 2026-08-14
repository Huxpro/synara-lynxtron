import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  ProviderKind,
  ProviderPluginDescriptor,
  ProviderSkillDescriptor,
} from '@synara/contracts';
import { PROVIDER_DISPLAY_NAMES } from '@synara/contracts';
import {
  normalizeProviderDiscoveryText,
  resolveProviderDiscoveryStatus,
} from '@synara/shared/providerDiscoveryPresentation';
import { DEFAULT_PROVIDER_ORDER } from '@synara-web/providerOrdering';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input.lynx';
import { PuzzleIcon, SearchIcon } from '../lib/icons.lynx';
import {
  fetchPluginLibraryCapabilities,
  fetchPluginLibraryPlugins,
  fetchPluginLibrarySkills,
} from './queries';
import './plugin-library-page.css';

type DiscoveryTab = 'plugins' | 'skills';

function pluginLabel(plugin: ProviderPluginDescriptor): string {
  return plugin.interface?.displayName ?? plugin.name;
}

function pluginDescription(plugin: ProviderPluginDescriptor): string {
  return (
    plugin.interface?.shortDescription ??
    plugin.interface?.longDescription ??
    plugin.interface?.developerName ??
    'Installed Codex plugin'
  );
}

function skillLabel(skill: ProviderSkillDescriptor): string {
  return skill.interface?.displayName ?? skill.name;
}

function skillDescription(skill: ProviderSkillDescriptor): string {
  return (
    skill.interface?.shortDescription ??
    skill.description ??
    skill.scope ??
    skill.path
  );
}

function DiscoveryRow(props: {
  readonly description: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly meta: string;
}) {
  return (
    <view className="PluginLibraryRow">
      <view className="PluginLibraryGlyph">
        <PuzzleIcon size={16} color="var(--muted-foreground)" />
      </view>
      <view className="PluginLibraryRowCopy">
        <text className="PluginLibraryRowTitle">{props.label}</text>
        <text className="PluginLibraryRowDescription" maxlines={1}>
          {props.description}
        </text>
      </view>
      <text
        className={`PluginLibraryRowStatus${
          props.enabled ? ' PluginLibraryRowStatus--enabled' : ''
        }`}
      >
        {props.meta}
      </text>
    </view>
  );
}

export function PluginLibraryPage() {
  const [tab, setTab] = useState<DiscoveryTab>('plugins');
  const [provider, setProvider] = useState<ProviderKind>('codex');
  const [search, setSearch] = useState('');
  const capabilities = useQuery({
    queryKey: ['plugin-library', 'capabilities', provider],
    queryFn: () => fetchPluginLibraryCapabilities(provider),
  });
  const plugins = useQuery({
    queryKey: ['plugin-library', 'plugins', provider],
    queryFn: () => fetchPluginLibraryPlugins(provider),
    enabled:
      tab === 'plugins' &&
      capabilities.data?.supportsPluginDiscovery === true,
    retry: false,
  });
  const skills = useQuery({
    queryKey: ['plugin-library', 'skills', provider],
    queryFn: () => fetchPluginLibrarySkills(provider),
    enabled:
      tab === 'skills' &&
      capabilities.data?.supportsSkillDiscovery === true,
    retry: false,
  });
  const query = normalizeProviderDiscoveryText(search);
  const installedPlugins: Array<{
    readonly marketplace: string;
    readonly plugin: ProviderPluginDescriptor;
  }> = [];
  for (const marketplace of plugins.data?.marketplaces ?? []) {
    const marketplaceName =
      marketplace.interface?.displayName ?? marketplace.name;
    for (const plugin of marketplace.plugins) {
      if (!plugin.installed) continue;
      if (
        query &&
        !normalizeProviderDiscoveryText(
          `${marketplaceName} ${pluginLabel(plugin)} ${pluginDescription(plugin)}`
        ).includes(query)
      ) {
        continue;
      }
      installedPlugins.push({ marketplace: marketplaceName, plugin });
    }
  }
  const discoveredSkills: ProviderSkillDescriptor[] = [];
  for (const skill of skills.data?.skills ?? []) {
    if (
      query &&
      !normalizeProviderDiscoveryText(
        `${skillLabel(skill)} ${skillDescription(skill)} ${skill.path}`
      ).includes(query)
    ) {
      continue;
    }
    discoveredSkills.push(skill);
  }
  const activePending =
    capabilities.isPending ||
    (tab === 'plugins' ? plugins.isPending : skills.isPending);
  const activeError =
    capabilities.error ?? (tab === 'plugins' ? plugins.error : skills.error);
  const supported =
    tab === 'plugins'
      ? capabilities.data?.supportsPluginDiscovery === true
      : capabilities.data?.supportsSkillDiscovery === true;
  const status = resolveProviderDiscoveryStatus({
    error: activeError,
    itemCount:
      tab === 'plugins' ? installedPlugins.length : discoveredSkills.length,
    pending: activePending,
    providerLabel: PROVIDER_DISPLAY_NAMES[provider],
    resource: tab,
    supported,
  });

  return (
    <view className="PluginLibraryPage">
      <view className="PluginLibraryHeader">
        <Button
          variant={tab === 'plugins' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTab('plugins')}
        >
          Plugins
        </Button>
        <Button
          variant={tab === 'skills' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setTab('skills')}
        >
          Skills
        </Button>
        <view className="PluginLibraryHeaderSpacer" />
        <scroll-view
          className="PluginLibraryProviders"
          scroll-orientation="horizontal"
        >
          <view className="PluginLibraryProviderChoices">
            {DEFAULT_PROVIDER_ORDER.map((candidate) => (
              <Button
                key={candidate}
                variant={provider === candidate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setProvider(candidate);
                  setSearch('');
                }}
              >
                {PROVIDER_DISPLAY_NAMES[candidate]}
              </Button>
            ))}
          </view>
        </scroll-view>
      </view>
      <scroll-view
        className="PluginLibraryScroller"
        scroll-orientation="vertical"
      >
        <view className="PluginLibraryContent">
          <text className="PluginLibraryTitle">
            Make {PROVIDER_DISPLAY_NAMES[provider]} work your way
          </text>
          <view className="PluginLibrarySearch">
            <SearchIcon size={16} color="var(--muted-foreground)" />
            <Input
              nativeInput
              unstyled
              accessibility-label={`Search ${tab}`}
              placeholder={`Search ${tab}`}
              onInput={(value) => setSearch(value)}
            />
          </view>
          {status.kind === 'loading' ? (
            <text className="PluginLibraryState">Loading {tab}…</text>
          ) : status.kind === 'error' ? (
            <text className="PluginLibraryState PluginLibraryState--error">
              {status.message}
            </text>
          ) : status.kind === 'unsupported' ? (
            <text className="PluginLibraryState">
              {tab === 'plugins' ? 'Plugins' : 'Skills'} are unavailable for
              {PROVIDER_DISPLAY_NAMES[provider]}.
            </text>
          ) : status.kind === 'empty' ? (
            <text className="PluginLibraryState">
              {tab === 'plugins'
                ? 'No installed plugins found.'
                : 'No skills found.'}
            </text>
          ) : (
            <view className="PluginLibraryRows">
              {tab === 'plugins'
                ? installedPlugins.map(({ marketplace, plugin }) => (
                    <DiscoveryRow
                      key={`${marketplace}:${plugin.id}`}
                      description={pluginDescription(plugin)}
                      enabled={plugin.enabled}
                      label={pluginLabel(plugin)}
                      meta={marketplace}
                    />
                  ))
                : discoveredSkills.map((skill) => (
                    <DiscoveryRow
                      key={skill.path}
                      description={skillDescription(skill)}
                      enabled={skill.enabled}
                      label={skillLabel(skill)}
                      meta={skill.scope ?? 'Skill'}
                    />
                  ))}
            </view>
          )}
        </view>
      </scroll-view>
    </view>
  );
}
