import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';
import { createAllThreadsMessagelessSelector } from '@synara-web/storeSelectors';
import { useStore } from '@synara-web/store';

import { Button } from '../components/ui/button';
import { ChevronRightIcon } from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import {
  fetchServerConfig,
  openPathInEditor,
  repairSynaraState,
} from '../data/synaraClient.lynx';
import { dialogs } from '../platform/dialogs';
import { fetchSidebarSnapshot, queryClient } from './queries';
import {
  advancedAppVersion,
  firstAvailableEditor,
  shouldOfferRecoveryTools,
} from './settingsAdvanced.logic';

import './settings-advanced-panel.css';

export function SettingsAdvancedPanel() {
  const configQuery = useQuery({
    queryKey: ['server-config'],
    queryFn: () => {
      'background only';
      return fetchServerConfig();
    },
  });
  const snapshotQuery = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: () => {
      'background only';
      return fetchSidebarSnapshot();
    },
  });
  const allThreadsMessageless = useStore(
    createAllThreadsMessagelessSelector()
  );
  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const [openingFile, setOpeningFile] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [showRecoveryTools, setShowRecoveryTools] = useState(false);
  const [notice, setNotice] = useState<{
    readonly intent: 'success' | 'error';
    readonly message: string;
  } | null>(null);

  const editor = firstAvailableEditor(
    configQuery.data?.availableEditors ?? []
  );
  const recoveryAvailable = shouldOfferRecoveryTools({
    projectCount: snapshotQuery.data?.projects.length ?? 0,
    threadCount: snapshotQuery.data?.workspaceThreads.length ?? 0,
    threadsHydrated,
    allThreadsMessageless,
  });
  const recoveryDetailsPresent = useLynxDisclosurePresence(
    recoveryAvailable && showRecoveryTools
  );
  const recoveryDisclosure = useLynxInteractiveState({
    baseClassName: 'SettingsAdvancedRecoveryTrigger',
    accessibleLabel: 'What this does',
    accessibilityValue: showRecoveryTools ? 'Expanded' : 'Collapsed',
    onActivate: () => setShowRecoveryTools((current) => !current),
  });

  async function openKeybindings() {
    'background only';
    const path = configQuery.data?.keybindingsConfigPath;
    if (!path || !editor || openingFile) return;
    setOpeningFile(true);
    setNotice(null);
    try {
      await openPathInEditor({ cwd: path, editor });
    } catch (error) {
      setNotice({
        intent: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to open keybindings file.',
      });
    } finally {
      setOpeningFile(false);
    }
  }

  async function repairState() {
    'background only';
    if (!recoveryAvailable || repairing) return;
    const confirmed = await dialogs.confirm(
      [
        'Repair local state?',
        'This rebuilds local project indexes and refreshes project snapshots.',
        'It keeps existing chats in place, but it may take a moment.',
      ].join('\n')
    );
    if (!confirmed) return;
    setRepairing(true);
    setNotice(null);
    try {
      await repairSynaraState();
      await queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] });
      setNotice({
        intent: 'success',
        message: 'Project indexes were rebuilt without clearing existing chats.',
      });
    } catch (error) {
      setNotice({
        intent: 'error',
        message: error instanceof Error ? error.message : 'Unable to repair local state.',
      });
    } finally {
      setRepairing(false);
    }
  }

  if (configQuery.isPending || snapshotQuery.isPending) {
    return (
      <view className="SettingsAdvancedState">
        <text className="SettingsAdvancedStateText">
          Loading advanced settings…
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsAdvancedPanel">
      {notice ? (
        <view
          className={`SettingsAdvancedNotice SettingsAdvancedNotice--${notice.intent}`}
        >
          <text className="SettingsAdvancedNoticeText">{notice.message}</text>
        </view>
      ) : null}

      <SettingsSection title="Developer tools">
        <view className="SettingsAdvancedRow SettingsAdvancedRow--keybindings">
          <view className="SettingsAdvancedMain">
            <view className="SettingsAdvancedRowCopy">
              <view className="SettingsAdvancedTitleLine">
                <text className="SettingsAdvancedRowTitle">Keybindings</text>
              </view>
              <text className="SettingsAdvancedRowDescription">
                Open the persisted `keybindings.json` file to edit advanced
                bindings directly.
              </text>
            </view>
            <Button
              size="xs"
              variant="outline"
              className="SettingsAdvancedAction"
              disabled={
                !configQuery.data?.keybindingsConfigPath ||
                !editor ||
                openingFile
              }
              aria-label="Open keybindings file"
              onClick={() => void openKeybindings()}
            >
              {openingFile ? 'Opening…' : 'Open file'}
            </Button>
          </view>
          <view className="SettingsAdvancedMetadata">
            <text className="SettingsAdvancedPath">
              {configQuery.data?.keybindingsConfigPath ??
                'Resolving keybindings path…'}
            </text>
            <text className="SettingsAdvancedMetadataText">
              {editor
                ? 'Opens in your preferred editor.'
                : 'No available editors found.'}
            </text>
          </view>
        </view>

        <view className="SettingsAdvancedRow">
          <view className="SettingsAdvancedMain">
            <view className="SettingsAdvancedRowCopy">
              <view className="SettingsAdvancedTitleLine">
                <text className="SettingsAdvancedRowTitle">Recovery tools</text>
              </view>
              <text className="SettingsAdvancedRowDescription">
                Rebuild local project indexes without clearing existing chats
                when the local state gets out of sync.
              </text>
            </view>
            <Button
              size="xs"
              variant="outline"
              className="SettingsAdvancedAction"
              disabled={!recoveryAvailable || repairing}
              aria-label="Repair local state"
              onClick={() => void repairState()}
            >
              {repairing ? 'Repairing…' : 'Repair state'}
            </Button>
          </view>
          <view className="SettingsAdvancedMetadata">
            <text className="SettingsAdvancedMetadataText">
              {recoveryAvailable
                ? 'Visible because projects exist but no chat history is currently available.'
                : 'Shown automatically only when recovery actions are relevant.'}
            </text>
          </view>
          {recoveryAvailable ? (
            <view className="SettingsAdvancedRecoveryDisclosure">
              <view
                className={recoveryDisclosure.className}
                aria-expanded={showRecoveryTools}
                {...recoveryDisclosure.eventProps}
              >
                <text className="SettingsAdvancedRecoveryTitle">
                  What this does
                </text>
                <ChevronRightIcon
                  className={disclosureChevronClassName(
                    showRecoveryTools,
                    'SettingsAdvancedRecoveryChevron'
                  )}
                  size={16}
                  color="var(--muted-foreground)"
                />
              </view>
              {recoveryDetailsPresent ? (
                <view
                  className={disclosureContentClassName(
                    showRecoveryTools,
                    'SettingsAdvancedRecoveryDetails'
                  )}
                  aria-hidden={!showRecoveryTools}
                >
                  <text className="SettingsAdvancedRecoveryDetailsText">
                    Rebuilds local project indexes and refreshes project
                    snapshots. Existing chats stay in place.
                  </text>
                </view>
              ) : null}
            </view>
          ) : null}
        </view>
      </SettingsSection>

      <SettingsSection title="About">
        <view className="SettingsAdvancedRow">
          <view className="SettingsAdvancedRowCopy">
            <text className="SettingsAdvancedRowTitle">Version</text>
            <text className="SettingsAdvancedRowDescription">
              Current application version.
            </text>
          </view>
          <text className="SettingsAdvancedVersion">
            {advancedAppVersion()}
          </text>
        </view>
      </SettingsSection>
    </view>
  );
}
