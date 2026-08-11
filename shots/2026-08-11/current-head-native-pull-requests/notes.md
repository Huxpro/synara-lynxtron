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
