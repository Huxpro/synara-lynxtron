# Settings Behavior — Web / Lynx / Native extension

## Scope

- New covered UI: Settings → Behavior
- Canonical shared panel: `SettingsBehaviorPanel`
- Controls:
  - Stream assistant messages
  - Wrap diff lines by default
  - Confirm thread deletion
  - Confirm thread archive
  - Confirm terminal tab close
- Browser representative cells:
  - light `1280×820`
  - dark `1440×900`
- Native representative cell:
  - light outer `1280×820`, DevTool `2560×1576`

This slice does not enter terminal, embedded browser, PDF, voice, P8-Q3,
P8-Q4, or P9-R1.

## Ownership

- Web and Lynx consume the same `SettingsBehaviorPanel` composition and
  `SettingsBehaviorPanel.logic` defaults/equality contract.
- Lynx reuses the existing physical-shared Settings row/section components.
- The Lynx-only leaf maps boolean controls to the established native switch
  anatomy and maps changed-row reset actions to the native Button primitive.

## Persistence

- `enableAssistantStreaming` is server-owned:
  - toggling it Off in Lynx-for-Web;
  - reopening Web Settings → Behavior;
  - Web rendered the switch Off;
  - the value was restored to On from Lynx and Web reflected On.
- The other four values are local canonical app settings:
  - `diffWordWrap` toggled On in Lynx-for-Web;
  - `synara:app-settings:v1` stored the value while preserving all Behavior
    defaults;
  - after a full Lynx-for-Web reload and rendered navigation back to Behavior,
    the switch remained On;
  - it was restored to Off.
- Native used an isolated user-data directory:
  - `diffWordWrap` toggled On and persisted to `kv.json`;
  - the owned Lynxtron process was restarted;
  - exact DevTool DOM showed
    `SharedSettingsGeneralSwitch--on`, `aria-checked="true"`, and
    `accessibility-value="On"`;
  - the setting was restored to Off before cleanup.

## Geometry

Both retained Browser cells produced the same deltas:

| Anchor | Lynx-for-Web delta | Size delta |
|---|---:|---:|
| Behavior title | `x +5px / y +8px` | exact `20px` font |
| Runtime behavior card | `x +5px / y +5.25px` | exact width, `+1px` height |
| Safety confirmations card | `x +5px / y +6.25px` | exact width, `+1px` height |

These values satisfy the existing ≤8px / ≤2px visual contract.

## Gates

- Web focused tests: 1 file / 2 tests.
- Lynx focused tests: 2 files / 12 tests.
- Web production build: 8,933 modules.
- Lynx-for-Web and Desktop production builds passed.
- Reuse audit refreshed and checked:
  - Settings `51.72% → 51.88%`.
- Style audit remained `98.07%`.
- Browser screenshots have exact requested dimensions.
- Browser page-error files are empty.
- Native exact-client error/warning console is empty.
- Owned Browser/server/Lynxtron processes and ports were stopped.
