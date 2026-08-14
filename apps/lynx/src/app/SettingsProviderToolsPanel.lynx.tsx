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
  PROVIDER_TOOL_CONFIGS,
  providerToolDescriptionText,
  type ProviderToolConfig,
  type ProviderToolField,
} from '@synara/shared/providerTools';
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
import { openExternalBestEffort } from '../platform/window';
import { queryClient } from './queries';
import {
  isProviderToolDirty,
  providerFieldPatch,
  providerFieldValue,
  providerToolResetPatch,
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
      openExternalBestEffort(props.href);
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
  const storedValue = providerFieldValue(
    props.settings,
    props.field.settingsKey
  );
  const [value, setValue] = useState(storedValue);
  useEffect(() => setValue(storedValue), [storedValue]);
  const configured =
    props.field.kind === 'password' &&
    (props.field.settingsKey === 'kiloServerPassword'
      ? props.settings.providers.kilo.serverPasswordConfigured
      : props.settings.providers.opencode.serverPasswordConfigured);

  return (
    <view className="SettingsProviderToolsField">
      <text className="SettingsProviderToolsFieldLabel">
        {props.field.label}
      </text>
      <Input
        nativeInput
        className="SettingsProviderToolsFieldInput"
        size="sm"
        variant="soft"
        value={value}
        type={props.field.kind === 'password' ? 'password' : 'text'}
        disabled={props.disabled}
        maxLength={4096}
        accessibility-label={props.field.label}
        placeholder={
          configured
            ? 'Configured — enter a replacement or leave blank'
            : props.field.placeholder
        }
        onChange={(event) => setValue(event.target.value)}
        onBlur={(event) => {
          if (event.target.value !== storedValue) {
            props.onCommit(
              providerFieldPatch(props.field.settingsKey, event.target.value)
            );
          }
        }}
      />
      <text className="SettingsProviderToolsFieldDescription">
        {providerToolDescriptionText(props.field.description)}
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
                key={field.settingsKey}
                className="SettingsProviderToolsBooleanField"
              >
                <view className="SettingsProviderToolsBooleanCopy">
                  <text className="SettingsProviderToolsFieldLabel">
                    {field.label}
                  </text>
                  <text className="SettingsProviderToolsFieldDescription">
                    {providerToolDescriptionText(field.description)}
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
                key={field.settingsKey}
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
        <view
          className="SettingsProviderToolsNotice"
          accessibility-element
          accessibility-role="alert"
        >
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
