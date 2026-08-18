import { useEffect, useState } from '@lynx-js/react';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsAppSnapProjection,
  writeSettingsAppSnapProjection,
  type SettingsAppSnapValues,
} from '@synara-web/appSettingsStorageProjection.logic';
import type { DesktopAppSnapState } from '@synara/contracts';

import { SettingsGeneralBooleanControlElement } from '../adapters/SettingsGeneralCompositionElements.lynx';
import { Button } from '../components/ui/button';
import { appSnap } from '../platform/appSnap';
import { setPersistedStorageItem, webStorage } from '../platform/storage';
import './settings-appsnap-panel.css';

function appSnapStatus(state: DesktopAppSnapState | null): string {
  if (!state) return 'Checking AppSnap support…';
  if (!state.supported) return state.message ?? 'Unavailable in this runtime';
  if (state.status === 'ready') return 'Listening — press both Option keys to snap';
  if (state.status === 'starting') return 'Starting the capture listener…';
  if (state.status === 'permission-required') {
    return state.message ?? 'Permission setup required';
  }
  if (state.status === 'error') return state.message ?? 'AppSnap could not start';
  return 'Off';
}

async function persistAppSnapSettings(
  values: SettingsAppSnapValues
): Promise<void> {
  'background only';
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsAppSnapProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      values
    )
  );
}

export function SettingsAppSnapPanel() {
  const [settings, setSettings] = useState(() =>
    readSettingsAppSnapProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    )
  );
  const [state, setState] = useState<DesktopAppSnapState | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    'background only';
    let active = true;
    const dispose = appSnap.onState((next) => {
      if (active) setState(next);
    });
    void appSnap
      .getState()
      .then((next) => {
        if (active) setState(next);
      })
      .catch(() => {
        if (active) setState(null);
      });
    return () => {
      active = false;
      dispose();
    };
  }, []);

  function setEnabled(enabled: boolean) {
    'background only';
    if (pending) return;
    setPending(true);
    void (enabled ? appSnap.requestPermissions() : Promise.resolve(state))
      .then(() => appSnap.setEnabled(enabled))
      .then(async (next) => {
        setState(next);
        const accepted =
          !enabled ||
          next.status === 'ready' ||
          next.status === 'starting';
        if (enabled && !accepted) {
          await appSnap.setEnabled(false);
        }
        const nextSettings = {
          ...settings,
          enableAppSnap: accepted && enabled,
          appSnapShortcut: { kind: 'both-option-keys' } as const,
        };
        setSettings(nextSettings);
        await persistAppSnapSettings(nextSettings);
      })
      .finally(() => setPending(false));
  }

  function recheckPermissions() {
    'background only';
    if (pending) return;
    setPending(true);
    void appSnap
      .requestPermissions()
      .then(() => appSnap.setEnabled(settings.enableAppSnap))
      .then(setState)
      .finally(() => setPending(false));
  }

  const supported = state?.supported === true;
  const enabled = supported && settings.enableAppSnap;
  const customShortcut = settings.appSnapShortcut.kind === 'key-chord';

  return (
    <view className="SettingsAppSnapPanel">
      <view className="SettingsAppSnapHero">
        <view className="SettingsAppSnapIcon">
          <view className="SettingsAppSnapIconFrame" />
          <view className="SettingsAppSnapIconCorner" />
        </view>
        <view className="SettingsAppSnapHeroCopy">
          <text className="SettingsAppSnapRowTitle">
            Take an AppSnap to show your agent another app&apos;s window
          </text>
          <text className="SettingsAppSnapRowDescription">
            Press your two-key shortcut while any app is frontmost. Synara
            captures that window as an image, brings itself forward, and
            attaches the snap to a task composer — the capture stays on this
            device until you send the message.
          </text>
          {!supported ? (
            <text className="SettingsAppSnapUnavailable">
              {state?.message ??
                'AppSnap requires the Synara desktop app on macOS.'}
            </text>
          ) : null}
        </view>
      </view>

      <SettingsSection title="Capture">
        <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
          <view className="SettingsAppSnapMain">
            <view className="SettingsAppSnapRowCopy">
              <view className="SettingsAppSnapTitleLine">
                <text className="SettingsAppSnapRowTitle">Enable AppSnap</text>
              </view>
              <text className="SettingsAppSnapRowDescription">
                Run the capture listener in the background while Synara is open.
              </text>
            </view>
            <SettingsGeneralBooleanControlElement
              checked={enabled}
              disabled={!supported || pending}
              ariaLabel="Enable AppSnap"
              onChange={setEnabled}
            />
          </view>
          <view className="SettingsAppSnapMetadata">
            <text className="SettingsAppSnapStatus">
              {appSnapStatus(state)}
            </text>
          </view>
        </view>

        <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
          <view className="SettingsAppSnapRowCopy">
            <view className="SettingsAppSnapTitleLine">
              <text className="SettingsAppSnapRowTitle">Shortcut</text>
            </view>
            <text className="SettingsAppSnapRowDescription">
              Press both physical Option keys together while another app is
              frontmost.
            </text>
          </view>
          <view className="SettingsAppSnapMetadata">
            <text className="SettingsAppSnapValue">Both Option keys</text>
            {customShortcut ? (
              <text className="SettingsAppSnapStatus">
                Custom global chords are not available in this Lynxtron build.
              </text>
            ) : null}
          </view>
        </view>

        <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
          <view className="SettingsAppSnapRowCopy">
            <view className="SettingsAppSnapTitleLine">
              <text className="SettingsAppSnapRowTitle">Destination</text>
            </view>
            <text className="SettingsAppSnapRowDescription">
              Snaps attach to the active thread. If no thread is open, the
              capture stays pending until you open one.
            </text>
          </view>
          <text className="SettingsAppSnapValue">Active thread</text>
        </view>

        <view className="SettingsAppSnapRow">
          <view className="SettingsAppSnapRowCopy">
            <view className="SettingsAppSnapTitleLine">
              <text className="SettingsAppSnapRowTitle">Capture sound</text>
            </view>
            <text className="SettingsAppSnapRowDescription">
              Play a short shutter cue when a window is captured.
            </text>
          </view>
          <text className="SettingsAppSnapValue">Not yet available</text>
        </view>
      </SettingsSection>
      {supported ? (
        <SettingsSection title="macOS permissions">
          <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
            <text className="SettingsAppSnapRowTitle">Input Monitoring</text>
            <text className="SettingsAppSnapValue">
              {state.inputMonitoringPermission}
            </text>
          </view>
          <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
            <text className="SettingsAppSnapRowTitle">Screen Recording</text>
            <text className="SettingsAppSnapValue">
              {state.screenRecordingPermission}
            </text>
          </view>
          <view className="SettingsAppSnapRow">
            <text className="SettingsAppSnapRowDescription">
              Recheck after changing permissions in System Settings.
            </text>
            <Button
              size="xs"
              variant="outline"
              disabled={pending}
              onClick={recheckPermissions}
            >
              Recheck permissions
            </Button>
          </view>
        </SettingsSection>
      ) : null}
    </view>
  );
}
