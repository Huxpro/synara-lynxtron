# Temporary Thread at 320x200

## Newly discovered scope

A canonical ordinary project and empty thread were rendered in dark mode at
`320x200` with the temporary-thread state active. Earlier temporary-thread
coverage verified departure cleanup and failure containment, but did not cover
the active marker at extreme short height.

Identity:

- state directory: `.synara-fidelity-temporary-short`;
- server: `ws://127.0.0.1:58090`;
- Web/Lynx origin: `http://localhost:8891`;
- project: `project-fidelity-temporary-short`;
- thread: `thread-fidelity-temporary-short`;
- canonical sequence: `0 -> 1 -> 2`;
- theme: dark;
- viewport/DPR: `320x200`, DPR `1`.

## Authority evidence

Web authority used its real root-level route
`/thread-fidelity-temporary-short`. The rendered `Temporary chat` button was
activated with a real browser click.

After activation:

- button: `32x32 @ (144,161.671875)`, bottom `193.671875`;
- `aria-pressed=true`;
- title: `Temporary chat — deleted when you leave. Click to keep it.`;
- body: `320x200`, no horizontal or vertical overflow;
- Vite/React console contained no page error.

At narrow width Web hides the visible text but preserves the icon-only control
and its accessible name. Temporary state therefore remains visible and
reversible even when the empty landing is compressed.

## P1 product loss

Before the fix, Lynx received `initialTemporaryOpen=true` and rendered the
active button state, but the short-height Thread rule hid the complete
`EmptyThreadContextTray`:

- tray: `0x0`, `display:none`;
- button: `0x0`;
- label: `0x0`;
- no alternative Temporary marker or control was published;
- relay: one connection, zero pending requests, no transport/RPC error.

The state was active but neither visible nor operable. This differed from Web
authority and made a destructive-on-departure lifecycle impossible to discover
or cancel.

`lynx-temporary-thread-short-marker-hidden`: P1 component contribution
`1.00 -> 0.00`.

## Root fix

The short-height Thread rule still hides the decorative hero and direct
provider banner, preserving the earlier composer-reachability repair. It no
longer hides the entire context tray.

At short height the shared tray now degrades to one fixed icon-only control:

- identity, Local/Worktree, branch, spacer, and visible label are hidden;
- tray and button are `28x28`;
- the control is centered at the viewport bottom with 2px clearance;
- normal-height tray styles remain unchanged.

No alternate temporary state or duplicate handler was introduced.

## After evidence

Lynx-for-Web direct cold entry at `320x200`:

- tray/button: `28x28 @ (146,170)`, bottom `198`;
- `accessibility-label=Temporary chat`;
- `accessibility-traits=button`;
- active accessibility state retained;
- all Composer footer controls remain at `y=142..170`;
- overlap between the Temporary control and footer controls: `0`;
- relay: one connection, zero pending requests, no transport/RPC error.

A controlled shadow-DOM activation verified the product handler transition
`active -> off -> active`. This is state-machine evidence only; it is not
claimed as pointer evidence. Web authority supplied the retained real-click
evidence.

At `320x568`, the normal tray remains `296x58 @ (12,469)` and the normal
Temporary button remains `102x28 @ (198,493)`.

A temporary post-fix PNG was verified as exactly `320x200`, SHA-256
`21f9c470e24c0be5f0f36f8dc27324815c44aa412503e654b9276a971605ffd0`,
then deleted. No screenshot was retained.

## Validation and boundaries

- Focused Rstest: 2 files / 6 tests passed.
- Lynx-for-Web production build passed:
  `output/bundle/web/main.web.bundle` `4539.7 kB`.
- Native/Desktop production build passed with the registered unsupported CSS
  and optional WebSocket dependency warnings.
- Staged Native bundle SHA-256:
  `1c48b4a1d975ac20b4fc24b8abf61038491cb8d5bcdbdd6f1d0af2353e19188f`.
- An exact-owned background Native process loaded the same thread,
  `temporary=open`, current staged bundle, and server snapshot. It completed
  canonical RPC hydration, but did not publish a new DevTool client. Existing
  clients `8901` and `8902` belonged to unrelated processes and were not used.
  Native DOM/interaction inspection is therefore harness missing coverage, not
  a Native pass or product failure. Native cannot represent the `320x200`
  viewport because the host minimum is `900x650`.
- A direct `agent-browser` selector could not cross the Lynx shadow root. That
  failed interaction probe was cleaned and rejected before controlled DOM
  activation.
- Every browser workflow used `bun run browser:run -- ...`; each failed probe
  was followed by the independent cleanup/session-list double-zero gate before
  continuing.
