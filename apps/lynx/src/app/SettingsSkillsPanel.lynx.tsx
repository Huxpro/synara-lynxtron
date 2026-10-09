import { useRef, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type { ServerSettingsView } from "@synara/contracts";

import { SettingsSection } from "@synara-web/components/settings/SettingsSection";
import {
  providerDiscoveryQueryKeys,
  skillsCatalogQueryOptions,
} from "@synara-web/lib/providerDiscoveryReactQuery";
import { serverQueryKeys, serverSettingsQueryOptions } from "@synara-web/lib/serverReactQuery";

import { SettingsGeneralBooleanControlElement } from "../adapters/SettingsGeneralCompositionElements.lynx";
import { OpenAIProviderIcon, hasLynxProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import {
  buildSettingsSkillGroups,
  buildSettingsSkillSections,
  settingsSkillNameKey,
} from "./settingsSkills.logic";
import {
  EMPTY_SKILL_TOGGLE_QUEUE_STATE,
  createSkillToggleQueue,
  projectDisabledSkillNames,
  type SkillToggleQueue,
  type SkillToggleQueueState,
} from "./settingsSkillToggleQueue.logic";
import { queryClient } from "./queries";
import { writeServerSettings } from "./settingsServerData.lynx";

import "./settings-skills-panel.css";

function SkillProviderStack(props: { readonly providers: readonly string[] }) {
  if (props.providers.length === 0) return null;
  return (
    <view className="SettingsSkillsProviderStack">
      {props.providers.map((provider, index) => (
        <view
          className="SettingsSkillsProviderBadge"
          key={provider}
          style={{ marginLeft: index === 0 ? "0px" : "-4px" }}
        >
          {hasLynxProviderIcon(provider) ? (
            <OpenAIProviderIcon provider={provider} />
          ) : (
            <text className="SettingsSkillsProviderFallback">
              {provider.slice(0, 1).toUpperCase()}
            </text>
          )}
        </view>
      ))}
    </view>
  );
}

export function SettingsSkillsPanel() {
  const catalogQuery = useQuery(skillsCatalogQueryOptions());
  const settingsQuery = useQuery(serverSettingsQueryOptions());
  const [queueState, setQueueState] = useState<SkillToggleQueueState>(
    EMPTY_SKILL_TOGGLE_QUEUE_STATE,
  );
  const queueRef = useRef<SkillToggleQueue | null>(null);
  const { savingSkillKey, error: saveError } = queueState;

  // Confirmed server state with this panel's unconfirmed toggles on top, so a
  // confirmation arriving for an earlier toggle cannot undo a later one.
  const disabledNames = projectDisabledSkillNames(
    settingsQuery.data?.skills.disabled ?? [],
    queueState.intents,
  );
  const disabledKeys = new Set(disabledNames.map(settingsSkillNameKey));
  const groups = buildSettingsSkillGroups(catalogQuery.data?.skills ?? []);
  const sections = buildSettingsSkillSections(catalogQuery.data?.skills ?? []);
  const enabledCount = groups.filter((group) => !disabledKeys.has(group.key)).length;

  async function setSkillEnabled(skillName: string, enabled: boolean) {
    "background only";
    queueRef.current ??= createSkillToggleQueue({
      readConfirmed: () =>
        queryClient.getQueryData<ServerSettingsView>(serverQueryKeys.settings())?.skills.disabled ??
        [],
      write: (disabled) =>
        writeServerSettings(queryClient, { skills: { disabled: [...disabled] } }),
      onState: setQueueState,
      // Composer skill pickers are served filtered by these toggles.
      afterSaved: () => queryClient.invalidateQueries({ queryKey: providerDiscoveryQueryKeys.all }),
    });
    await queueRef.current.toggle(skillName, enabled);
  }

  if (catalogQuery.isPending || settingsQuery.isPending) {
    return (
      <view className="SettingsSkillsState">
        <text className="SettingsSkillsStateText">Scanning skills…</text>
      </view>
    );
  }

  if (catalogQuery.isError || settingsQuery.isError) {
    const error = catalogQuery.error ?? settingsQuery.error;
    return (
      <view
        className="SettingsSkillsState SettingsSkillsState--error"
        accessibility-element
        accessibility-role="alert"
      >
        <text className="SettingsSkillsStateText">
          {error instanceof Error ? error.message : "Synara could not scan the skill folders."}
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsSkillsPanel">
      <SettingsSection title="Portable skills">
        <view className="SettingsSkillsPortableRow">
          <view className="SettingsSkillsMain SettingsSkillsMain--portable">
            <view className="SettingsSkillsRowCopy">
              <view className="SettingsSkillsPortableTitleLine">
                <text className="SettingsSkillsRowTitle">Synara skills folder</text>
              </view>
              <text className="SettingsSkillsRowDescription">
                Skills placed here are available on every provider. When a provider already ships
                its own copy of a skill, that copy is used; otherwise Synara&apos;s copy is the
                fallback.
              </text>
            </view>
            <text className="SettingsSkillsCount">
              {enabledCount} of {groups.length} {groups.length === 1 ? "skill" : "skills"} enabled
            </text>
          </view>
          {catalogQuery.data?.synaraSkillsDir ? (
            <view className="SettingsSkillsMetadata SettingsSkillsMetadata--portable">
              <text className="SettingsSkillsPath">{catalogQuery.data.synaraSkillsDir}</text>
            </view>
          ) : null}
        </view>
      </SettingsSection>

      {saveError ? (
        <view className="SettingsSkillsSaveError" accessibility-element accessibility-role="alert">
          <text className="SettingsSkillsSaveErrorText">{saveError}</text>
        </view>
      ) : null}

      {groups.length === 0 ? (
        <SettingsSection title="Skills">
          <view
            className="SettingsSkillsEmptyRow"
            accessibility-element
            accessibility-label="No skills found. Add a skill folder containing a SKILL.md to the Synara skills folder above, or install skills for any supported provider."
            accessibility-trait="text"
          >
            <text className="SettingsSkillsRowTitle">No skills found</text>
            <text className="SettingsSkillsRowDescription">
              Add a skill folder containing a SKILL.md to the Synara skills folder above, or install
              skills for any supported provider.
            </text>
          </view>
        </SettingsSection>
      ) : null}

      {sections.map((section) => (
        <SettingsSection key={section.key} title={section.title}>
          {section.groups.map((group, index) => {
            const enabled = !disabledKeys.has(group.key);
            return (
              <view
                key={group.key}
                className={`SettingsSkillsRow${
                  index < section.groups.length - 1 ? " SettingsSkillsRow--continued" : ""
                }`}
              >
                <view className="SettingsSkillsMain SettingsSkillsMain--skill">
                  <view className="SettingsSkillsRowCopy">
                    <view className="SettingsSkillsTitleLine">
                      <view className="SettingsSkillsCube">
                        <view className="SettingsSkillsCubeFace" />
                      </view>
                      <text className="SettingsSkillsRowTitle">{group.displayName}</text>
                    </view>
                    <text className="SettingsSkillsRowDescription">{group.description}</text>
                  </view>
                  <view className="SettingsSkillsControl SettingsSkillsControl--skill">
                    <SettingsGeneralBooleanControlElement
                      checked={enabled}
                      ariaLabel={`Enable the ${group.displayName} skill`}
                      onChange={(checked) => void setSkillEnabled(group.primarySkill.name, checked)}
                    />
                    {savingSkillKey === group.key ? (
                      <text className="SettingsSkillsSaving">Saving…</text>
                    ) : null}
                  </view>
                </view>
                <view className="SettingsSkillsMetadata">
                  <view className="SettingsSkillsSourceLine">
                    <SkillProviderStack providers={group.providers} />
                    <text className="SettingsSkillsSource">
                      {group.sources.map((source) => source.label).join(" · ")}
                    </text>
                  </view>
                  {group.sources.map((source) => (
                    <text key={source.skill.path} className="SettingsSkillsPath">
                      {source.skill.path}
                    </text>
                  ))}
                </view>
              </view>
            );
          })}
        </SettingsSection>
      ))}
    </view>
  );
}
