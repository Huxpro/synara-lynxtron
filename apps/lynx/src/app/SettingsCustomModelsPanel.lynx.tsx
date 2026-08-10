import { useState } from '@lynx-js/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ProviderKind,
  ServerSettingsPatch,
  ServerSettingsView,
} from '@synara/contracts';
import { validateCustomModelInput } from '@synara/shared/customModels';
import { PROVIDER_DESCRIPTOR_BY_KIND } from '@synara/shared/providerMetadata';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu';
import { ChevronDownIcon, PlusIcon, XIcon } from '../lib/icons.lynx';
import {
  fetchServerSettings,
  updateServerSettings,
} from '../data/synaraClient.lynx';
import { SettingsResetIcon } from '../adapters/SettingsResetIcon.lynx';
import { queryClient } from './queries';

import './settings-custom-models-panel.css';

const CUSTOM_MODEL_PROVIDERS = [
  { provider: 'codex', example: 'gpt-6.7-codex-ultra-preview' },
  { provider: 'claudeAgent', example: 'claude-custom-model' },
  { provider: 'cursor', example: 'composer-2' },
  { provider: 'antigravity', example: 'Gemini 4 Pro' },
  { provider: 'grok', example: 'grok-build-0.1' },
  { provider: 'kilo', example: 'kilo/kilo-auto/free' },
  { provider: 'opencode', example: 'openai/gpt-5' },
  { provider: 'pi', example: 'anthropic/claude-sonnet-4-5' },
] as const satisfies readonly {
  readonly provider: ProviderKind;
  readonly example: string;
}[];

type CustomModelProvider = (typeof CUSTOM_MODEL_PROVIDERS)[number]['provider'];

export function customModelsProviderPatch(
  provider: CustomModelProvider,
  customModels: readonly string[]
): ServerSettingsPatch {
  const value = { customModels: [...customModels] };
  switch (provider) {
    case 'codex':
      return { providers: { codex: value } };
    case 'claudeAgent':
      return { providers: { claudeAgent: value } };
    case 'cursor':
      return { providers: { cursor: value } };
    case 'antigravity':
      return { providers: { antigravity: value } };
    case 'grok':
      return { providers: { grok: value } };
    case 'kilo':
      return { providers: { kilo: value } };
    case 'opencode':
      return { providers: { opencode: value } };
    case 'pi':
      return { providers: { pi: value } };
  }
}

export function customModelsForProvider(
  settings: ServerSettingsView,
  provider: CustomModelProvider
): readonly string[] {
  return settings.providers[provider].customModels;
}

export function SettingsCustomModelsPanel(props: {
  readonly onSettingsChange?: (settings: ServerSettingsView) => void;
}) {
  const [provider, setProvider] = useState<CustomModelProvider>('codex');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const settingsQuery = useQuery({
    queryKey: ['server-settings'],
    queryFn: () => {
      'background only';
      return fetchServerSettings();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (patch: ServerSettingsPatch) => {
      'background only';
      return updateServerSettings(patch);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['server-settings'], settings);
      props.onSettingsChange?.(settings);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Unable to update custom models.'
      );
    },
  });
  const settings = settingsQuery.data;
  const providerConfig =
    CUSTOM_MODEL_PROVIDERS.find((entry) => entry.provider === provider) ??
    CUSTOM_MODEL_PROVIDERS[0];
  const rows = settings
    ? CUSTOM_MODEL_PROVIDERS.flatMap((entry) =>
        customModelsForProvider(settings, entry.provider).map((slug) => ({
          provider: entry.provider,
          slug,
        }))
      )
    : [];

  const addModel = () => {
    if (!settings || updateMutation.isPending) return;
    const savedModels = customModelsForProvider(settings, provider);
    const result = validateCustomModelInput({
      provider,
      value: input,
      savedModels,
    });
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setInput('');
    updateMutation.mutate(
      customModelsProviderPatch(provider, [...savedModels, result.model])
    );
  };

  const removeModel = (
    rowProvider: CustomModelProvider,
    slug: string
  ) => {
    if (!settings || updateMutation.isPending) return;
    const next = customModelsForProvider(settings, rowProvider).filter(
      (model) => model !== slug
    );
    setError(null);
    updateMutation.mutate(customModelsProviderPatch(rowProvider, next));
  };

  const resetModels = () => {
    if (!settings || updateMutation.isPending) return;
    const providers = Object.fromEntries(
      CUSTOM_MODEL_PROVIDERS.map((entry) => [
        entry.provider,
        { customModels: [] },
      ])
    ) as NonNullable<ServerSettingsPatch['providers']>;
    setError(null);
    updateMutation.mutate({ providers });
  };

  return (
    <view className="SettingsCustomModelsSection">
      <view className="SettingsCustomModelsSectionTitle">
        <text className="SettingsCustomModelsSectionTitleText">
          Custom models
        </text>
      </view>
      <view className="SettingsCustomModelsCard">
        <view className="SettingsCustomModelsRow">
          <view className="SettingsCustomModelsHeader">
            <view className="SettingsCustomModelsCopy">
              <view className="SettingsCustomModelsTitleLine">
                <text className="SettingsCustomModelsTitle">
                  Saved model slugs
                </text>
                {rows.length > 0 ? (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="Reset custom models to default"
                    onClick={resetModels}
                  >
                    <SettingsResetIcon />
                  </Button>
                ) : null}
              </view>
              <text className="SettingsCustomModelsDescription">
                Add custom model slugs for supported providers.
              </text>
            </view>
          </view>
          <view className="SettingsCustomModelsEditor">
            <view className="SettingsCustomModelsEditorRow">
              <Menu>
              <MenuTrigger ariaLabel="Custom model provider">
                <Button
                  size="sm"
                  variant="outline"
                  className="SettingsCustomModelsProviderTrigger"
                  aria-label="Custom model provider"
                >
                  <text className="SettingsCustomModelsProviderLabel">
                    {PROVIDER_DESCRIPTOR_BY_KIND[provider].displayName}
                  </text>
                  <ChevronDownIcon
                    className="SettingsCustomModelsChevron"
                    size={14}
                    color="var(--muted-foreground)"
                  />
                </Button>
              </MenuTrigger>
              <MenuPopup className="SettingsCustomModelsProviderPopup">
                <MenuRadioGroup
                  value={provider}
                  onValueChange={(value) => {
                    if (
                      CUSTOM_MODEL_PROVIDERS.some(
                        (entry) => entry.provider === value
                      )
                    ) {
                      setProvider(value as CustomModelProvider);
                      setError(null);
                    }
                  }}
                >
                  {CUSTOM_MODEL_PROVIDERS.map((entry) => (
                    <MenuRadioItem
                      key={entry.provider}
                      value={entry.provider}
                    >
                      {PROVIDER_DESCRIPTOR_BY_KIND[entry.provider].displayName}
                    </MenuRadioItem>
                  ))}
                </MenuRadioGroup>
              </MenuPopup>
              </Menu>
              <Input
                nativeInput
                size="sm"
                variant="soft"
                className="SettingsCustomModelsInput"
                value={input}
                placeholder={providerConfig.example}
                accessibility-label="Custom model slug"
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (error) setError(null);
                }}
                confirmType="send"
              onConfirm={addModel}
              />
              <Button
              size="sm"
              variant="outline"
              className="SettingsCustomModelsAdd"
              disabled={!settings || updateMutation.isPending}
              onClick={addModel}
            >
              <PlusIcon size={14} color="var(--foreground)" />
              <text className="LxButton__text">Add</text>
              </Button>
            </view>
            {error ? (
              <text
                className="SettingsCustomModelsError"
                accessibility-element
                accessibility-role="alert"
              >
                {error}
              </text>
            ) : null}
            {settingsQuery.isPending ? (
              <text className="SettingsCustomModelsState">
                Loading custom models…
              </text>
            ) : null}
            {rows.length > 0 ? (
              <view className="SettingsCustomModelsList">
                {rows.map((row, index) => (
                  <view
                  className={`SettingsCustomModelsListRow${
                    index > 0 ? ' SettingsCustomModelsListRow--divided' : ''
                  }`}
                  key={`${row.provider}:${row.slug}`}
                  >
                    <text className="SettingsCustomModelsRowProvider">
                      {PROVIDER_DESCRIPTOR_BY_KIND[row.provider].displayName}
                    </text>
                    <text className="SettingsCustomModelsRowSlug">
                      {row.slug}
                    </text>
                    <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Remove ${row.slug}`}
                    onClick={() => removeModel(row.provider, row.slug)}
                    >
                      <XIcon size={14} color="var(--muted-foreground)" />
                    </Button>
                  </view>
                ))}
              </view>
            ) : null}
          </view>
        </view>
      </view>
    </view>
  );
}
