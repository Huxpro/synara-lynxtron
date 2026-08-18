# Integrations Clipboard Failure

## New Scope

- Settings → Integrations;
- setup prompt copy rejection;
- manual pairing-command copy rejection;
- manual MCP JSON copy rejection;
- example-prompt copy rejection;
- visible success/error notice semantics;
- Native production empty-active state after prior lifecycle cleanup.

Existing 2026-08-18 evidence already certified real successful copy actions,
complete setup content, pairing, connected stdio, revoke, and credential
cleanup. This slice adds the previously unverified failure path.

## Classification

Web authority wraps clipboard writes and reports a visible `Could not copy`
error when clipboard access rejects.

Lynx previously awaited `clipboard.writeText` directly. A rejection escaped
the event handler before `setNotice`, leaving no visible feedback and risking
an unhandled rejection in a primary setup workflow. This affected:

- Copy setup prompt;
- Pairing command Copy;
- MCP configuration Copy;
- Copy example prompt.

This was a P1 interaction loss, not a clipboard platform limitation.

## Fix

- Added one renderer-agnostic clipboard outcome transaction.
- Successful writes preserve each action-specific confirmation.
- `Error` rejections preserve their concrete message.
- Non-Error rejections use `Could not copy to clipboard.`.
- All four Integrations copy actions use the same transaction.
- Existing notice accessibility renders error outcomes as alerts and keeps
  success outcomes non-assertive.

## Verification

- clipboard outcome + Integrations + error-semantics tests: `8/8`;
- success outcomes covered for:
  - setup prompt;
  - pairing command;
  - configuration;
  - example prompt;
- failure outcomes covered for `Error` and non-Error rejection;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `3f316f60f239edbb6a59df90cab774cf7b7fc59d16a0d69d9ec265a0372740e4`;
- staged desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`;
- final exact-owned Native PID: `4732`;
- PID-derived DevTool client: `localhost:8903`, session `1`;
- exact Native error/warning console: empty;
- canonical active integration count: `0`;
- repository screenshot count remained `100`.

## Harness Separation

The first final console probe targeted remembered `localhost:8902` and was
refused. The exact-owned PID was still alive and listening on `8903`, with an
established product socket to `127.0.0.1:58090`. Retargeting from the PID
passed. This was a harness identity mistake and was not attributed to product
code.

No new screenshot was retained because the successful setup UI and real copy
flow already have complete Web/Lynx/Native evidence. The new deliverable is
failure behavior and requires executable outcome evidence, not another
duplicate image.

## Evidence

- `native/outcome.json`
- `loss.json`

## Ledger Outcome

- fidelity loss: `11.2382 → 11.2327`;
- loss delta: `-0.0688`;
- component contribution:
  - scope: `-0.0634`;
  - completeness: `-0.0054`;
  - visual: `0`;
  - reliability: `0`;
- no regression change was recorded.
