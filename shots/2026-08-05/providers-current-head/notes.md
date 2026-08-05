# Current-head Providers fidelity proof

## Harness

- Fast-loop viewport: `1280x820`, DPR 1, explicit Light theme.
- Web authority: `http://localhost:8921/`.
- Lynx-for-Web: `http://localhost:8921/lynx-current/`.
- Both clients used the trusted `localhost:8921` origin and the same isolated
  server snapshot at `/Users/bytedance/github/synara/.p10-view/dev/state.sqlite`.
- Owned isolated server PID: `32042`, listening on `127.0.0.1:60462`.
- Final staged Lynx-for-Web bundle SHA-256:
  `4efc66686ddec6ee4267a265e50ff81dfa1cfc5309ab01b58a5b9f4ea2675183`.
- Final Native/Desktop bundle SHA-256:
  `af1289524bb0880088166b0d55d74cf44ec53e067507607490e8b36589671e2d`.
- Every retained PNG is exactly `1280x820`.

The first generic production build contained only the default `58090` relay
endpoint and was not used as snapshot evidence. The retained Lynx-for-Web
bundle was rebuilt with `SYNARA_WS_URL=ws://127.0.0.1:60462`, staged
byte-identically under `/lynx-current/`, and verified before capture.

## Product coverage

The previous Lynx Providers page exposed only the update-check preference and
provider picker. Current head now owns the complete Web composition:

1. Updates section with the real automatic-check preference.
2. Real provider update summary and filtered update rows.
3. Existing provider picker in Web order.
4. Provider tools section with all nine installed CLI rows.
5. Shared 220ms disclosures with docs and every Web provider override.
6. Canonical `server.updateProvider` actions with timeout handling.
7. Canonical `server.updateSettings` field edits and one provider-tools reset.
8. Redacted configured-password semantics for Kilo and OpenCode.

The nine-provider docs and field schema now has one source of truth in
`@synara/shared/providerTools`. Web preserves inline-code segments while Lynx
renders the same descriptions as native text.

The real snapshot contained three behind-latest providers:

- Claude: `v2.1.212 -> v2.1.220`
- OpenCode: `v1.18.12 -> v1.18.14`
- Pi: `v0.80.6 -> v0.83.0`

Provider tools also exposed safe unknown-advisory update actions for Cursor,
Antigravity, and Droid, matching Web. Codex, Grok, and Kilo did not expose a
false action.

## Measured convergence

| Owner | Web | Lynx-for-Web |
| --- | ---: | ---: |
| Updates card | `624x337.5` | `624x338.5` |
| Updates inset list | `598x178` | `598x179.5` |
| Update rows | `59 / 59 / 58` | `58.5 / 59.5 / 59.5` |
| Provider tools card | `624x496.5` | `624x496` |
| Provider tool rows | nine at `596x44` | nine at `596x44` |
| Codex disclosure row, open | `596x257` | `596x257` |
| Codex disclosure content | `596x213` | `596x213` |
| Codex inputs | `572x28` | two at `572x28` |

The remaining one-pixel card/list totals are fractional border rounding, not a
repeated row-owner error.

## Interaction and cleanup proof

- Navigation used the canonical `shell:navigate` renderer event to
  `/settings/providers`; no history or SQLite fixture was written.
- The rendered Codex disclosure opened with
  `LynxDisclosureMotion--open`, three real docs links, and both override fields.
- A rendered `CODEX_HOME` input accepted
  `/tmp/synara-provider-fidelity-home`, committed through
  `server.updateSettings`, and immediately showed `Custom`.
- The rendered provider-tools reset removed `Custom`, closed the disclosure,
  cleared the temporary path, and removed its reset affordance.
- No temporary path remained under `.p10-view`.
- `state.sqlite` returned byte-exactly to
  `cd3e1e9efe5d373efd3271338eb504f94f98f5aea24a7b3df43acbb9d5e06710`.
- `settings.json` business fields returned to their original bytes; the two
  canonical mutations advanced only its revision. After stopping the owned
  server, restoring the proven original revision returned the file
  byte-exactly to
  `d221bb251a46a7341676e93bcb682b6c09c89259429c4d2efff4ab5232ec1269`.
- The owned server stopped and port `60462` was free.
- Browser page errors were empty. The only console warning was the known
  upstream Lynx Web initialization deprecation.

## Evidence

- `providers-web-1280x820-light.png`: current Web authority.
- `providers-lynx-web-1280x820-light.png`: final current-head fast-loop frame.
- `providers-lynx-web-tools-1280x820-light.png`: all nine tool rows.
- `providers-lynx-web-codex-open-1280x820-light.png`: open Codex disclosure.
- `providers-lynx-1280x820-light.png`: earlier Native reference retained for
  history. Current-head Native certification is now under
  `shots/2026-08-06/providers-native-current/`.

## Gates

- Focused Providers + Settings navigation: 2 files, 15/15 tests.
- Shared provider-tools schema: 2/2 tests.
- Web provider settings plus provider-refresh race suites: 5/5 tests.
- Lynx-for-Web production build with the isolated relay: passed.
- Native/Desktop production build: passed with only the existing
  `color-scheme`, `overflow-wrap`, and optional `ws` native-module warnings.
- Exact-owned Native certification covers closed, tools-visible, Codex-open,
  and input-focus-tap states with empty warning/error consoles. It does not
  claim text entry or IME behavior.
- Reuse baseline regenerated and strict check passed; Settings gate is 53.91%.
- Style strict check passed at 98.07% weighted coverage.
- `bun fmt`, `bun lint`, and `bun typecheck` were not run because the current
  conversation does not authorize those heavyweight checks.
