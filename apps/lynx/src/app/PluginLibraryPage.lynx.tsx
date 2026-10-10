import { useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type {
  ProviderKind,
  ProviderPluginDescriptor,
  ProviderSkillDescriptor,
} from "@synara/contracts";
import { PROVIDER_DISPLAY_NAMES } from "@synara/contracts";
import {
  normalizeProviderDiscoveryText,
  providerDiscoveryItemGradient,
  providerDiscoveryItemRing,
  providerPluginDiscoveryWarnings,
  resolveProviderDiscoveryStatus,
} from "@synara/shared/providerDiscoveryPresentation";
import {
  providerComposerCapabilitiesQueryOptions,
  providerPluginsQueryOptions,
  providerSkillsQueryOptions,
  supportsPluginDiscovery,
  supportsSkillDiscovery,
} from "@synara-web/lib/providerDiscoveryReactQuery";
import { serverConfigQueryOptions } from "@synara-web/lib/serverReactQuery";
import { DEFAULT_PROVIDER_ORDER } from "@synara-web/providerOrdering";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input.lynx";
import { CheckIcon, ListChecksIcon, PuzzleIcon, SearchIcon } from "../lib/icons.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import "./plugin-library-page.css";
import { PluginLibraryWarning } from "./PluginLibraryWarning.lynx";

type DiscoveryTab = "plugins" | "skills";

function pluginLabel(plugin: ProviderPluginDescriptor): string {
  return plugin.interface?.displayName ?? plugin.name;
}

function pluginDescription(plugin: ProviderPluginDescriptor): string {
  return (
    plugin.interface?.shortDescription ??
    plugin.interface?.longDescription ??
    plugin.interface?.developerName ??
    "Installed Codex plugin"
  );
}

function skillLabel(skill: ProviderSkillDescriptor): string {
  return skill.interface?.displayName ?? skill.name;
}

function skillDescription(skill: ProviderSkillDescriptor): string {
  return skill.interface?.shortDescription ?? skill.description ?? skill.scope ?? skill.path;
}

function DiscoveryRow(props: {
  readonly description: string;
  readonly enabled: boolean;
  readonly label: string;
  readonly brandColor?: string;
  readonly kind?: "plugin" | "skill";
}) {
  const { semanticIconColor } = useTheme();
  const skill = props.kind === "skill";
  return (
    <view className="PluginLibraryRow">
      <view
        className={`PluginLibraryGlyph${skill ? " PluginLibraryGlyph--skill" : ""}`}
        style={{
          backgroundImage: providerDiscoveryItemGradient(props.label, props.brandColor),
          boxShadow: providerDiscoveryItemRing(props.label, props.brandColor),
        }}
      >
        {skill ? (
          <ListChecksIcon size={20} color={semanticIconColor("inverse")} style={{ opacity: 0.8 }} />
        ) : (
          <PuzzleIcon size={20} color={semanticIconColor("inverse")} style={{ opacity: 0.8 }} />
        )}
      </view>
      <view className="PluginLibraryRowCopy">
        <text className="PluginLibraryRowTitle">{props.label}</text>
        <text className="PluginLibraryRowDescription" text-maxline="1">
          {props.description}
        </text>
      </view>
      {props.enabled ? (
        <view className="PluginLibraryInstalled">
          <CheckIcon size={14} color={semanticIconColor("secondary")} />
        </view>
      ) : null}
    </view>
  );
}

export function PluginLibraryPage() {
  const { svgColors } = useTheme();
  const [tab, setTab] = useState<DiscoveryTab>("plugins");
  const [provider, setProvider] = useState<ProviderKind>("codex");
  const [search, setSearch] = useState("");
  // Upstream's discovery queries and keys (`PluginLibrary.tsx`), so this page
  // shares their cache with the composer. The standalone page has no thread or
  // project, which leaves the server's cwd as the discovery root.
  const capabilities = useQuery(providerComposerCapabilitiesQueryOptions(provider));
  const serverConfig = useQuery(serverConfigQueryOptions());
  const discoveryCwd = serverConfig.data?.cwd ?? null;
  const plugins = useQuery({
    ...providerPluginsQueryOptions({ provider, cwd: discoveryCwd }),
    // Wait for the cwd: the key includes it, and asking before it is known
    // would list the plugins twice.
    enabled:
      tab === "plugins" &&
      supportsPluginDiscovery(capabilities.data) &&
      serverConfig.data !== undefined,
    retry: false,
  });
  const skills = useQuery({
    ...providerSkillsQueryOptions({ provider, cwd: discoveryCwd }),
    enabled: tab === "skills" && supportsSkillDiscovery(capabilities.data) && discoveryCwd !== null,
    retry: false,
  });
  const query = normalizeProviderDiscoveryText(search);
  const installedPlugins: Array<{
    readonly marketplace: string;
    readonly plugin: ProviderPluginDescriptor;
  }> = [];
  for (const marketplace of plugins.data?.marketplaces ?? []) {
    const marketplaceName = marketplace.interface?.displayName ?? marketplace.name;
    for (const plugin of marketplace.plugins) {
      if (!plugin.installed) continue;
      if (
        query &&
        !normalizeProviderDiscoveryText(
          `${marketplaceName} ${pluginLabel(plugin)} ${pluginDescription(plugin)}`,
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
        `${skillLabel(skill)} ${skillDescription(skill)} ${skill.path}`,
      ).includes(query)
    ) {
      continue;
    }
    discoveredSkills.push(skill);
  }
  const supported =
    tab === "plugins"
      ? supportsPluginDiscovery(capabilities.data)
      : supportsSkillDiscovery(capabilities.data);
  const active = tab === "plugins" ? plugins : skills;
  const activeError = capabilities.error ?? serverConfig.error ?? active.error;
  // Upstream's options answer with a placeholder (an empty result, or the
  // previous provider's) until the first response; that is still "loading" here.
  const activePending =
    capabilities.isPending ||
    (supported &&
      activeError === null &&
      (serverConfig.isPending || active.isPending || active.isPlaceholderData));
  const status = resolveProviderDiscoveryStatus({
    error: activeError,
    itemCount: tab === "plugins" ? installedPlugins.length : discoveredSkills.length,
    pending: activePending,
    providerLabel: PROVIDER_DISPLAY_NAMES[provider],
    resource: tab,
    supported,
  });
  const pluginWarnings =
    tab === "plugins"
      ? providerPluginDiscoveryWarnings({
          marketplaceLoadErrors: plugins.data?.marketplaceLoadErrors ?? [],
          remoteSyncError: plugins.data?.remoteSyncError ?? null,
        })
      : [];

  return (
    <view className="PluginLibraryPage">
      <view className="PluginLibraryHeader">
        <view className="PluginLibraryTabs">
          <Button
            variant={tab === "plugins" ? "secondary" : "ghost"}
            size="sm"
            className={`PluginLibraryTab${tab === "plugins" ? " PluginLibraryTab--active" : ""}`}
            onClick={() => setTab("plugins")}
          >
            Plugins
          </Button>
          <Button
            variant={tab === "skills" ? "secondary" : "ghost"}
            size="sm"
            className={`PluginLibraryTab${tab === "skills" ? " PluginLibraryTab--active" : ""}`}
            onClick={() => setTab("skills")}
          >
            Skills
          </Button>
        </view>
        <view className="PluginLibraryHeaderSpacer" />
        <scroll-view className="PluginLibraryProviders" scroll-orientation="horizontal">
          <view className="PluginLibraryProviderChoices">
            {DEFAULT_PROVIDER_ORDER.map((candidate) => (
              <Button
                key={candidate}
                variant={provider === candidate ? "secondary" : "ghost"}
                size="sm"
                className={`PluginLibraryProviderChoice${
                  provider === candidate ? " PluginLibraryProviderChoice--active" : ""
                }`}
                onClick={() => {
                  setProvider(candidate);
                  setSearch("");
                }}
              >
                <OpenAIProviderIcon
                  provider={candidate}
                  color={provider === candidate ? svgColors.surface : undefined}
                />
                <text className="PluginLibraryProviderLabel">
                  {PROVIDER_DISPLAY_NAMES[candidate]}
                </text>
              </Button>
            ))}
          </view>
        </scroll-view>
      </view>
      <scroll-view className="PluginLibraryScroller" scroll-orientation="vertical">
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
          {pluginWarnings.length > 0 ? (
            <view className="PluginLibraryWarnings">
              {pluginWarnings.map((warning) => (
                <PluginLibraryWarning key={warning} message={warning} />
              ))}
            </view>
          ) : null}
          {status.kind === "loading" ? (
            <text className="PluginLibraryState">Loading {tab}…</text>
          ) : status.kind === "error" ? (
            <text className="PluginLibraryState PluginLibraryState--error">{status.message}</text>
          ) : status.kind === "unsupported" ? (
            <text className="PluginLibraryState">
              {`${tab === "plugins" ? "Plugins" : "Skills"} are unavailable for ${PROVIDER_DISPLAY_NAMES[provider]}.`}
            </text>
          ) : status.kind === "empty" ? (
            <text className="PluginLibraryState">
              {tab === "plugins" ? "No installed plugins found." : "No skills found."}
            </text>
          ) : (
            <view
              className={`PluginLibraryRows${tab === "skills" ? " PluginLibraryRows--skills" : ""}`}
            >
              {tab === "plugins" ? (
                installedPlugins.map(({ marketplace, plugin }) => (
                  <DiscoveryRow
                    key={`${marketplace}:${plugin.id}`}
                    description={pluginDescription(plugin)}
                    enabled={plugin.enabled}
                    label={pluginLabel(plugin)}
                    brandColor={plugin.interface?.brandColor}
                  />
                ))
              ) : (
                <>
                  <text className="PluginLibrarySectionTitle">Skills</text>
                  <view className="PluginLibrarySkillGrid">
                    {discoveredSkills.map((skill) => (
                      <DiscoveryRow
                        key={skill.path}
                        description={skillDescription(skill)}
                        enabled={skill.enabled}
                        kind="skill"
                        label={skillLabel(skill)}
                      />
                    ))}
                  </view>
                </>
              )}
            </view>
          )}
        </view>
      </scroll-view>
    </view>
  );
}
