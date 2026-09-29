# Automations Edit Model Parity

## Classification

- New scope: Automation Edit × Model × Codex reasoning effort × Web authority,
  Lynx-for-Web, and Native.
- P1 product loss:
  `lynx-automation-edit-model-missing`, `1.00 -> 0.00`.
- P1 reliability loss:
  `codex-discovery-binary-hardcoded`, `1.00 -> 0.00`.
- Missing coverage closed:
  `automations-edit-native-inline-field-parity`, `1.00 -> 0.00`.
- Harness restart error closed:
  `automation-model-server-dev-origin`, `1.00 -> 0.00`.

No loss weight, sample filter, or scope reduction changed.

## Canonical Fixture

A temporary disabled/manual Automation was created through Web authority's
real `createWsNativeApi()` product API:

- ID:
  `automation:ff3ac38d-0558-4e5e-a41b-586ff78dc278`;
- name:
  `Fidelity Model Edit 1787032521570`;
- project:
  `0cda7609-00d2-41f7-a86b-53fbb427afcf`;
- initial model:
  `{ provider: "codex", model: "gpt-5.6-sol" }`;
- schedule:
  Manual;
- enabled:
  false;
- max iterations: 25.

The fixture never ran. SQLite was not written directly.

## Product Discovery

Web authority's Automation detail exposed inline editing for:

- schedule;
- model;
- model reasoning/effort;
- mode;
- max iterations;
- other automation policy fields.

Current Lynx Edit already covered Name, Prompt, Stop when, Repeats, Time,
Timezone, and Max iterations, but exposed no Model control. Users could not
change the model or its reasoning options even though
`AutomationUpdateInput.modelSelection` supports the full selection.

## UI Fix

Automation Edit now reuses the exact existing Automation Create infrastructure:

- `ComposerModelControl`;
- server provider configuration query;
- dynamic provider model catalog query;
- shared provider/model/trait projections.

Edit state initializes from `definition.modelSelection`. Dirty-state and update
payloads include `modelSelection` only when provider, model, or options change.
No second picker or reasoning implementation was added.

At `900x650`, dark:

- dialog:
  `560x490 @ (170,80)`;
- panel:
  `526x370 @ (187,137)`;
- Model control:
  `526x28 @ (187,355)`;
- initial trigger:
  `GPT-5.6 Sol / Low`.

The field fit above the footer without requiring dialog scrolling.

## Codex Discovery Reliability Loss

The first live model catalog request failed:

`Codex CLI version check failed. Error: codex not found in PATH`

The process PATH did contain a cmux-generated `codex` shim. That shim removes
its own shim directory and execs another `codex`, but no second PATH binary
exists. The real bundled binary was present and healthy:

- `/Applications/ChatGPT.app/Contents/Resources/codex`;
- version:
  `0.147.0-alpha.6.5`;
- provider status:
  ready and authenticated.

Normal Codex sessions already call the shared `resolveCodexBinaryPath`, which
selects the ChatGPT bundled binary on macOS. Discovery sessions instead
hardcoded `"codex"` for both version checking and app-server spawn. Model
discovery therefore failed while provider health passed.

Discovery sessions now resolve once through `resolveCodexBinaryPath()` and use
the same result for version check and spawn.

After restarting the exact owned server:

- `provider.listModels` succeeded;
- `GPT-5.6 Sol / Low` rendered;
- relay connected once;
- pending requests returned to zero;
- no transport or RPC error remained.

The first server restart omitted the existing Web dev URL, so the server
allowed `5733` while Lynx-for-Web used `8891`; bootstrap failed four times.
That run was rejected as a harness configuration error. The server was
gracefully restarted with:

`--dev-url http://localhost:8891`

The final server instance connected correctly.

## Rendered Roundtrip

Lynx-for-Web used real rendered pointer interactions:

1. open Edit;
2. open the shared Model control;
3. select High effort;
4. Save.

Before save:

- trigger:
  `GPT-5.6 Sol / High`;
- Save:
  enabled.

After save:

- dialog closed;
- one `automation.update` RPC was emitted;
- relay remained one-attempt OPEN with no error.

A fresh Web authority read back:

```json
{
  "provider": "codex",
  "model": "gpt-5.6-sol",
  "options": {
    "reasoningEffort": "high"
  }
}
```

## Exact Native

Final exact-owned Native:

- PID:
  `1654`;
- PID-derived DevTool:
  `localhost:8902`, session `1`;
- bundle SHA-256:
  `efc7a20953df67d0abc20f403cc25410868c2c38a3495681068c540c4871ceb5`;
- one established server socket.

DevTool touch opened the real Edit dialog. Native exposed:

- `Choose model`;
- model:
  `GPT-5.6 Sol`;
- effort:
  `High`.

Fresh exact-client warning/error console output was empty.

## Cleanup

The model was restored through canonical `automation.update` to the original
selection without options. Canonical `automation.delete` then removed the
fixture from the default Automation list.

The product's delete contract archives definitions rather than physically
purging them. `includeArchived:true` therefore retains an archived tombstone
with the restored original model. No public permanent-purge API exists, and
SQLite was not modified to hide that product behavior.

## Verification

- server focused tests:
  `97 passed / 2 skipped`;
- Lynx Automation focused tests:
  `2 files / 19 tests`;
- complete workspace production build passed;
- Web authority readback passed;
- Lynx-for-Web rendered High/save roundtrip passed;
- exact Native Model/High/console/socket verification passed;
- default Automation list contains no fixture;
- no screenshots added; repository count remained `100`;
- temporary captures and DOM files are removed before commit;
- every failed browser/probe/restart loop was followed by `browser:gate`.
