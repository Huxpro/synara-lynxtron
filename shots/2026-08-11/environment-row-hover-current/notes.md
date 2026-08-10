# Environment row hover current-head fidelity

- Shared isolated server: `ws://127.0.0.1:58980`.
- Shared origin: `http://127.0.0.1:10113`.
- Canonical project/thread records were created through
  `orchestration.dispatchCommand`.
- The workspace is a real Git repository on `main` with one modified tracked
  file and one untracked file. Both clients load the resulting
  `Changes +2 / -0` state through the product Git status path.
- Web opens Environment through the rendered header toggle. Lynx-for-Web uses
  the supported `environment=open` deep-link initial state because its current
  Web Elements click publication boundary is separately registered.
- Named sessions use `1280x820`, DPR 1, and explicit light media.
- Changes and Editor view rows are exactly `274x26` in both clients. The
  Changes row is at `987/175` in both final sessions.

## Residual and repair

Before repair, the Lynx Environment Changes, Editor view, and repository rows
used `--accent`. The generated Native light theme resolves that token to blue
`rgb(232,242,250)`, while Web uses the neutral
`--color-background-elevated-secondary` hover surface.

All ordinary Environment interaction owners now use Web's semantic token:
header toggle/settings, Changes, branch/Git actions and file selection, local
servers, Editor/repository/PR rows, instructions, pinned actions, and
disclosures. The recap skeleton intentionally keeps `--accent` as a passive
loading fill.

The final representative Changes hover resolves identically in both clients:

- box: `987/175/274x26`;
- background: `rgba(13,13,13,0.04)`;
- foreground: `rgb(13,13,13)`.

The ASCII hyphen in Web's deletion count and the typographic minus in Lynx are
existing renderer text identities; the numeric state and geometry match.

Focused Environment tests pass 6/6. Lynx-for-Web and Native/Desktop production
builds pass with the existing known CSS and optional `ws` accelerator warnings.
Page-error files are empty; the Lynx console contains only the named upstream
Web Elements initialization warning.
