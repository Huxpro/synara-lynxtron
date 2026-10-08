# Lynxtron Application — Agent Guide

This document equips AI agents to author and modify code in this Lynxtron application quickly and safely. It explains the architecture, file layout, commands, and code patterns that work well with Lynx + NodeJS.

## Learning Resources

Read the docs below in advance to help you understand the library or frameworks this project depends on.

- Lynx: [llms.txt](https://lynxjs.org/llms.txt).
  While dealing with a Lynx task, an agent **MUST** read this doc because it is an entry point of all available docs about Lynx.

## Overview

- Lynxtron is an Electron-like runtime where `BrowserWindow` is replaced by `LynxWindow`.
- This project also supports Web (browser) via a Symmetric Host paradigm.
- UI is built with Lynx via ReactLynx (`@lynx-js/react`) using lowercase built-in elements such as `<view>`, `<text>`, `<image>`.
- **Symmetric Host Model**: Both Desktop and Web provide a consistent set of Native Modules to the UI.
  - `NativeModules.bridge`: Handles host-specific capabilities (dialogs, window control) via RPC.
  - `NativeModules.nodejs`: Provides a Node.js-like environment for background logic, injected directly into the Lynx Background Thread for maximum performance and object-level access.

## Project Layout

- `src/app`: Lynx UI layer built with ReactLynx
  - Entry: `src/app/index.tsx` renders `<App />` with `root.render`.
  - UI: `src/app/App.tsx` uses Lynx built-in elements and CSS.
- `src/main`: Host process logic
  - `src/main/desktop/`: Desktop (Node.js) host implementation.
    - `main.ts`: Main process entry (window management).
    - `preload.ts`: Logic injected into the Lynx thread (Node.js environment).
  - `src/main/web/`: Web (Browser) host implementation.
    - `web-host.ts`: Browser entry point using `@lynx-js/lynxtron/web-host`.
    - `nodejs_adapter_web.ts`: Web adapter simulating Node.js capabilities in the Lynx Background Worker.
- Config: `lynx.config.ts` (RSpeedy) and `rsbuild.config.ts` (Host builder).

## Common Patterns

### Calling Native Capabilities

Always use the unified `NativeModules` API to ensure cross-platform compatibility.

```typescript
// Unified call for both Desktop and Web
NativeModules.bridge.request({ method: "showDialog", params: { message: "Hi" } });

// Background logic (runs in the same JS thread as Lynx logic)
// Use exposed to access capabilities exported by host preload scripts
NativeModules.nodejs.exposed.echo("Hello", (res) => {
  console.log(res); // Hello
});
```

## Commands

This app is a workspace of the Synara monorepo. Install with `bun install` at the repository root, then run from this directory:

- Dev (Desktop): `bun run dev`
- Build (Desktop): `bun run build`
- Start (Desktop): `bun run start`
- Dev (Web): `bun run dev:web`
- Build (Web): `bun run build:web`
- Start (Web): `bun run start:web`
- Type-check: `bun run typecheck`
- Test: `bun run test -- <files>` (Rstest; never `bun test`), and `bun run test:scripts` for the `node:test` suites under `scripts/`

`bun run start` connects to `SYNARA_WS_URL`, or `ws://127.0.0.1:58090` by default, and shows the app offline when no Synara server is there. To run it against real data next to the Electron reference, use `bun run compare:desktop` from the repository root. The root `AGENTS.md` describes that launcher and the verification loop built on it.

## Read before changing runtime-sensitive code

- [`docs/lynxtron-runtime-compatibility.md`](docs/lynxtron-runtime-compatibility.md): the pinned runtime version, the vendor patch, and every Synara-side workaround with its removal condition.
- `plan/`: the migration plan, decisions, and the Lynx patterns log (`plan/04-lynx-patterns.md`).

## Authoring UI (ReactLynx)

UI code in `src/app` runs in the Lynx engine, which is **not a browser**.

- **React-like but different**: Use `@lynx-js/react`.
- **Built-in Elements**: Use **lowercase** Lynx elements. DO NOT use HTML elements like `div`, `span`, `button`.
  - `<view>`: Container (like `div`).
  - `<text>`: Text (like `span`).
  - `<image>`: Image (like `img`).
  - `<scroll-view>`: Scrollable area.
  - `<list>`: High-performance list.
- **Event Model**: Standard Web events like `onClick` or `onChange` are NOT supported.
  - Use `bindtap` instead of `onClick`.
  - Use `bindinput` instead of `onChange`.
  - Events follow the pattern `bind<event_name>`.
- **CSS / Styling**:
  - Lynx uses a subset of CSS.
  - **Flexbox** is the primary layout engine (similar to React Native).
  - Use `className` for styling.
  - No CSS selectors like `:hover`, `nth-child`, or complex combinators.
- **No DOM/BOM APIs**: `window`, `document`, `location`, `localStorage` are NOT available.
  - Use `NativeModules.bridge` for host interactions.
  - Use `NativeModules.nodejs` for background logic and data persistence.
- **Main thread vs background thread**:
  - ReactLynx compiles `src/app` twice. The main thread renders the first screen from precompiled bytecode; the background thread runs effects, event handlers, and `NativeModules` calls.
  - Code that only works on the background thread must stay inside handlers and effects, not at module scope. A module-level `background-only` import breaks every screen that reaches it.
  - A bundle can compile and still fail to load or paint. After a dependency or build-config change, launch the app and read the DevTool console.

### UI Example

```tsx
import { useState, useCallback } from "@lynx-js/react";

export function MyComponent() {
  const [count, setCount] = useState(0);

  const handleTap = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  return (
    <view className="container">
      <text className="title">Count: {count}</text>
      <view className="button" bindtap={handleTap}>
        <text className="button-text">Increment</text>
      </view>
    </view>
  );
}
```

## Local Type Definitions

Inspect local types for exact API surfaces:

- `node_modules/@lynx-js/lynxtron/apis/lynxtron.d.ts`
- `node_modules/@lynx-js/lynxtron/apis/web-host.d.ts`
