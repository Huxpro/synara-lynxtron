import { useEffect, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';

import { SettingsSection } from '@synara-web/components/settings/SettingsSection';

import { SettingsGeneralBooleanControlElement } from '../adapters/SettingsGeneralCompositionElements.lynx';
import {
  OpenAIProviderIcon,
  hasLynxProviderIcon,
} from '../components/OpenAIProviderIcon.lynx';
import {
  fetchServerSettings,
  fetchSkillsCatalog,
  updateServerSettings,
} from '../data/synaraClient.lynx';
import {
  buildSettingsSkillGroups,
  buildSettingsSkillSections,
  nextDisabledSkillNames,
  settingsSkillNameKey,
} from './settingsSkills.logic';
import { queryClient } from './queries';

import './settings-skills-panel.css';

function SkillProviderStack(props: {
  readonly providers: readonly string[];
}) {
  if (props.providers.length === 0) return null;
  return (
    <view className="SettingsSkillsProviderStack">
      {props.providers.map((provider, index) => (
        <view
          className="SettingsSkillsProviderBadge"
          key={provider}
          style={{ marginLeft: index === 0 ? '0px' : '-4px' }}
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
  const catalogQuery = useQuery({
    queryKey: ['skills-catalog'],
    queryFn: () => {
      'background only';
      return fetchSkillsCatalog();
    },
    staleTime: 30_000,
  });
  const settingsQuery = useQuery({
    queryKey: ['server-settings'],
    queryFn: () => {
      'background only';
      return fetchServerSettings();
    },
  });
  const [disabledNames, setDisabledNames] = useState<readonly string[]>([]);
  const disabledNamesRef = useRef<readonly string[]>([]);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveOperationRef = useRef(0);
  const [savingSkillKey, setSavingSkillKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const next = settingsQuery.data?.skills.disabled;
    if (!next) return;
    disabledNamesRef.current = next;
    setDisabledNames(next);
  }, [settingsQuery.data?.skills.disabled]);

  const disabledKeys = new Set(disabledNames.map(settingsSkillNameKey));
  const groups = buildSettingsSkillGroups(catalogQuery.data?.skills ?? []);
  const sections = buildSettingsSkillSections(catalogQuery.data?.skills ?? []);
  const enabledCount = groups.filter(
    (group) => !disabledKeys.has(group.key)
  ).length;

  async function setSkillEnabled(skillName: string, enabled: boolean) {
    'background only';
    const key = settingsSkillNameKey(skillName);
    const previous = disabledNamesRef.current;
    const next = nextDisabledSkillNames({
      current: previous,
      skillName,
      enabled,
    });
    disabledNamesRef.current = next;
    setDisabledNames(next);
    setSavingSkillKey(key);
    setSaveError(null);
    const operationId = saveOperationRef.current + 1;
    saveOperationRef.current = operationId;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const settings = await updateServerSettings({
            skills: { disabled: [...next] },
          });
          if (saveOperationRef.current === operationId) {
            disabledNamesRef.current = settings.skills.disabled;
            setDisabledNames(settings.skills.disabled);
            setSavingSkillKey(null);
          }
          await queryClient.invalidateQueries({ queryKey: ['provider-skills'] });
        } catch (error) {
          if (saveOperationRef.current === operationId) {
            disabledNamesRef.current = previous;
            setDisabledNames(previous);
            setSavingSkillKey(null);
            setSaveError(
              error instanceof Error
                ? error.message
                : 'Unable to update this skill.'
            );
          }
          await queryClient.invalidateQueries({ queryKey: ['server-settings'] });
        }
      });
    await saveQueueRef.current;
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
      <view className="SettingsSkillsState SettingsSkillsState--error">
        <text className="SettingsSkillsStateText">
          {error instanceof Error
            ? error.message
            : 'Synara could not scan the skill folders.'}
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsSkillsPanel">
      <SettingsSection title="Portable skills">
        <view className="SettingsSkillsPortableRow">
          <view className="SettingsSkillsRowCopy">
            <text className="SettingsSkillsRowTitle">Synara skills folder</text>
            <text className="SettingsSkillsRowDescription">
              Skills placed here are available on every provider. When a
              provider already ships its own copy of a skill, that copy is
              used; otherwise Synara&apos;s copy is the fallback.
            </text>
            {catalogQuery.data?.synaraSkillsDir ? (
              <text className="SettingsSkillsPath">
                {catalogQuery.data.synaraSkillsDir}
              </text>
            ) : null}
          </view>
          <text className="SettingsSkillsCount">
            {enabledCount} of {groups.length}{' '}
            {groups.length === 1 ? 'skill' : 'skills'} enabled
          </text>
        </view>
      </SettingsSection>

      {saveError ? (
        <view className="SettingsSkillsSaveError">
          <text className="SettingsSkillsSaveErrorText">{saveError}</text>
        </view>
      ) : null}

      {groups.length === 0 ? (
        <SettingsSection title="Skills">
          <view className="SettingsSkillsEmptyRow">
            <text className="SettingsSkillsRowTitle">No skills found</text>
            <text className="SettingsSkillsRowDescription">
              Add a skill folder containing a SKILL.md to the Synara skills
              folder above, or install skills for any supported provider.
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
                  index > 0 ? ' SettingsSkillsRow--divided' : ''
                }`}
              >
                <view className="SettingsSkillsRowCopy">
                  <view className="SettingsSkillsTitleLine">
                    <view className="SettingsSkillsCube">
                      <view className="SettingsSkillsCubeFace" />
                    </view>
                    <text className="SettingsSkillsRowTitle">
                      {group.displayName}
                    </text>
                  </view>
                  <text className="SettingsSkillsRowDescription">
                    {group.description}
                  </text>
                  <view className="SettingsSkillsSourceLine">
                    <SkillProviderStack providers={group.providers} />
                    <text className="SettingsSkillsSource">
                      {group.sources
                        .map((source) => source.label)
                        .join(' · ')}
                    </text>
                  </view>
                  {group.sources.map((source) => (
                    <text
                      key={source.skill.path}
                      className="SettingsSkillsPath"
                    >
                      {source.skill.path}
                    </text>
                  ))}
                </view>
                <view className="SettingsSkillsControl">
                  <SettingsGeneralBooleanControlElement
                    checked={enabled}
                    ariaLabel={`Enable the ${group.displayName} skill`}
                    onChange={(checked) =>
                      void setSkillEnabled(group.primarySkill.name, checked)
                    }
                  />
                  {savingSkillKey === group.key ? (
                    <text className="SettingsSkillsSaving">Saving…</text>
                  ) : null}
                </view>
              </view>
            );
          })}
        </SettingsSection>
      ))}
    </view>
  );
}
