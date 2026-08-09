# Settings Release History feature rhythm

Status: retained current-head Web/Lynx-for-Web paired evidence.

## Harness

- Current HEAD base: `d596be2b`.
- Shared isolated server: `ws://127.0.0.1:58155`.
- Shared trusted Web origin: `http://localhost:8998`.
- Server instance: `6fab3043-a4ba-498c-8fb4-1b06e6ab2140`.
- Snapshot sequence: `219` for Web, Lynx-for-Web, and Native trust-path probes.
- Lynx host: `http://localhost:8998/lynx/index.html?route=/settings`.
- Served and local Lynx-for-Web bundle SHA-256:
  `c9d377c8d0a7d1a640978cfd7a3eb6e6af728872a12bf28b79f7b9b0a75da105`.
- Viewport: `1280x820`, DPR 1, light, comfortable.
- Both PNGs are exactly `1280x820`.
- One named browser session was used sequentially and then closed.

## Residual

The Release History dialog and row header were already exact:

- dialog: `384,96.796875,512x626.390625`;
- first trigger: `401,161.796875,478x44`;
- expanded content origin: `401,205.796875`.

The expanded first release was 20px taller in Lynx:

- Web: `941.75px`;
- Lynx: `961.75px`.

All five feature sections were exactly 4px taller. Lynx placed title,
description, and details in one outer `8px` stack. Web groups title and
description at `4px`, then uses the outer `8px` gap before details.

## Fix

`SettingsAdvancedReleaseFeatureCopy` now owns the title-description `4px`
gap. `SettingsAdvancedReleaseFeature` retains its existing `8px` gap to the
details text. Typography, dialog dimensions, 24px inter-feature spacing,
disclosure timing, and changelog data are unchanged.

## Result

Web and Lynx-for-Web now match exactly:

- expanded content: `478x941.75`;
- feature 1: `450x199.75`;
- features 2-5: `450x157.5`;
- feature origins:
  `205.796875`, `429.546875`, `611.046875`, `792.546875`, `974.046875`;
- title-description gap: `4px` for all five features.

Real rendered controls opened Settings Advanced and Release History. A real
release-row tap changed the accessibility value to `Collapsed`; the feature
content remained mounted with `LynxDisclosureExit` at 120ms and was removed
after the 220ms transition plus cleanup buffer.

Fresh-console and page-error files are empty for both clients.

## Verification

- Focused Settings Advanced Rstest: 3/3 passed.
- Lynx-for-Web production build passed.
- Native/Desktop production build passed with only existing encoder and
  optional `ws` warnings.
- Three-client connection preflight passed after rebuild.
- React Doctor 0.9.11 against `d596be2b`: zero new diagnostics.
- `git diff --check` passed.
