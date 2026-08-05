import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from '@lynx-js/react';
import type {
  ProviderKind,
  ServerSettingsPatch,
  ServerSettingsView,
  ServerProviderStatus,
} from '@synara/contracts';
import { DEFAULT_SERVER_SETTINGS_VIEW } from '@synara/contracts';
import { PROVIDER_DESCRIPTOR_BY_KIND } from '@synara/shared/providerMetadata';
import {
  getVisibleProviderUpdateStatuses,
  isProviderUpdateActive,
  shouldOfferProviderUpdateAction,
  shouldShowProviderUpdateStatus,
  withProviderUpdateTimeout,
} from '@synara-web/providerUpdates';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { SettingsGeneralBooleanControlElement } from '../adapters/SettingsGeneralCompositionElements.lynx';
import { SettingsResetIcon } from '../adapters/SettingsResetIcon.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  fetchServerConfig,
  fetchServerSettings,
  updateProvider,
  updateServerSettings,
} from '../data/synaraClient.lynx';
import {
  OpenAIProviderIcon,
  hasLynxProviderIcon,
} from '../components/OpenAIProviderIcon.lynx';
import { ArrowDownToLineIcon, ChevronRightIcon } from '../lib/icons.lynx';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import { platformWindow } from '../platform/window';
import { queryClient } from './queries';
import {
  isProviderToolDirty,
  providerFieldPatch,
  providerFieldValue,
  providerToolResetPatch,
  type ProviderTextFieldId,
  type ProviderToolConfig,
  type ProviderToolField,
} from './settingsProviderTools.logic';

import './settings-provider-tools-panel.css';

function formatProviderVersion(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('v') ? trimmed : `v${trimmed}`;
}

function providerUpdateStatusLabel(
  status: ServerProviderStatus
): string | null {
  const state = status.updateState;
  if (state?.status === 'queued') return 'Update queued';
  if (state?.status === 'running') return 'Updating';
  if (state?.status === 'succeeded') return 'Updated';
  if (state?.status === 'failed') return 'Update failed';
  if (state?.status === 'unchanged') return 'Still outdated';
  const advisory = status.versionAdvisory;
  if (advisory?.status === 'behind_latest' && advisory.latestVersion) {
    const currentVersion = formatProviderVersion(advisory.currentVersion);
    const latestVersion = formatProviderVersion(advisory.latestVersion);
    return currentVersion
      ? `${currentVersion} -> ${latestVersion}`
      : `Latest ${latestVersion}`;
  }
  const currentVersion = formatProviderVersion(status.version);
  return currentVersion ? `Current ${currentVersion}` : null;
}

function providerUpdateFailureMessage(
  status: ServerProviderStatus | undefined
): string | null {
  const state = status?.updateState;
  if (!state || (state.status !== 'failed' && state.status !== 'unchanged')) {
    return null;
  }
  return (
    state.output?.trim() ||
    state.message ||
    'The provider update did not complete.'
  );
}

const PROVIDER_TOOL_CONFIGS: readonly ProviderToolConfig[] = [
  {
    provider: 'codex',
    docs: [
      { label: 'Install', href: 'https://help.openai.com/en/articles/11096431' },
      { label: 'Update', href: 'https://help.openai.com/en/articles/11096431' },
      {
        label: 'Config',
        href: 'https://github.com/openai/codex/blob/main/docs/config.md',
      },
    ],
    fields: [
      {
        kind: 'text',
        id: 'codexBinaryPath',
        label: 'Codex binary path',
        placeholder: 'Codex binary path',
        description: 'Leave blank to use codex from your PATH.',
      },
      {
        kind: 'text',
        id: 'codexHomePath',
        label: 'CODEX_HOME path',
        placeholder: 'CODEX_HOME',
        description: 'Optional custom Codex home and config directory.',
      },
    ],
  },
  {
    provider: 'claudeAgent',
    docs: [
      {
        label: 'Install',
        href: 'https://code.claude.com/docs/en/installation',
      },
      {
        label: 'Update',
        href: 'https://code.claude.com/docs/en/installation#update-claude-code',
      },
      { label: 'Config', href: 'https://code.claude.com/docs/en/settings' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'claudeBinaryPath',
        label: 'Claude binary path',
        placeholder: 'Claude binary path',
        description: 'Leave blank to use claude from your PATH.',
      },
    ],
  },
  {
    provider: 'cursor',
    docs: [
      {
        label: 'Install',
        href: 'https://docs.cursor.com/en/cli/installation',
      },
      {
        label: 'Update',
        href: 'https://docs.cursor.com/en/cli/installation#updates',
      },
      { label: 'Config', href: 'https://docs.cursor.com/en/cli/overview' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'cursorBinaryPath',
        label: 'Cursor binary path',
        placeholder: 'Cursor Agent or Cursor CLI path',
        description:
          'Leave blank to use cursor-agent from your PATH. Cursor editor CLI paths are accepted too.',
      },
      {
        kind: 'text',
        id: 'cursorApiEndpoint',
        label: 'Cursor API endpoint',
        placeholder: 'https://api2.cursor.sh',
        description:
          'Optional Cursor API endpoint override passed to cursor-agent -e.',
      },
    ],
  },
  {
    provider: 'antigravity',
    docs: [
      {
        label: 'Install',
        href: 'https://antigravity.google/docs/cli-using',
      },
      {
        label: 'Reference',
        href: 'https://antigravity.google/docs/cli-reference',
      },
      { label: 'Hooks', href: 'https://antigravity.google/docs/hooks' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'antigravityBinaryPath',
        label: 'Antigravity binary path',
        placeholder: 'Antigravity CLI binary path',
        description: 'Leave blank to use agy from your PATH.',
      },
    ],
  },
  {
    provider: 'grok',
    docs: [
      { label: 'Install', href: 'https://docs.x.ai/build/overview' },
      {
        label: 'Headless',
        href: 'https://docs.x.ai/build/cli/headless-scripting',
      },
      { label: 'Config', href: 'https://docs.x.ai/build/overview' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'grokBinaryPath',
        label: 'Grok binary path',
        placeholder: 'Grok binary path',
        description: 'Leave blank to use grok from your PATH.',
      },
    ],
  },
  {
    provider: 'droid',
    docs: [
      {
        label: 'Quickstart',
        href: 'https://docs.factory.ai/cli/getting-started/quickstart.md',
      },
    ],
    fields: [
      {
        kind: 'text',
        id: 'droidBinaryPath',
        label: 'Droid binary path',
        placeholder: 'droid',
        description: 'Leave blank to use droid from your PATH.',
      },
    ],
  },
  {
    provider: 'kilo',
    docs: [
      { label: 'Install', href: 'https://kilo.ai/docs/cli' },
      { label: 'Update', href: 'https://kilo.ai/docs/cli' },
      { label: 'Config', href: 'https://kilo.ai/docs/cli#configuration' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'kiloBinaryPath',
        label: 'Kilo binary path',
        placeholder: 'Kilo binary path',
        description: 'Leave blank to use kilo from your PATH.',
      },
      {
        kind: 'text',
        id: 'kiloServerUrl',
        label: 'Kilo server URL',
        placeholder: 'http://127.0.0.1:4096',
        description:
          'Optional existing Kilo server URL. Leave blank to spawn a local server.',
      },
      {
        kind: 'password',
        id: 'kiloServerPassword',
        label: 'Kilo server password',
        placeholder: 'Kilo server password',
        description: 'Optional password for an externally managed Kilo server.',
      },
    ],
  },
  {
    provider: 'opencode',
    docs: [
      { label: 'Install', href: 'https://opencode.ai/docs/' },
      { label: 'Update', href: 'https://opencode.ai/docs/cli/' },
      { label: 'Config', href: 'https://opencode.ai/docs/config/' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'openCodeBinaryPath',
        label: 'OpenCode binary path',
        placeholder: 'OpenCode binary path',
        description: 'Leave blank to use opencode from your PATH.',
      },
      {
        kind: 'text',
        id: 'openCodeServerUrl',
        label: 'OpenCode server URL',
        placeholder: 'http://127.0.0.1:4096',
        description:
          'Optional existing OpenCode server URL. Leave blank to spawn a local server.',
      },
      {
        kind: 'password',
        id: 'openCodeServerPassword',
        label: 'OpenCode server password',
        placeholder: 'OpenCode server password',
        description:
          'Optional password for an externally managed OpenCode server.',
      },
      {
        kind: 'boolean',
        id: 'openCodeExperimentalWebSockets',
        label: 'OpenAI response WebSockets',
        description:
          "Use OpenCode's experimental OpenAI response WebSocket transport for managed local servers.",
      },
    ],
  },
  {
    provider: 'pi',
    docs: [
      { label: 'Install', href: 'https://pi.dev/docs/latest' },
      { label: 'Update', href: 'https://pi.dev/docs/latest/settings' },
      { label: 'Config', href: 'https://pi.dev/docs/latest/settings' },
    ],
    fields: [
      {
        kind: 'text',
        id: 'piBinaryPath',
        label: 'Pi binary path',
        placeholder: 'Pi binary path',
        description: 'Leave blank to use pi from your PATH.',
      },
      {
        kind: 'text',
        id: 'piAgentDir',
        label: 'Pi agent directory',
        placeholder: 'Pi agent directory',
        description:
          'Optional custom Pi agent directory for auth, models, skills, and commands.',
      },
    ],
  },
];

function ProviderIdentity(props: { readonly provider: ProviderKind }) {
  const descriptor = PROVIDER_DESCRIPTOR_BY_KIND[props.provider];
  return (
    <view className="SettingsProviderToolsIdentity">
      <view className="SettingsProviderToolsIcon">
        {hasLynxProviderIcon(props.provider) ? (
          <OpenAIProviderIcon provider={props.provider} />
        ) : (
          <text className="SettingsProviderToolsFallback">
            {descriptor.displayName.slice(0, 1)}
          </text>
        )}
      </view>
      <text className="SettingsProviderToolsName">
        {descriptor.displayName}
      </text>
    </view>
  );
}

function ProviderStatusRow(props: {
  readonly status: ServerProviderStatus;
  readonly onUpdate: (provider: ProviderKind) => void;
  readonly updating: boolean;
  readonly divided: boolean;
}) {
  const canUpdate = shouldOfferProviderUpdateAction(props.status);
  return (
    <view
      className={`SettingsProviderToolsListRow${
        props.divided ? ' SettingsProviderToolsListRow--divided' : ''
      }`}
    >
      <view className="SettingsProviderToolsRowCopy">
        <ProviderIdentity provider={props.status.provider} />
        {providerUpdateStatusLabel(props.status) ? (
          <text className="SettingsProviderToolsStatus">
            {providerUpdateStatusLabel(props.status)}
          </text>
        ) : null}
      </view>
      {canUpdate ? (
        <Button
          size="xs"
          variant="outline"
          className="SettingsProviderToolsUpdate"
          disabled={props.updating}
          aria-label={`Update ${PROVIDER_DESCRIPTOR_BY_KIND[props.status.provider].displayName}`}
          onClick={() => props.onUpdate(props.status.provider)}
        >
          <ArrowDownToLineIcon
            className="SettingsProviderToolsUpdateIcon"
            size={12}
            color="var(--foreground)"
          />
          {props.updating ? 'Updating…' : 'Update'}
        </Button>
      ) : (
        <text className="SettingsProviderToolsManual">Manual update</text>
      )}
    </view>
  );
}

function ProviderDocLink(props: {
  readonly label: string;
  readonly href: string;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'SettingsProviderToolsDocLink',
    accessibleLabel: `Open ${props.label} documentation`,
    onActivate: () => {
      'background only';
      void platformWindow.openExternal(props.href);
    },
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SettingsProviderToolsDocLinkText">{props.label}</text>
    </view>
  );
}

function ProviderTextField(props: {
  readonly field: Extract<ProviderToolField, { kind: 'text' | 'password' }>;
  readonly settings: ServerSettingsView;
  readonly disabled: boolean;
  readonly onCommit: (patch: ServerSettingsPatch) => void;
}) {
  const storedValue = providerFieldValue(props.settings, props.field.id);
  const [value, setValue] = useState(storedValue);
  useEffect(() => setValue(storedValue), [storedValue]);
  const configured =
    props.field.kind === 'password' &&
    (props.field.id === 'kiloServerPassword'
      ? props.settings.providers.kilo.serverPasswordConfigured
      : props.settings.providers.opencode.serverPasswordConfigured);

  return (
    <view className="SettingsProviderToolsField">
      <text className="SettingsProviderToolsFieldLabel">
        {props.field.label}
      </text>
      <Input
        className="SettingsProviderToolsFieldInput"
        size="sm"
        variant="soft"
        value={value}
        type={props.field.kind === 'password' ? 'password' : 'text'}
        disabled={props.disabled}
        maxLength={4096}
        placeholder={
          configured
            ? 'Configured — enter a replacement or leave blank'
            : props.field.placeholder
        }
        onChange={(event) => setValue(event.target.value)}
        onBlur={(event) => {
          if (event.target.value !== storedValue) {
            props.onCommit(
              providerFieldPatch(props.field.id, event.target.value)
            );
          }
        }}
      />
      <text className="SettingsProviderToolsFieldDescription">
        {props.field.description}
      </text>
    </view>
  );
}

function ProviderToolRow(props: {
  readonly config: ProviderToolConfig;
  readonly divided: boolean;
  readonly hiddenProviders: readonly ProviderKind[];
  readonly open: boolean;
  readonly settings: ServerSettingsView;
  readonly serverSettingsForUpdates: ServerSettingsView;
  readonly status: ServerProviderStatus | undefined;
  readonly updating: boolean;
  readonly saving: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUpdate: (provider: ProviderKind) => void;
  readonly onSettingsPatch: (patch: ServerSettingsPatch) => void;
}) {
  const present = useLynxDisclosurePresence(props.open);
  const trigger = useLynxInteractiveState({
    baseClassName: 'SettingsProviderToolsDisclosureTrigger',
    accessibleLabel: `${PROVIDER_DESCRIPTOR_BY_KIND[props.config.provider].displayName} provider tools`,
    accessibilityValue: props.open ? 'Expanded' : 'Collapsed',
    onActivate: () => props.onOpenChange(!props.open),
  });
  const dirty = isProviderToolDirty(props.config, props.settings);
  const showUpdateStatus =
    props.status &&
    shouldShowProviderUpdateStatus({
      provider: props.status,
      hiddenProviders: props.hiddenProviders,
      serverSettings: props.serverSettingsForUpdates,
    });
  const showUpdate =
    props.status &&
    shouldOfferProviderUpdateAction(props.status) &&
    (showUpdateStatus ||
      props.status.versionAdvisory?.status === 'unknown');
  const providerStatusLabel = props.status
    ? !props.serverSettingsForUpdates.enableProviderUpdateChecks
      ? formatProviderVersion(props.status.version)
        ? `Current ${formatProviderVersion(props.status.version)}`
        : null
      : props.status.versionAdvisory?.status === 'behind_latest' &&
          !showUpdateStatus
        ? null
        : providerUpdateStatusLabel(props.status)
    : null;

  return (
    <view
      className={`SettingsProviderToolsDisclosure${
        props.divided ? ' SettingsProviderToolsDisclosure--divided' : ''
      }`}
    >
      <view
        className={`SettingsProviderToolsDisclosureMain${
          props.divided
            ? ' SettingsProviderToolsDisclosureMain--divided'
            : ''
        }`}
      >
        <view className={trigger.className} {...trigger.eventProps}>
          <ProviderIdentity provider={props.config.provider} />
          <view className="SettingsProviderToolsDisclosureMeta">
            {dirty ? (
              <text className="SettingsProviderToolsCustom">Custom</text>
            ) : null}
            {providerStatusLabel ? (
              <text className="SettingsProviderToolsStatus">
                {providerStatusLabel}
              </text>
            ) : null}
            <ChevronRightIcon
              className={disclosureChevronClassName(
                props.open,
                'SettingsProviderToolsChevron'
              )}
              size={16}
              color="var(--muted-foreground)"
            />
          </view>
        </view>
        {showUpdate && props.status ? (
          <Button
            size="xs"
            variant="outline"
            disabled={props.updating}
            aria-label={`Update ${PROVIDER_DESCRIPTOR_BY_KIND[props.config.provider].displayName}`}
            onClick={() => props.onUpdate(props.config.provider)}
          >
            <ArrowDownToLineIcon
              className="SettingsProviderToolsUpdateIcon"
              size={12}
              color="var(--foreground)"
            />
            {props.updating ? 'Updating…' : 'Update'}
          </Button>
        ) : null}
      </view>
      {present ? (
        <view
          className={disclosureContentClassName(
            props.open,
            'SettingsProviderToolsDisclosureContent'
          )}
          aria-hidden={!props.open}
        >
          <view className="SettingsProviderToolsDocs">
            {props.config.docs.map((doc) => (
              <ProviderDocLink
                key={`${props.config.provider}-${doc.label}`}
                {...doc}
              />
            ))}
          </view>
          {props.config.fields.map((field) =>
            field.kind === 'boolean' ? (
              <view
                key={field.id}
                className="SettingsProviderToolsBooleanField"
              >
                <view className="SettingsProviderToolsBooleanCopy">
                  <text className="SettingsProviderToolsFieldLabel">
                    {field.label}
                  </text>
                  <text className="SettingsProviderToolsFieldDescription">
                    {field.description}
                  </text>
                </view>
                <SettingsGeneralBooleanControlElement
                  checked={
                    props.settings.providers.opencode.experimentalWebSockets
                  }
                  ariaLabel={field.label}
                  disabled={props.saving}
                  onChange={(experimentalWebSockets) =>
                    props.onSettingsPatch({
                      providers: {
                        opencode: { experimentalWebSockets },
                      },
                    })
                  }
                />
              </view>
            ) : (
              <ProviderTextField
                key={field.id}
                field={field}
                settings={props.settings}
                disabled={props.saving}
                onCommit={props.onSettingsPatch}
              />
            )
          )}
        </view>
      ) : null}
    </view>
  );
}

export function SettingsProviderToolsPanel(props: {
  readonly hiddenProviders: readonly ProviderKind[];
  readonly enableProviderUpdateChecks: boolean;
  readonly defaultEnableProviderUpdateChecks: boolean;
  readonly onEnableProviderUpdateChecksChange: (value: boolean) => void;
  readonly providerPicker: ReactNode;
}) {
  const [openProviders, setOpenProviders] = useState<
    Partial<Record<ProviderKind, boolean>>
  >({});
  const [notice, setNotice] = useState<string | null>(null);
  const configQuery = useQuery({
    queryKey: ['server-config'],
    queryFn: () => {
      'background only';
      return fetchServerConfig();
    },
  });
  const settingsQuery = useQuery({
    queryKey: ['server-settings'],
    queryFn: () => {
      'background only';
      return fetchServerSettings();
    },
  });
  const updateMutation = useMutation({
    mutationFn: (provider: ProviderKind) => {
      'background only';
      return withProviderUpdateTimeout({
        provider,
        request: updateProvider(provider),
      });
    },
    onSuccess: async (result, provider) => {
      const failureMessage = providerUpdateFailureMessage(
        result.providers.find((status) => status.provider === provider)
      );
      if (failureMessage) {
        setNotice(failureMessage);
      } else {
        setNotice(null);
      }
      await queryClient.invalidateQueries({ queryKey: ['server-config'] });
    },
    onError: (error) => {
      setNotice(
        error instanceof Error ? error.message : 'The provider update failed.'
      );
    },
  });
  const settingsMutation = useMutation({
    mutationFn: (patch: ServerSettingsPatch) => {
      'background only';
      return updateServerSettings(patch);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(['server-settings'], settings);
      setNotice(null);
    },
    onError: (error) => {
      setNotice(
        error instanceof Error
          ? error.message
          : 'The provider settings could not be saved.'
      );
    },
  });
  const providers = configQuery.data?.providers ?? [];
  const settings = settingsQuery.data ?? DEFAULT_SERVER_SETTINGS_VIEW;
  const serverSettingsForUpdates = {
    ...settings,
    enableProviderUpdateChecks: props.enableProviderUpdateChecks,
  };
  const outdated = getVisibleProviderUpdateStatuses({
    providers,
    hiddenProviders: props.hiddenProviders,
    serverSettings: serverSettingsForUpdates,
    oneClickOnly: false,
  });
  const updatesStatus = !props.enableProviderUpdateChecks
    ? 'Automatic checks off'
    : outdated.length > 0
      ? `${outdated.length} ${outdated.length === 1 ? 'update' : 'updates'} available`
      : 'No provider updates detected';
  const updatingProvider = updateMutation.isPending
    ? updateMutation.variables
    : undefined;
  const statusByProvider = new Map(
    providers.map((status) => [status.provider, status])
  );
  const providerToolsDirty = PROVIDER_TOOL_CONFIGS.some((config) =>
    isProviderToolDirty(config, settings)
  );

  return (
    <view className="SettingsProviderToolsRoot">
      {notice ? (
        <view className="SettingsProviderToolsNotice">
          <text className="SettingsProviderToolsNoticeText">{notice}</text>
        </view>
      ) : null}
      <SettingsSection title="Updates">
        <view className="SettingsProviderToolsSummaryRow SettingsProviderToolsSummaryRow--continued">
          <view className="SettingsProviderToolsSummaryCopy">
            <view className="SettingsProviderToolsTitleLine">
              <text className="SettingsProviderToolsTitle">
                Automatic CLI update checks
              </text>
              {props.enableProviderUpdateChecks !==
              props.defaultEnableProviderUpdateChecks ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Reset automatic provider update checks to default"
                  onClick={() =>
                    props.onEnableProviderUpdateChecksChange(
                      props.defaultEnableProviderUpdateChecks
                    )
                  }
                >
                  <SettingsResetIcon />
                </Button>
              ) : null}
            </view>
            <text className="SettingsProviderToolsDescription">
              Check Codex, Claude, and other provider CLIs for newer versions in
              the background.
            </text>
          </view>
          <SettingsGeneralBooleanControlElement
            checked={props.enableProviderUpdateChecks}
            ariaLabel="Automatic CLI update checks"
            onChange={props.onEnableProviderUpdateChecksChange}
          />
        </view>
        <view className="SettingsProviderToolsSummaryRow SettingsProviderToolsSummaryRow--updates">
          <view className="SettingsProviderToolsSummaryMain">
            <view className="SettingsProviderToolsSummaryCopy">
              <view className="SettingsProviderToolsTitleLine">
                <text className="SettingsProviderToolsTitle">
                  Provider updates
                </text>
              </view>
              <text className="SettingsProviderToolsDescription">
                Review installed provider tools that Synara can safely update.
              </text>
            </view>
            <text className="SettingsProviderToolsSummaryStatus">
              {updatesStatus}
            </text>
          </view>
          {props.enableProviderUpdateChecks && outdated.length > 0 ? (
            <view className="SettingsProviderToolsList SettingsProviderToolsList--updates">
              {outdated.map((status, index) => (
                <ProviderStatusRow
                  key={status.provider}
                  status={status}
                  divided={index > 0}
                  updating={
                    updatingProvider === status.provider ||
                    isProviderUpdateActive(status)
                  }
                  onUpdate={(provider) => updateMutation.mutate(provider)}
                />
              ))}
            </view>
          ) : null}
        </view>
      </SettingsSection>

      {props.providerPicker}

      <SettingsSection title="Provider tools">
        <view className="SettingsProviderToolsSummaryRow">
          <view className="SettingsProviderToolsSummaryCopy">
            <view className="SettingsProviderToolsTitleLine">
              <text className="SettingsProviderToolsTitle">
                Installed CLIs
              </text>
              {providerToolsDirty ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Reset provider tools to default"
                  disabled={settingsMutation.isPending}
                  onClick={() => {
                    setOpenProviders({});
                    settingsMutation.mutate(providerToolResetPatch());
                  }}
                >
                  <SettingsResetIcon />
                </Button>
              ) : null}
            </view>
            <text className="SettingsProviderToolsDescription">
              Review provider versions and update tools. Open a row only when
              you need binary overrides.
            </text>
          </view>
          <text className="SettingsProviderToolsSummaryStatus">
            {updatesStatus}
          </text>
        </view>
        <view className="SettingsProviderToolsList">
          {PROVIDER_TOOL_CONFIGS.map((config, index) => {
            const status = statusByProvider.get(config.provider);
            return (
              <ProviderToolRow
                key={config.provider}
                config={config}
                divided={index > 0}
                hiddenProviders={props.hiddenProviders}
                open={openProviders[config.provider] === true}
                settings={settings}
                serverSettingsForUpdates={serverSettingsForUpdates}
                status={status}
                saving={settingsMutation.isPending}
                updating={
                  updatingProvider === config.provider ||
                  (status ? isProviderUpdateActive(status) : false)
                }
                onOpenChange={(open) =>
                  setOpenProviders((current) => ({
                    ...current,
                    [config.provider]: open,
                  }))
                }
                onUpdate={(provider) => updateMutation.mutate(provider)}
                onSettingsPatch={(patch) => settingsMutation.mutate(patch)}
              />
            );
          })}
        </view>
      </SettingsSection>
    </view>
  );
}
