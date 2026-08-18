import { useMemo, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import { PROVIDER_DISPLAY_NAMES } from '@synara/contracts';
import {
  getVisibleProviderUpdateStatuses,
  providerUpdateNotificationKey,
  withProviderUpdateTimeout,
} from '@synara-web/providerUpdates';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsProviderPickerProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { Button } from '../components/ui/button';
import { TriangleAlertIcon, XIcon } from '../lib/icons.lynx';
import { webStorage } from '../platform/storage';
import {
  fetchProviderUpdatePromptData,
  queryClient,
  updatePromptProvider,
} from './queries';

export function providerUpdatePromptCopy(input: {
  readonly firstProviderName: string;
  readonly providerCount: number;
  readonly updateFailed: boolean;
}): { readonly title: string; readonly description: string } {
  if (input.updateFailed) {
    return {
      title:
        input.providerCount === 1
          ? `${input.firstProviderName} update available`
          : `${input.providerCount} provider updates available`,
      description:
        'One or more provider updates failed. Review provider tools for details.',
    };
  }
  const additionalCount = input.providerCount - 1;
  return {
    title:
      input.providerCount === 1
        ? `${input.firstProviderName} update available`
        : `${input.providerCount} provider updates available`,
    description:
      input.providerCount === 1
        ? `${input.firstProviderName} has a newer version available.`
        : `${input.firstProviderName} and ${additionalCount} more provider${additionalCount === 1 ? '' : 's'} have newer versions available.`,
  };
}

export function ProviderUpdatePrompt(props: {
  readonly onReview: () => void;
}) {
  const data = useQuery({
    queryKey: ['provider-update-prompt'],
    queryFn: () => {
      'background only';
      return fetchProviderUpdatePromptData();
    },
  });
  const hiddenProviders = readSettingsProviderPickerProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  ).hiddenProviders;
  const providers = useMemo(
    () =>
      getVisibleProviderUpdateStatuses({
        providers: data.data?.config.providers ?? [],
        hiddenProviders,
        serverSettings: data.data?.settings,
        oneClickOnly: true,
      }),
    [data.data, hiddenProviders]
  );
  const key = providerUpdateNotificationKey(providers);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  if (!key || providers.length === 0 || dismissedKey === key) {
    return null;
  }
  const first = providers[0]!;
  const name = PROVIDER_DISPLAY_NAMES[first.provider];
  const { title, description } = providerUpdatePromptCopy({
    firstProviderName: name,
    providerCount: providers.length,
    updateFailed,
  });

  return (
    <view
      className="ProviderUpdatePrompt"
      accessibility-element
      accessibility-label={`${title}. ${description}`}
    >
      <TriangleAlertIcon
        className="ProviderUpdatePromptIcon"
        size={16}
        accessibilityLabel="warning"
      />
      <view className="ProviderUpdatePromptContent">
        <view className="ProviderUpdatePromptCopy">
          <text className="ProviderUpdatePromptTitle">{title}</text>
          <text className="ProviderUpdatePromptDescription">{description}</text>
        </view>
        <view className="ProviderUpdatePromptActions">
          <Button
            className="ProviderUpdatePromptAction"
            size="xs"
            variant="outline"
            onClick={() => {
              setDismissedKey(key);
              props.onReview();
            }}
          >
            Review updates
          </Button>
          <Button
            className="ProviderUpdatePromptAction"
            size="xs"
            variant="outline"
            disabled={updating}
            onClick={() => {
              setUpdating(true);
              setUpdateFailed(false);
              void Promise.allSettled(
                providers.map((provider) =>
                  withProviderUpdateTimeout({
                    provider: provider.provider,
                    request: updatePromptProvider(provider.provider),
                  })
                )
              ).then((results) => {
                setUpdating(false);
                if (results.every((result) => result.status === 'fulfilled')) {
                  setDismissedKey(key);
                } else {
                  setUpdateFailed(true);
                }
                void queryClient.invalidateQueries({
                  queryKey: ['provider-update-prompt'],
                });
                void queryClient.invalidateQueries({
                  queryKey: ['server-config'],
                });
              });
            }}
          >
            {updating ? 'Updating…' : 'Update all'}
          </Button>
        </view>
      </view>
      <Button
        className="ProviderUpdatePromptDismiss"
        size="icon-xs"
        variant="ghost"
        aria-label="Dismiss provider updates"
        onClick={() => setDismissedKey(key)}
      >
        <XIcon size={12} />
      </Button>
    </view>
  );
}
