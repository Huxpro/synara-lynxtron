# Integrations Setup Lifecycle Parity

## New Scope

- screen: Settings → Integrations;
- states:
  - empty initial form;
  - active unpaired connection;
  - refreshed pairing setup;
  - guided setup prompt;
  - manual pairing/config disclosure;
  - example task prompt;
  - copy confirmation;
  - revoke cleanup;
- clients: Web authority, Lynx-for-Web, exact-owned Native;
- theme: dark;
- viewport: browser `1280x820`, DPR `1`; Native `1280x820` outer,
  `2560x1640` physical;
- server: isolated `127.0.0.1:58090`.

All integrations were created, refreshed, listed, and revoked through canonical
`server.*ExternalMcpIntegration` RPCs. SQLite was read-only. Pairing codes and
setup commands remained in transient runtime evidence and were not committed.

## Identity

- Web and Lynx-for-Web used the same server instance and canonical integration
  list.
- Lynx relay:
  - one connection attempt;
  - socket open;
  - pending unary requests `0`;
  - one expected active stream: `terminal.subscribeEvents`;
  - no transport or RPC error;
  - renderer-ready route `/settings/integrations`.
- Browser screenshots were exactly `1280x820`.
- Native used the workspace staged bundle and PID-derived client
  `localhost:8902`, session `1`.

## Web Authority

A real Create connection action produced the complete authority flow:

- `Waiting for pairing` status and expiry;
- `1. Give your agent this prompt`;
- visible self-contained setup prompt containing:
  - one-time pairing command;
  - `codex mcp add synara`;
  - `claude mcp add --scope user synara`;
  - generic `mcpServers` JSON;
  - `synara_overview` verification;
- `Set up by hand instead` disclosure;
- explicit pairing command and MCP JSON copy actions;
- `2. Try it` example task;
- Resume pairing and Revoke actions;
- Connected agents projection.

## Product Loss 1

Before the fix, Lynx rendered only:

- `Waiting for pairing`;
- a short description;
- `Copy setup prompt`;
- `Done`.

It omitted the visible guided prompt, manual setup path, JSON configuration,
example prompt, expiry/recovery status, and verification guidance. Users could
not inspect what would be copied or manually connect apps such as Claude
Desktop.

This was a P1 functional capability loss, not accepted platform simplification.

## Root Cause And Fix

Lynx maintained a separate simplified setup composition and its own reduced
`buildExternalMcpSetupPrompt`, while Web owned the complete product contract.

The fix:

- deletes the duplicate Lynx prompt builder;
- imports the shared Web authority helpers:
  - `buildExternalMcpSetupPrompt`;
  - `buildExternalMcpClientConfiguration`;
  - `buildExternalMcpExamplePrompt`;
  - `externalMcpSetupAction`;
- adds the same status/expiry/recovery decisions;
- adds the complete guided prompt, manual pairing/config, example, copy, back,
  done, resume, and revoke anatomy;
- keeps only renderer composition and platform clipboard primitives in Lynx.

Provider/setup decisions are now shared; there is no Lynx-only product policy.

## Product Loss 2

The first exact Native run exposed a second P1 layout/interaction loss.

Although the stacked setup row computed `flex-direction: column`, its direct
`.SettingsIntegrationsRowCopy` retained `flex: 1`. Lynx Desktop compressed that
child to `height: 0`, so the title/description and Copy action overlapped. The
same row rendered correctly in Lynx-for-Web.

Final fix:

- `.SettingsIntegrationsSetupRow--stacked > .SettingsIntegrationsRowCopy`
  uses `flex: none`;
- copy actions use an explicit full-width
  `SettingsIntegrationsSetupActionRow`;
- spacing no longer depends on a zero-height flexible copy child.

Native setup row geometry changed from a zero-height copy block to:

- first stacked row:
  `598x404 @ (497,229)`;
- Try it row:
  `598x120 @ (497,731)`;
- Copy setup prompt:
  `109x24 @ (509,353)`, below title and descriptions;
- prompt scroll surface below the action with no overlap.

## Final Runtime

Lynx-for-Web final state proved:

- complete Codex + Claude + JSON setup prompt;
- manual pairing and MCP JSON sections;
- `2. Try it`;
- Copy setup prompt real pointer action;
- visible `Setup prompt copied.` notice;
- no page errors;
- settled unary relay.

Native final state proved:

- complete guided prompt;
- `Set up by hand instead`;
- `2. Try it`;
- real Copy setup prompt action reached
  `bridge.clipboardWriteText` with the complete shared prompt;
- real Show action opened `MCP configuration (JSON)` after
  `DOM.scrollIntoViewIfNeeded`;
- warning/error console empty;
- one established product socket.

Final root-build certification:

- Native PID: `89957`;
- route: `synara://settings/integrations`;
- bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`;
- SHA-256:
  `7b42106e7d9654721f3767a02663ae301f2a7608f6d530e89adc1086a2d09122`;
- DevTool client/session:
  `localhost:8902` / `1`;
- product socket:
  established to `127.0.0.1:58090`;
- warning/error console:
  empty;
- Native left running for user experience.

## Harness Losses

- One Lynx inventory run evaluated on `about:blank`; it was rejected as route
  readiness mismatch and did not count as missing product UI.
- The initial Native Show touch landed before the control was fully visible in
  the settings scroller. After `DOM.scrollIntoViewIfNeeded`, the same rendered
  control expanded successfully.
- No harness mismatch was relabeled as product loss.

## Cleanup

Temporary connections:

- `Coding agent`;
- `Fidelity setup parity`.

Both were canonically revoked. Final `active` integration list was empty.
Revoked audit rows remain non-usable history; no active credential or pairing
code remains.

## Verification

- Lynx Integrations focused tests: `7/7`;
- shared Web setup tests: `10/10`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed with registered warnings;
- complete workspace production build: `6/6`;
- Web/Lynx page errors: empty;
- final Native warning/error console: empty;
- browser entry/failure/exit gates: `sessions: []`, zero owned processes;
- no repository screenshot added; screenshot count remained `100`.

No weights, masks, sample filters, or requested scope changed.

Generated fidelity accounting:

- loss:
  `11.667654316861451 -> 11.539802495015246`;
- delta:
  `-0.12785182184620503`;
- scope contribution:
  `-0.13761467889908174`;
- completeness contribution:
  `+0.009762857052875162`;
- visual contribution:
  `0`;
- reliability contribution:
  `0`.

Both P1 findings were discovered and fixed in the same coherent slice, so the
final active reliability component remains zero.
