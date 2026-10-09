# Missing reply terminal-outcome verification

- Shared backend `62466`, thread `lynx-landing-thread-1787254540864-987357febecef`, light theme, `864x620` windows.
- Exact-owned Electron PID/window `9131/16379`; Native PID/window `11807/16391`.
- Real Electron input sent `Reply exactly: shared terminal outcome ok`.
- Durable events: user message `250`, turn-start request `251`, acknowledged running session `253` for `01a05348-fa02-7023-8829-dc516bede085`, watchdog failure activity `254`, terminal error session `255`.
- No provider runtime event was persisted for that turn during the 15-second first-event window.
- Both renderers retained the user message and showed `The provider accepted this turn but produced no runtime events. The session was stopped so you can retry safely.`
- Native updated through the shared cursor-safe shell stream invalidation path; its unreliable 500ms interval was not used as proof.
- Both retained PNGs are normalized exact-window captures at `1728x1240` (`864x620`, DPR 2).
