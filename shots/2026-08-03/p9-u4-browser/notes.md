# P9-U4 follow-up state verification

## Scope

This follow-up continues using the comparison gallery as the permanent
iteration surface. It covers Command K capability states and Composer detail
states that were not retained in the first P9-U4 slice.

Keyboard-shortcut certification is intentionally deferred at the user's
request. The existing Native host accelerator implementation and earlier
evidence remain documented, but this follow-up does not claim a new
Arrow/Tab/Enter/Escape pass.

## Harness

- Shared server: `ws://127.0.0.1:62190`
- Shared snapshot:
  `/private/tmp/synara-lynx-web-harness.SUyxxH/synara-home/dev/state.sqlite`
- Web original: `http://127.0.0.1:63231/`
- Lynx-for-Web: `http://127.0.0.1:63231/lynx/`
- Browser viewport: `1280×820`, DPR 1
- Native bundle:
  `apps/lynx/dist/desktop/main.lynx.bundle`
- Exact-owned Native client: PID-derived `localhost:8903`, session `1`
- Native outer window: `1280×820`
- Native LynxView frames: `2560×1576`

The default user window-state SHA-256 remained
`770cc84f1973b042e89d5cbe38903d8f4a9d7bd136bb084aaccf8c0cedbf70e4`.
The existing user-owned `8901` and `8902` clients were not touched.

## Command K

Web authority retained real product surfaces for:

- Add project → `Create project` dialog with project path, Space, New space,
  Create, and Cancel.
- Import thread → Codex, Claude, Cursor, Kilo, and OpenCode provider choices,
  external id input, and disabled empty-state Import action.
- Usage → real Usage settings route with provider usage heading and Refresh.

The read-only canonical RPC probe in `command-k/capabilities.json` proves the
underlying Lynx ports are real:

- `filesystem.browse` returned `spike-tools` and `spike-workspace`;
- all five canonical providers report `supportsThreadImport=true`;
- `server.listProviderUsage` returned real Codex, Claude Agent, and Cursor
  status records.

Stopping only the owned server produced the real Lynx search error state:
`Search sources are unavailable`, transport detail, and `Retry`. After the
same snapshot server restarted, clicking the rendered Retry action restored
the Suggested list. The colder app-level offline frame was diagnostic only
and is not retained in the comparison gallery.

Lynx-for-Web custom elements do not consistently publish browser mouse or
Enter activation to `bindtap`/native confirm for Command rows. Retry did
publish and recover. Add-project row activation is therefore treated as a
fast-loop input boundary, not as evidence that the Native action is absent.

## Composer

Browser product evidence now covers:

- Plan mode unchecked and checked.
- Fast submenu Default selected and Fast selected.
- Project selected, selected-menu reset affordance, and reset to
  `Work in a project`.
- Skill selected and cleared with real editor `Meta+A` + Backspace.
- Mention selected and cleared with the same editor path.

During Fast activation, the production Web app crashed with
`FastModeIcon is not defined`. The root cause was a missing import in
`apps/web/src/components/chat/TraitsPicker.tsx`. After the import was fixed, a
fresh browser session toggled Fast successfully, rendered `Medium · Fast`, and
had no console errors.

Exact-owned Native pointer evidence covers:

- extras open with `aria-expanded=true`;
- Plan mode checked;
- Fast selected;
- project menu open;
- project selected as `spike-workspace`;
- project reset to `Work in a project`.

The exact-client error/warning console is empty.

## Retained evidence

- `command-k/web-add-project.png`
- `command-k/web-import-provider.png`
- `command-k/web-usage.png`
- `command-k/lynx-search-error-retry.png`
- `command-k/lynx-recovered.png`
- `command-k/capabilities.json`
- `composer/web-plan-off.png`
- `composer/web-plan-on.png`
- `composer/web-fast-default.png`
- `composer/web-fast-crash.png`
- `composer/web-fast-on-clean.png`
- `composer/web-project-selected.png`
- `composer/web-project-selected-menu.png`
- `composer/web-project-reset.png`
- `composer/web-skill-selected.png`
- `composer/web-skill-cleared.png`
- `composer/web-mention-selected.png`
- `composer/web-mention-cleared.png`
- `../p9-u4-native/composer/*.png`
- `../p9-u4-native/composer/console.txt`

Every Browser PNG is exactly `1280×820`; every retained Native PNG is exactly
`2560×1576`.
