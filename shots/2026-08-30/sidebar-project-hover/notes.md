# Sidebar project row hover parity

- Shared backend: `49549`; thread: `lynx-landing-thread-1787254540864-987357febecef`; theme: light; requested window: `864x620`.
- Electron source target: CDP `10230`; Native exact-owned Lynxtron 0.0.16 PID/window `67710/17333`. Unrelated PID `37522` was not touched.
- Electron evidence was captured from its exact CDP page because Computer Use resolved the duplicate Electron bundle ID to an older window. Native interaction/evidence used Computer Use plus exact window capture; the channels are intentionally not conflated.
- Verified visual state: resting folder/title/status; hovered rounded row; folder-to-pin swap; source-ordered PR, terminal, and new-chat actions; sibling project card with folder/title/pin, `1 chat`, abbreviated `~/github`, separators, and `Edit project`.
- `electron-resting.png`, `electron-hover.png`, and `electron-hover-crop.png` are CDP captures. `lynx-hover.png` and `lynx-hover-crop.png` are normalized exact-window captures at `1728x1240` / `1020x430`.
- Focused Rstest: 19/19 passed. ReactLynx best-practices scan: 0 issues. Lynx/Desktop production build: passed.
- Final staged bundle SHA-256: `96e24c08e485e432e3696593e0168d9aec564e1f98ff0c0c5c2560e4f0bd2115`.
- Remaining interaction evidence: Computer Use can now trigger the project-row hover, but moving from the row into the card did not reliably dispatch Native `mouseleave`; therefore the row-to-card dismissal/non-interception cell is not marked complete.
