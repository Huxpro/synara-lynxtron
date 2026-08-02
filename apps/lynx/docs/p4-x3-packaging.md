# P4-X3 macOS packaging

Date: 2026-07-27

## P8-Q3 regression rerun — 2026-08-01

The post-port packaged regression rebuilt the unsigned arm64 DMG from the final
P8-Q2 product and connected its embedded bundle to `127.0.0.1:58090`:

- DMG SHA-256: `562c6bb6ac49668d27adc475c03230459922f9baaa7c11107112a9e56d3a516f`
- embedded bundle SHA-256: `9ae6472e9a015db9f1376cd7f07be80dedcb552e7d1fc3f5a44680a6436ff67a`
- `hdiutil verify`, read-only mount, identifier/version/scheme, arm64 executable,
  embedded file bundle, real data, cold `synara://update`, update check, and the
  packaged Menu `CmdOrCtrl+3` route all passed;
- the packaged Pull Requests screenshot is byte-identical to its P8-Q2 certified
  Native frame;
- evidence and cleanup record:
  `../../../synara-lynx/shots/2026-08-01/port/p8-q3/notes.md`.

The rerun also closed a current-toolchain regression. Lynxtron 0.0.7 ships no
macOS Electron Helper app, while bundled electron-builder 26.8.1 unconditionally
renames one. `scripts/lynxtron-macos-helper-hook.mjs` supplies a marker-owned
placeholder after extraction and removes only that marked directory after pack,
before artifact creation. No synthetic Helper remains in the final app or DMG.

## Result

- Product: `Synara Lynx`
- Version: `0.5.5-lynx.0`
- Bundle identifier: `com.synara.lynx`
- Architecture: arm64
- URL scheme: `synara`
- Artifact: `dist/Synara-Lynx-v0.5.5-lynx.0-darwin-arm64.dmg`
- SHA-256: `a203647f1c2629270c3cfba2cdadab1a56e25cbea74a1889a6d6d51be022a8f4`
- Signing: intentionally disabled (`identity: null`)
- Publishing: disabled (`--publish never`)

## Verification

1. `npm run pack` built the 575.4 kB Lynx bundle, desktop main/preload/host bundles, arm64 app,
   DMG, and blockmap.
2. `hdiutil verify` reported the final DMG checksum as valid.
3. A read-only mount contained `Synara Lynx.app` and the `Applications` link, then detached
   cleanly.
4. `Info.plist` reported the expected identifier, version, and `synara` URL scheme; the app
   executable reported `Mach-O 64-bit executable arm64`.
5. The packaged executable loaded its embedded
   `file:///.../Synara Lynx.app/Contents/Resources/resources/app/main.lynx.bundle`, connected to
   the real Synara server, and rendered the real thread snapshot. DevTool console contained no
   application warning/error. Evidence:
   `../../shots/2026-07-27/p4-x3/packaged-smoke.png`.

The ReactLynx tree probe is expected to be silent in a production bundle because the Preact
DevTools setup is stripped. Screenshot and console inspection remain available for a controlled
run with `SYNARA_ENABLE_DEVTOOL=1`; normal production startup leaves DevTool disabled.

## Release boundary

This artifact proves the local packaging path and is not a publicly trusted release. Public
distribution requires the owner to decide D8 and supply Apple Developer ID/notarization
credentials through an approved release environment. Do not bypass Gatekeeper or embed secrets
in this repository.
