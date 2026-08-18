# Settings Advanced Repair Reconciliation

## New Scope

- Settings → Advanced;
- Recovery tools eligibility with real server state;
- Repair state confirmation Cancel path;
- Recovery disclosure expansion;
- authoritative repaired snapshot reconciliation into the shared store;
- failure ordering and query invalidation;
- Native production UI and exact-client console.

The current canonical shell snapshot contained four projects and two threads.
Both threads were messageless, so Recovery tools were correctly visible
without creating fixtures or mutating SQLite.

## Classification

`orchestration.repairState` returns a complete authoritative
`OrchestrationReadModel`.

Web authority applies that return value through
`syncServerReadModel(snapshot)` before displaying success.

Lynx previously discarded the returned snapshot and only invalidated the
sidebar query. The Settings panel could show a successful repair while the
shared Zustand project/thread state remained stale until a later independent
event or hydration cycle. This was a P1 product data-reliability loss.

## Fix

- Added one repair transaction owner:
  `repair → sync authoritative snapshot → invalidate sidebar query`.
- The transaction stops before sync/invalidation when repair fails.
- Settings Advanced still owns confirmation, pending state, success/error copy,
  and recovery eligibility.
- Both Web and Lynx continue to reuse the shared `syncServerReadModel`
  projection.

## UI Outcome

- Web and Lynx-for-Web both showed:
  - Recovery tools;
  - Repair state;
  - What this does.
- Lynx-for-Web real Repair state activation produced the canonical confirmation:
  `Repair local state?`
- The confirmation returned Cancel, so no repair side effect ran.
- Exact-owned Native rendered the real Recovery row.
- Native activated What this does at `598×16 @ (517,367)` and rendered:
  `Rebuilds local project indexes and refreshes project snapshots. Existing chats stay in place.`
- Exact Native error/warning console was empty.

The actual repair mutation was not run against healthy user state merely to
create evidence. Its success/failure ordering is covered by executable logic
tests, while the shared authoritative projection is covered by its full test
suite.

## Harness Separation

The browser automation layer auto-handled the Web native confirm before the
temporary recorder observed it. The Lynx-for-Web bridge recorder captured the
same canonical copy. This is a browser dialog interception boundary, not a
product delta.

No browser screenshot was retained for this slice because Advanced already has
visual coverage and the new value is transaction reliability. Diagnostic
captures stayed in `/tmp`; the repository screenshot count remained `100`.

## Verification

- Settings Advanced + repair transaction tests: `5/5`;
- shared store projection tests: `41/41`;
- Lynx-for-Web production build: passed;
- Native/Desktop production build: passed;
- staged Native bundle SHA-256:
  `6d1c56b26e142861961f307e22e5461fe5ff369c092c4700311bdef57e991c43`;
- staged desktop main SHA-256:
  `3bda3e635d0be05293ba2fe79d9f4182fb4c51ce3b83c9771c2e7d6c3182115e`;
- final exact-owned Native PID: `21584`;
- PID-derived DevTool client: `localhost:8902`, session `1`;
- browser ownership gate: zero sessions and zero owned processes.

## Evidence

- `native/outcome.json`
- `native/recovery-trigger-geometry.json`
- `loss.json`
