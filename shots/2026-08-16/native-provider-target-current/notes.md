# Native Provider updates target

## Discovered loss

The new Native Settings target pipeline accepted `provider-updates`, but the
Lynx Provider tools panel did not render the shared `#provider-updates` anchor.
Exact-owned cold start emitted a selector runtime error and remained at the
top of Providers:

`no node found for selector '#provider-updates'`

The visible Provider updates summary existed, so this was target ownership
drift rather than missing content.

`native-provider-updates-target-missing-anchor`: P1 contribution
`1.00 -> 0.00`.

## Fix

`SettingsProviderToolsPanel.lynx.tsx` now imports the shared
`SETTINGS_TARGETS` constant and assigns
`id={SETTINGS_TARGETS.providerUpdates}` to the Provider updates summary row.
A focused source contract prevents the Web and Native target names from
drifting again.

## Exact-owned verification

- Startup:
  `synara://settings/providers?target=provider-updates`
- Isolated server: `127.0.0.1:58090`
- Temporary `@lynx-js/lynxtron@0.0.9-dev` host
- PID-derived DevTool client: `localhost:8901`, session `1`
- Viewport/theme: `1280x820`, light
- Output/staged bundle SHA-256:
  `830c5888ffd2d3312337e07de9cf249481ba97db6bed6ae6f79a488b4832c98e`

The fixed run rendered a real `provider-updates` anchor as node `180` and
scrolled it to `(457,0,622x60)`. The target region contained:

- Automatic CLI update checks;
- Provider updates;
- current no-update status;
- the Provider picker;
- Installed CLIs with nine provider disclosure rows.

The exact-client warning/error console was empty.

## Verification and cleanup

- Focused Provider tools/shell/scroll tests: `3` files, `21/21` passed.
- Native/Desktop production build: passed.
- Existing build warnings only.
- Output/staged hashes: identical.
- Exact-owned ports and temporary runtime/user/server state: cleaned.
- Browser lifecycle exit gate: `sessions: []`, zero owned processes.
- Screenshot count remains `100`; no screenshot was added.

No additional product loss was found in the target state. Provider disclosure
editing, update execution, and target behavior in dark/compact remain separate
interaction scope.
