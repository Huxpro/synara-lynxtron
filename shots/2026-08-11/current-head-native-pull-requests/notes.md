# Current-head Native Pull Requests empty light 1280

- Scope: exact-owned Native Pull Requests light/1280 empty-state cell plus
  current Web authority.
- Native startup used the real `synara://pull-requests` deep link.
- First exact-client preflight failed and was rejected: the route repeatedly
  threw on `data.repositoryBatches.filter(...)` because the Lynx query
  projection discarded `repositoryBatches`.
- After preserving repository batches, the next preflight exposed
  `data.errors.length` for the same reason. The projection now preserves all
  route-consumed list metadata: `viewer`, `entries`, `errors`, and
  `repositoryBatches`.
- Final exact-owned identity:
  - root PID `73788`, app PID `73793`
  - PID-derived `localhost:8902`, session `1`
  - staged workspace bundle URL
  - unrelated `@t3tools/lynxtron` on 8901 untouched.
- Final Native runtime:
  - root `1280x820`; screenshot `2560x1640`
  - route page `1024x820 @ (256,0)`
  - header `1024x46 @ (256,0)`
  - filters `968x66 @ (284,62)`
  - empty region `968x180 @ (284,144)`
  - accessibility copy: `No pull requests found. Try another involvement,
    state, project, or search filter.`
  - warning/error console empty.
- The retained Web authority uses the same empty copy, involvement/state
  filters, search field, project filter, and refresh action. Its page-error file
  is empty. A first Web screenshot containing the update toast was discarded
  and overwritten after dismissing the rendered toast.
- Verification: focused PR projection/capability coverage passes 3/3; Web and
  Native/Desktop production builds pass.
- This certifies the empty light/1280 route only. Populated list/detail states,
  dark, and 1440 remain pending.

## Populated interaction refresh (2026-08-15)

- Added a canonical live-GitHub snapshot with one project created through
  `orchestration.dispatchCommand`; no SQLite fixture was written.
- `pullRequests.list` returned 50 real open entries with zero repository
  errors. Wide and compact Lynx-for-Web cells selected PR `#689` through
  trusted pointer input.
- Real interaction passed:
  - populated list -> selected detail;
  - Summary -> Timeline -> Code;
  - wide Code -> Summary restoration.
- Code issued `pullRequests.diff` and rendered 42 files with `+505/-47`.
- Wide detail used the expected `512x774` split dock. Compact detail replaced
  the list with a full `390x798` master-detail surface; all tab, primary,
  external, and close actions remained within the 390px header.
- New-scope loss accounting:
  - `lynx-pull-requests-populated-list-detail`: `0.00 -> 0.00`;
  - `lynx-pull-requests-summary-timeline-code-interaction`: `0.00 -> 0.00`;
  - `lynx-pull-requests-compact-master-detail`: `0.00 -> 0.00`;
  - `lynx-pull-requests-code-disclosure-interaction`: `0.00 -> 0.00`;
  - `lynx-pull-requests-compact-close-return`: `0.00 -> 0.00`;
  - `lynx-pull-requests-search-keyboard-filter`: `0.00 -> 0.00`;
  - `lynx-pull-requests-state-filter-detail-reset`: `0.00 -> 0.00`.
- A compact follow-up expanded and collapsed the first real Code file, then
  closed the detail dock and restored the full-width list. Lynx-for-Web's
  collapsed custom-element DOM omitted false-valued `aria-expanded`; Native
  accessibility remains a separate certification boundary rather than being
  inferred from that browser projection.
- A wide follow-up used real keyboard input to filter 50 open PRs to one,
  opened that result, then selected Closed. The state change removed the detail
  dock and settled on 50 live closed PRs with no errors. A transient zero-row
  frame while the Closed list RPC was pending was rejected as timing noise.
- No P0/P1 product loss was found. Populated Web interaction remains missing
  because the isolated authority did not pass its hydration gate under
  agent-browser. Populated Native detail/tabs also remain uncertified; the
  earlier empty Native cell is not used as a proxy.
- Evidence:
  `shots/2026-08-15/pull-requests-populated-interactions/notes.md`.
