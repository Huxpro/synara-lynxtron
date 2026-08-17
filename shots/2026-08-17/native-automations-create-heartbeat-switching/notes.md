# Native Automations Create Heartbeat Switching

## Newly Discovered Scope

An exact-owned Native New automation cell exercised the mode-dependent form
structure:

`Standalone -> Heartbeat -> Standalone -> Cancel`

The canonical project enabled the real create action. No automation was
submitted.

## Harness Identity

- Source commit: `a609e7eab3d343ae814f0999ab305196e378a3b8`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every stage reported the same client, session, and bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

New automation opened through real touch at `(819.5,23)`.

Default Standalone:

- Standalone carried `AutomationCreateChoice--selected`;
- `Target thread` label count: `0`;
- `Heartbeat stop condition` input count: `0`.

Real Heartbeat touch:

- choice: `75x26 @ (345,424)`;
- touch: `(382.5,437)`;
- Heartbeat carried the selected class;
- `Target thread` label count: `1`;
- `Heartbeat stop condition` input appeared with:
  - `focusable=true`;
  - `maxlength=2000`;
  - placeholder `PR is ready to merge`;
- summary switched to Heartbeat.

Real Standalone return:

- choice: `82x26 @ (257,424)`;
- touch: `(298,437)`;
- Standalone regained the selected class;
- Target thread and Stop when fields both unmounted.

Real Cancel at `(469,524)` closed the dialog, restored the empty route, and
did not emit `automation.create`.

## Classification

- `native-automations-create-heartbeat-conditional-state`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

The exact target-thread row was not a hard requirement because sidebar thread
projection readiness varied across isolated startup attempts. The retained
contract proves the authoritative conditional field label, Stop when input,
selected mode, summary, and reverse unmount behavior.

## Harness Failures

The first verification incorrectly required an exact projected thread title.
Heartbeat and Stop when were already present, but the title lookup was absent.
That startup-dependent assertion was rejected as harness readiness, followed by
`browser:gate`, and replaced with the stable form-structure contract.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- Host log contained no `automation.create` request.
- All owned app, Synara server, state, Git fixture, logs, console, and image
  artifacts were removed.
- Port `58090` was free.
- Entry, failure, and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
