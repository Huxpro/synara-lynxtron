import { SettingsSection } from '@synara-web/components/settings/SettingsSection';

import './settings-appsnap-panel.css';

export function SettingsAppSnapPanel() {
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
          <text className="SettingsAppSnapUnavailable">
            AppSnap requires the Synara desktop app on macOS. This Lynxtron
            runtime does not expose the screen-capture, permission, or global
            shortcut bridge.
          </text>
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
            <view
              className="SettingsAppSnapDisabledSwitch"
              aria-label="Enable AppSnap"
              aria-checked={false}
              aria-disabled={true}
              accessibility-element={true}
              accessibility-label="Enable AppSnap"
              accessibility-role="switch"
              accessibility-state={{ checked: false, disabled: true }}
              accessibility-value="Off"
            >
              <view className="SettingsAppSnapDisabledSwitchThumb" />
            </view>
          </view>
          <view className="SettingsAppSnapMetadata">
            <text className="SettingsAppSnapStatus">
              Unavailable in this runtime
            </text>
          </view>
        </view>

        <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
          <view className="SettingsAppSnapRowCopy">
            <view className="SettingsAppSnapTitleLine">
              <text className="SettingsAppSnapRowTitle">Shortcut</text>
            </view>
            <text className="SettingsAppSnapRowDescription">
              Shortcut registration requires the desktop host&apos;s global
              shortcut conflict and permission service.
            </text>
          </view>
          <text className="SettingsAppSnapValue">Unavailable</text>
        </view>

        <view className="SettingsAppSnapRow SettingsAppSnapRow--continued">
          <view className="SettingsAppSnapRowCopy">
            <view className="SettingsAppSnapTitleLine">
              <text className="SettingsAppSnapRowTitle">Destination</text>
            </view>
            <text className="SettingsAppSnapRowDescription">
              Snaps join the task you interacted with in the last minute, and
              consecutive snaps stay together. Otherwise Synara opens a fresh
              task with the capture attached.
            </text>
          </view>
          <text className="SettingsAppSnapValue">Automatic</text>
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
          <text className="SettingsAppSnapValue">Unavailable</text>
        </view>
      </SettingsSection>
    </view>
  );
}
