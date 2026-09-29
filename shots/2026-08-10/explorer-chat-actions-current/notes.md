# Explorer whole-file chat actions current-head evidence

- Isolated server `ws://127.0.0.1:58930`, trusted Lynx-for-Web origin
  `http://127.0.0.1:9564`, server instance
  `ad9cd59e-f8d8-481a-b583-265902a57d72`.
- Project and three threads were created through canonical orchestration
  commands. Files lived under `/tmp/synara-explorer-actions`; SQLite was never
  edited directly.
- The selected-file header is 40px high. Light and dark action cells use the
  same header/content geometry at `1280x820`, DPR 1.
- `More actions` opens a visible 208px popup anchored below the 28px trigger.
  The real accessibility snapshot exposes `Reference in chat` and
  `Ask why this changed` as `menuitem` controls.
- The light fresh thread began with an empty composer. Activating
  `Reference in chat` through the rendered `menuitem` changed it to
  `@src/action.ts`.
- The dark fresh thread began with an empty composer. Activating
  `Ask why this changed` changed it to
  `Why did we implement @src/action.ts this way? Check the git history if
needed and explain the reasoning.`
- `drafts.json` proves both drafts persisted structured mention metadata
  `{ "name": "action.ts", "path": "src/action.ts" }`.
- Fresh page errors are empty. Console output contains only the known Lynx Web
  initialization deprecation warning.
- Exact-owned Native production PID `36935` loaded the final
  `apps/lynx/dist/desktop` bundle at `synara://thread/thread-actions...` and
  connected only to `58930`. Native menu input is not claimed because no exact
  DevTool client interaction was available.
- The compatibility layer only opens/positions the Lynx-for-Web menu. Menu
  actions remain the real Lynx Menu items; Native retains the original trigger
  and item event path.
