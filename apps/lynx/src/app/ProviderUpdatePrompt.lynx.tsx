import { useEffect, useMemo, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { PROVIDER_DISPLAY_NAMES } from "@synara/contracts";
import {
  getVisibleProviderUpdateStatuses,
  providerUpdateOutcomeCopy,
  providerUpdateNotificationKey,
  PROVIDER_UPDATE_INITIAL_REFRESH_DELAY_MS,
  PROVIDER_UPDATE_REFRESH_INTERVAL_MS,
  runProviderUpdateBatch,
} from "@synara-web/providerUpdates";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsProviderPickerProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import {
  serverConfigQueryOptions,
  serverQueryKeys,
  serverSettingsQueryOptions,
} from "@synara-web/lib/serverReactQuery";

import { Button } from "../components/ui/button";
import { IconButton } from "../components/ui/icon-button.lynx";
import { CircleAlertIcon, TriangleAlertIcon, XIcon } from "../lib/icons.lynx";
import { webStorage } from "../platform/storage";
import { ensureNativeApi } from "~/nativeApi";
import { queryClient } from "./queries";
import { refreshServerProviderStatuses } from "./settingsServerData.lynx";

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
      description: "One or more provider updates failed. Review provider tools for details.",
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
        : `${input.firstProviderName} and ${additionalCount} more provider${additionalCount === 1 ? "" : "s"} have newer versions available.`,
  };
}

export function ProviderUpdatePromptSurface(props: {
  readonly title: string;
  readonly description: string;
  readonly state: "default" | "multiple" | "updating" | "failure" | "succeeded";
  readonly copyText?: string;
  readonly onCopy?: () => void;
  readonly onDismiss: () => void;
  readonly onReview: () => void;
  readonly onUpdateAll: () => void;
}) {
  const failed = props.state === "failure";
  const updating = props.state === "updating";
  const succeeded = props.state === "succeeded";
  return (
    <view
      className={`ProviderUpdatePrompt${failed ? " ProviderUpdatePrompt--failure" : ""}`}
      accessibility-element
      accessibility-label={`${props.title}. ${props.description}`}
    >
      {failed ? (
        <CircleAlertIcon
          className="ProviderUpdatePromptIcon"
          size={16}
          accessibilityLabel="error"
        />
      ) : (
        <TriangleAlertIcon
          className={`ProviderUpdatePromptIcon${
            updating ? " ProviderUpdatePromptIcon--updating" : ""
          }`}
          size={16}
          accessibilityLabel={updating ? "updating" : "warning"}
        />
      )}
      <view className="ProviderUpdatePromptContent">
        <view className="ProviderUpdatePromptCopy">
          <text className="ProviderUpdatePromptTitle">{props.title}</text>
          <text className="ProviderUpdatePromptDescription">{props.description}</text>
        </view>
        <view className="ProviderUpdatePromptActions">
          {succeeded ? (
            <Button
              className="ProviderUpdatePromptAction"
              size="xs"
              variant="outline"
              onClick={props.onDismiss}
            >
              Done
            </Button>
          ) : updating ? (
            <Button className="ProviderUpdatePromptAction" size="xs" variant="outline" disabled>
              Updating…
            </Button>
          ) : failed ? (
            <>
              {props.copyText ? (
                <Button
                  className="ProviderUpdatePromptAction"
                  size="xs"
                  variant="outline"
                  onClick={props.onCopy}
                >
                  Copy
                </Button>
              ) : null}
              <Button
                className="ProviderUpdatePromptAction"
                size="xs"
                variant="outline"
                onClick={props.onReview}
              >
                Review providers
              </Button>
            </>
          ) : (
            <>
              <Button
                className="ProviderUpdatePromptAction"
                size="xs"
                variant="outline"
                onClick={props.onReview}
              >
                Review updates
              </Button>
              <Button
                className="ProviderUpdatePromptAction"
                size="xs"
                variant="outline"
                onClick={props.onUpdateAll}
              >
                Update all
              </Button>
            </>
          )}
        </view>
      </view>
      <IconButton
        className="ProviderUpdatePromptDismiss"
        label="Dismiss provider updates"
        onClick={props.onDismiss}
      >
        <XIcon size={12} />
      </IconButton>
    </view>
  );
}

export function ProviderUpdatePrompt(props: { readonly onReview: () => void }) {
  // The same queries Settings reads and writes, so a provider update or a
  // settings change made there is reflected here without a second cache.
  const config = useQuery(serverConfigQueryOptions());
  const serverSettings = useQuery(serverSettingsQueryOptions());
  useEffect(() => {
    if (serverSettings.data?.enableProviderUpdateChecks !== true) return;
    let disposed = false;
    const refresh = () => {
      // Upstream's refresh: re-probe, then reconcile into the shared config query.
      if (!disposed) void refreshServerProviderStatuses(queryClient).catch(() => undefined);
    };
    const initialRefreshId = setTimeout(refresh, PROVIDER_UPDATE_INITIAL_REFRESH_DELAY_MS);
    const refreshIntervalId = setInterval(refresh, PROVIDER_UPDATE_REFRESH_INTERVAL_MS);
    return () => {
      disposed = true;
      clearTimeout(initialRefreshId);
      clearInterval(refreshIntervalId);
    };
  }, [serverSettings.data?.enableProviderUpdateChecks]);
  const hiddenProviders = readSettingsProviderPickerProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  ).hiddenProviders;
  const providers = useMemo(
    () =>
      getVisibleProviderUpdateStatuses({
        providers: config.data?.providers ?? [],
        hiddenProviders,
        serverSettings: serverSettings.data,
        oneClickOnly: true,
      }),
    [config.data, hiddenProviders, serverSettings.data],
  );
  const key = providerUpdateNotificationKey(providers);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateOutcome, setUpdateOutcome] = useState<{
    readonly status: "succeeded" | "partially_failed" | "failed";
    readonly copy: {
      readonly title: string;
      readonly description: string;
      readonly copyText?: string;
    };
  } | null>(null);
  useEffect(() => {
    if (updateOutcome?.status !== "succeeded") {
      return;
    }
    const timeoutId = setTimeout(() => setUpdateOutcome(null), 6_000);
    return () => clearTimeout(timeoutId);
  }, [updateOutcome]);

  const activeOutcome = updateOutcome;
  if (!activeOutcome && (!key || providers.length === 0 || dismissedKey === key)) {
    return null;
  }
  const first = providers[0];
  const name = first
    ? first.displayName?.trim() ||
      (PROVIDER_DISPLAY_NAMES as Readonly<Record<string, string>>)[first.provider] ||
      first.provider
    : "";
  const { title, description } =
    activeOutcome?.copy ??
    providerUpdatePromptCopy({
      firstProviderName: name,
      providerCount: providers.length,
      updateFailed: false,
    });
  const copyUpdateCommands = () => {
    "background only";
    const copyText = activeOutcome?.copy.copyText;
    if (!copyText) {
      return;
    }
    void import(/* webpackMode: "eager" */ "../platform/clipboard").then(({ clipboard }) =>
      clipboard.writeText(copyText),
    );
  };

  return (
    <ProviderUpdatePromptSurface
      title={title}
      description={description}
      state={
        activeOutcome?.status === "succeeded"
          ? "succeeded"
          : activeOutcome
            ? "failure"
            : updating
              ? "updating"
              : providers.length > 1
                ? "multiple"
                : "default"
      }
      copyText={activeOutcome?.copy.copyText}
      onCopy={copyUpdateCommands}
      onDismiss={() => {
        setUpdateOutcome(null);
        if (key) setDismissedKey(key);
      }}
      onReview={() => {
        if (key) setDismissedKey(key);
        props.onReview();
      }}
      onUpdateAll={() => {
        if (!key || updating) return;
        setUpdating(true);
        setUpdateOutcome(null);
        void runProviderUpdateBatch({
          providers,
          updateProvider: (provider) => ensureNativeApi().server.updateProvider({ provider }),
        }).then((outcome) => {
          setUpdating(false);
          setUpdateOutcome({
            status: outcome.status,
            copy: providerUpdateOutcomeCopy(outcome),
          });
          void queryClient.invalidateQueries({ queryKey: serverQueryKeys.config() });
        });
      }}
    />
  );
}
