# Current-head complete Models proof

## Gap found

The previous Lynx Models route rendered only `Generation defaults`. Web also
owns a real `Custom models` workflow with provider selection, slug validation,
add/remove/reset, and immediate integration into the Git writing picker. This
was a missing product surface, not merely a visual residual.

## Implementation

- Validation moved to `@synara/shared/customModels`; Web and Lynx now use the
  same normalization and error messages.
- Lynx reads canonical `server.getSettings` provider `customModels` arrays and
  persists `server.updateSettings` provider patches.
- Eight providers match Web's editable set; Droid remains excluded because its
  ACP catalog rejects unknown slugs.
- Provider menu, native input confirmation, Add, validation, saved rows,
  per-row Remove, and Reset are real rendered controls.
- Successful updates refresh the shared `server-settings` query and parent Git
  writing options immediately.

## Real interaction proof

Through the rendered Lynx-for-Web UI:

1. An empty Add produced `Enter a model slug.`, proving the real validation
   path.
2. The native custom-element input received
   `trae-fidelity-temp-model`.
3. Clicking rendered Add persisted a Codex saved row.
4. Opening the rendered Git writing menu immediately showed
   `Codex / trae-fidelity-temp-model`.
5. Clicking the saved row's rendered Remove action removed the row and picker
   option.
6. A filesystem search and final settings projection showed no temporary slug
   remaining.

No SQLite fixture or direct settings-file write was used.

## Final geometry

The empty editor now matches Web exactly:

| Anchor             |               Web | Lynx-for-Web |
| ------------------ | ----------------: | -----------: |
| Generation section | `456/118/624/112` |        exact |
| Generation card    |  `456/150/624/80` |        exact |
| Git writing row    |  `457/151/622/78` |        exact |
| Custom section     | `456/254/624/159` |        exact |
| Custom card        | `456/286/624/127` |        exact |
| Custom row         | `457/287/622/125` |        exact |
| Editor             |  `469/353/598/49` |        exact |
| Provider trigger   |  `469/372/144/28` |        exact |
| Input              |  `621/372/369/28` |        exact |
| Add                |   `998/370/69/32` |        exact |

## Evidence

- `models-web-empty-1280x820-light.png`: current Web authority.
- `models-lynx-empty-1280x820-light.png`: initial missing-section state.
- `models-lynx-saved-1280x820-light.png`: real temporary saved model row.
- `models-lynx-empty-final-1280x820-light.png`: final restored current state.
- All PNGs are exactly `1280x820`; browser page errors were empty.

## Gates

- Shared custom-model tests: 1 file, 2/2.
- Web Models tests: 1 file, 2/2.
- Lynx Models/navigation tests: 3 files, 15/15.
- Web, Lynx-for-Web, and Native/Desktop production builds passed.
- Final bundles: Web `ecb93a6e…`, Lynx-for-Web `e8a2aceb…`, Native
  `9768fe07…`.
- `bun fmt`, `bun lint`, and `bun typecheck` remain unauthorized.
