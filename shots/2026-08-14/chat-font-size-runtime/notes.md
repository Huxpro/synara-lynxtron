# Chat font size runtime fidelity

## Classification

- Severity: P1 product loss.
- Authority: Web applies `chatFontSizePx` to populated transcript typography and virtualization geometry.
- Previous Lynx behavior: Settings → Appearance persisted `chatFontSizePx`, but the Lynx transcript always called the shared typography helpers with their default argument. The virtual-list estimate was also fixed to one font geometry.
- Scope: every populated Lynx conversation, across themes and viewports.

## Fix

- Promote the complete canonical `SettingsAppearanceValues` projection to the Lynx `App` runtime owner instead of keeping only `uiDensity`.
- Publish hydrated, reset, and edited appearance values from `SettingsPage` through one `onAppearanceChange` callback.
- Pass `appearance.chatFontSizePx` through `SliceRouter` and `ThreadPage` to `Transcript`.
- Apply the value with the existing shared Web helpers:
  - `getChatTranscriptUserMessageTextStyle`
  - `getChatTranscriptTextStyle`
- Scale the Lynx list row estimate with the normalized chat font size so visual typography and virtualization geometry cannot diverge.

## Verification

- `bun run test -- src/app/TranscriptAppearance.lynx.test.ts src/app/transcriptRows.logic.test.ts src/app/settingsNavigation.test.ts`
  - 3 files passed.
  - 27 tests passed.
- `CI=1 bun run build` in `apps/lynx`
  - Lynx bundle built.
  - Desktop host built and staged.
  - Existing optional `bufferutil` / `utf-8-validate` warnings only.

## Runtime harness

- Requested cell: Lynx-for-Web, `1280 × 820`, DPR 1, light.
- Final healthy harness:
  - Web host: `http://localhost:8080/web-host`
  - isolated server: `ws://localhost:56347`
  - viewport and visual viewport: `1280 × 820`
  - DPR: `1`
  - relay socket state: open
  - relay connection attempts: `1`
  - transport and RPC errors after settling: none
  - Lynx shadow tree mounted with `SliceRoot--theme-light`
- The isolated real snapshot contained no projects or populated chat threads. No provider turn or direct SQLite fixture write was used to manufacture one, so no transcript screenshot is retained and Native is not claimed.

## Harness loss ledger

- `harness-loss`: initial relay attempts used a server whose declared dev origin did not match the Lynx-for-Web host. `/ws/bootstrap` was rejected before product rendering. This was fixed by aligning the isolated server offset so its `devUrl` was `http://localhost:8080/`.
- `harness-loss`: ordinary browser snapshots do not pierce the `<lynx-view>` shadow root and incorrectly reported no interactive elements. Shadow-root inspection confirmed the renderer was mounted.
- `missing-coverage`: the final healthy isolated snapshot had no populated transcript, so live 11 px versus 20 px geometry was not captured.
- `product-pass`: focused contract tests and the production bundle prove canonical persisted and live appearance propagation, shared typography consumption, and font-aware row estimation.
- `native-unverified`: no exact-owned Native instance was launched for this slice.
