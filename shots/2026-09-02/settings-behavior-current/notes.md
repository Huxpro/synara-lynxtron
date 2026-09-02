# Current Settings Behavior dark recapture

Status: retained matched Electron and Lynx-for-Web evidence for the stable
Settings Behavior surface after removing the Lynx-only hydration success row.

## Identity

- Product commit: `779c9d05c` (`fix(lynx): quiet loaded settings state`).
- Backend: `ws://127.0.0.1:53057/?token=synara-local-desktop-comparison`;
  server instance `bc6b818b-91cf-41a0-9df7-d90d598021f5`.
- Route: Electron `#/settings?section=behavior`; Lynx-for-Web
  `/lynx/index.html?route=%2Fsettings%2Fbehavior`.
- Viewport: dark `1440x900`, DPR 1; both PNGs are exactly `1440x900`.
- Endpoint-pinned Lynx-for-Web bundle SHA-256:
  `d8299f1094d7543568cd931c1a6086264125d2a0d7e8b687aacae6f1bcb8b46f`.
- State: the same five Behavior controls and values, fixed Settings sidebar,
  no AppSnap dialog, and the same three-provider update prompt in both clients.

## Result

- Current RGB MAE: `0.5927520576131687%`.
- Superseded P8-Q2 dark `1440x900` Browser MAE: `2.79470729444041%`.
- Lynx no longer renders the stable-state `Preferences loaded.` row. Saving,
  saved, and error/retry presentations remain covered by focused tests.
- The Lynx relay connected on its first attempt, reached socket state 1,
  reported `/settings/behavior`, and had no transport or RPC error. The retained
  page-error buffer is empty.

## Gates

- `settingsPersistence.logic.test.ts`: 4/4.
- ReactLynx scan of the staged Settings page: zero findings.
- Committed-tree Web/Desktop build: passed.
- Browser entry, retry, and exit gates reached zero sessions and zero owned
  processes.
