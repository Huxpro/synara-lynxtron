# Hidden-provider update filtering

## Contract

Provider visibility is a local picker preference, but it also filters provider
update notifications in the same client. Hiding Claude must not mutate server
provider availability.

## Rendered Interaction

The Lynx-for-Web Providers page started with:

- Claude switch on;
- two `3 updates available` summaries;
- Claude, OpenCode, and Pi update rows.

The rendered `Show Claude in the provider picker` switch was turned off.

The same page immediately changed to:

- two `2 updates available` summaries;
- OpenCode and Pi update rows only;
- `1 provider hidden`;
- a visible provider-picker reset action.

Browser local storage persisted:

`hiddenProviders: ["claudeAgent"]`

with the canonical provider order. Server settings and SQLite remained
byte-identical.

## Restore

The rendered `Reset provider picker to default` action restored:

- Claude switch on;
- two `3 updates available` summaries;
- Claude, OpenCode, and Pi update rows;
- `All providers visible`;
- no reset affordance;
- local storage `hiddenProviders: []`.

No browser page errors occurred, and no owned process or browser session
remained.
