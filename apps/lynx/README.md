# @synara/lynx

Lynxtron desktop client for Synara. This app lives in the main Synara
workspace so its ReactLynx adapters and the canonical Web compositions change
atomically.

## Architecture

- `src/app` owns the memory-history router and six product surfaces.
- `src/adapters` maps physical-shared Web compositions to Lynx elements.
- `src/components` contains the bounded Native islands: transcript list,
  Markdown, textarea Composer, Sidebar host controller, and Lynx UI primitives.
- `src/platform` contains storage, socket, clipboard, dialog, timer, motion,
  and accessibility announcement ports.
- `src/main` contains the Lynxtron desktop/Web hosts.
- `lynx.config.ts` resolves `@synara-web` and `~` directly to
  `../web/src`; shared model sources resolve to `../../packages/shared`.
  No sibling-repository alias or copied Web JSX is used.

The migration SSOT, audit scripts, historical evidence, and screenshots remain
in the adjacent `synara-lynx` control-plane repository. Historical notes under
`docs/` describe the compiler probes and packaging gates that established the
current implementation. See
[`docs/lynxtron-runtime-compatibility.md`](docs/lynxtron-runtime-compatibility.md)
for the current runtime version, vendor-patch inventory, Synara-side
workarounds, and the 0.0.21 regression status.

## Commands

Run from this directory:

```sh
bun run dev
bun run build
bun run test -- <test files>
bun run start
bun run pack
```

Never use `bun test`; it bypasses the configured Rstest command.

## Product boundaries

- Web composition, copy, ordering, tokens, and state semantics remain the
  canonical source.
- Native `<list>`, scroll ownership, Markdown rendering, textarea editing,
  platform ports, and host Elements adapters are explicit platform splits.
- Terminal, browser, and PDF remain first-release placeholders/hard islands;
  this app does not imitate unavailable runtimes.
- Lynxtron 0.0.21 still does not expose Lynx content as macOS accessibility
  children, so application accessibility semantics are verified independently
  from the host screen-reader gap.
