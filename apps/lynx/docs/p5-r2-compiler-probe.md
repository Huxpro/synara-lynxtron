# P5-R2 — Original-source compiler probe

Date: 2026-07-27

## Result

The same physical
`/Users/bytedance/github/synara/apps/web/src/components/settings/SettingsSection.tsx`
is now compiled by both the Web production build and the ReactLynx/Rspeedy
build. Its JSX was not copied.

The shared composition delegates only its host elements:

- Web: `SettingsSectionElements.tsx` renders `section`, `h2`, and `div`.
- Lynx: `SettingsSectionElements.lynx.tsx` renders `view` and `text`.
- Existing Web imports continue through `SettingsPanelPrimitives.tsx`; call
  sites did not change.

## Compiler evidence

The first probe imported the broad `SettingsPanelPrimitives` module. After
65.5 seconds, Rspeedy reached the Base UI Select dependency chain and failed:
`@base-ui/utils/esm/reactVersion.js` imports `React.version`, which the current
ReactLynx compatibility surface does not export. This proves a broad UI barrel
is not a portable boundary.

The minimal composition/element boundary then passed:

- `bun run --cwd apps/lynx build`: Lynx bundle 581.4 kB and desktop bundle built.
- `bun run build` in `synara/apps/web`: 8,755 modules built successfully.
- `bun run --cwd apps/lynx audit:reuse:check`: 37-module Lynx graph, zero unresolved
  imports; `SettingsSection.tsx` counted by realpath as `SHARED`.

The audit intentionally reports only a 0.14% Settings reuse gate at this point:
one small shared subtree is evidence for the method, not a claim that the
screen has reached the 70% exit threshold.

## Runtime evidence

The production Lynxtron bundle was launched with
`SYNARA_ENABLE_DEVTOOL=1`. DevTool discovered the isolated `slice` client on
port 8903 and session 1 at the packaged `main.lynx.bundle`. The probe rendered
the shared section/title/card structure; console output contained only the
preload startup message.

- Screenshot:
  `shots/2026-07-27/port/p5-r2/shared-settings-probe/lynx.png`
- Runtime checklist:
  `shots/2026-07-27/port/p5-r2/shared-settings-probe/notes.md`

The production DevTool switch is necessary by design (P-21); a visible client
with no session while the switch is off is not a bundle failure.

## D7 conclusion

D7 resolves to **a: one repository/workspace for the final Lynx app**. The
sibling-path probe proves physical sharing is technically possible, but it
depends on absolute repository adjacency, duplicated dependency ownership, and
cross-repository CI coordination. Co-location makes shared-source refactors
atomic and lets package/workspace tooling enforce the reuse contract.

`synara/apps/lynx` is the final workspace location; the former `synara-lynx` control plane remains recoverable staging through the
foundation work. Moving the whole app is deliberately deferred until the
shared boundaries and build inputs are stable; this task records the final
landing decision without performing a disruptive relocation.
