# Native Automations Create Schedule Switching

## Newly Discovered Scope

An exact-owned Native Automations cell exercised schedule-dependent form state
inside New automation:

`Daily -> Manual -> Weekdays -> Cancel`

The canonical project enabled the real New automation action. No automation
definition or run was created.

## Harness Identity

- Source commit: `ec662c2d9ca053d1159281da25f3214556212d29`.
- Exact-owned Native window: `900x650`.
- Staged bundle SHA-256:
  `64aecc2b7aec67a2e62f76a1ffbba4f5b31a51476ea8bbf613a718dc414dabbe`.
- PID/lsof-derived client: `localhost:8903/session 1`.
- Every interaction/verification stage reported the same client, session, and
  bundle URL.
- Unrelated DevTool clients were untouched.

## Real Interaction Evidence

New automation:

- action: `137x28 @ (751,9)`;
- real touch: `(819.5,23)`;
- dialog: `420x618 @ (240,16)`.

Default Daily state:

- Daily carried `AutomationCreateChoice--selected`;
- Time input count: `1`;
- summary contained `Daily at 09:00`.

Real Manual touch:

- choice: `59x26 @ (257,332)`;
- touch: `(286.5,345)`;
- Manual became selected;
- Time input count changed to `0`;
- summary switched to Manual.

Real Weekdays touch:

- choice: `76x26 @ (374,332)`;
- touch: `(412,345)`;
- Weekdays became selected;
- Time input count returned to `1`;
- summary contained `Weekdays at 09:00`.

Real Cancel:

- button: `66x32 @ (436,508)`;
- touch: `(469,524)`;
- dialog unmounted;
- empty Automations state returned;
- host log contained no `automation.create` request.

## Classification

- `native-automations-create-schedule-conditional-state`: missing coverage
  `1.00 -> 0.00`.
- Product-loss contribution: `0.00 -> 0.00`.
- No code change was required.

The current create surface exposes Manual, Daily, and Weekdays. This cell does
not invent unsupported Hourly/Cron choices and does not substitute backend
schedule types that are absent from the rendered create form.

## Validation And Cleanup

- Exact-owned Native warning/error console contained no entry.
- Temporary JPEG was exactly `1800x1300` and was deleted.
- Host log proved `automation.list` and the absence of `automation.create`.
- All owned app, Synara server, state, Git fixture, logs, console, and image
  artifacts were removed.
- Port `58090` was free.
- Entry and exit `browser:gate` returned `sessions: []` and zero
  agent-browser-owned processes.
- Screenshot count remained exactly `100`.
