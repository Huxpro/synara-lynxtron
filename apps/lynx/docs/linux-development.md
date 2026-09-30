# Developing the Lynx client on Linux

Lynxtron publishes a Linux x64 runtime, but it only supports **windowless**
`LynxWindow`s: there is no native window, and the stock runtime discards the
rendered frames. Everything else — the Node host (`src/main/desktop`), the
Lynx engine, layout, events and DevTool — runs normally. This guide covers the
three loops that work on Linux today, from fastest to most faithful.

| Loop                               | Renderer                     | See it                      | Drive it                          |
| ---------------------------------- | ---------------------------- | --------------------------- | --------------------------------- |
| `bun run dev:web` (HMR)            | Lynx for Web in a browser    | the browser                 | mouse/keyboard, Playwright        |
| `linux-dev.mjs native` (stock)     | native Lynx (Clay, software) | DevTool screencast          | DevTool (`native-devtool.mjs`)    |
| `linux-dev.mjs native` (presenter) | native Lynx (Clay, software) | X11 window (Xvfb or a desktop) | mouse/keyboard, xdotool, DevTool |

## Prerequisites

```sh
# Runtime libraries the stock Lynxtron runtime loads (EGL via Mesa).
sudo apt-get install -y libegl1 libgles2 libgl1-mesa-dri
# Headless display + tooling for screenshots and input (optional on a desktop).
sudo apt-get install -y xvfb xdotool x11-apps imagemagick
# Desktop services used by a Lynxtron runtime with the Linux presenter.
sudo apt-get install -y xdg-utils libglib2.0-bin zenity xclip libnotify-bin
```

`bun install` downloads `lynxtron-v<version>-linux-x64-devtool.zip` into
`node_modules/@lynx-js/lynxtron/dist/devtool/lynxtron`.

Every loop talks to a Synara backend on `ws://127.0.0.1:58090`:

```sh
cd apps/lynx
node scripts/linux-dev.mjs server                       # trusts http://localhost:8080
node scripts/linux-dev.mjs server --origin http://127.0.0.1:8090   # another web origin
```

The server only accepts browser WebSocket upgrades from its `--dev-url` origin,
so pass the origin you open the web build from. Native Lynxtron connects
without a browser origin and is always accepted. State lives in
`apps/lynx/.runtime/linux-dev/` (gitignored).

## Loop 1 — Lynx for Web with HMR

```sh
node scripts/linux-dev.mjs server
bun run dev:web            # http://localhost:8080
```

Edits under `src/` and the shared `apps/web` compositions hot-update the page.
This is the fastest UI loop, but it is the comparison renderer: native-only
behavior (text shaping, `<list>`, textarea editing, host ports) must be checked
natively.

> The rspeedy HMR socket connects to the machine's LAN address. If your browser
> goes through an HTTP proxy, exclude that address (or start Chromium with
> `--no-proxy-server`), otherwise updates never arrive.

## Loop 2 — native Lynxtron with the stock runtime

```sh
bun run build                          # or: bunx rspeedy build --environment lynx && bunx rsbuild build --environment desktop
node scripts/linux-dev.mjs server
node scripts/linux-dev.mjs native --background
node scripts/native-devtool.mjs texts                 # the rendered text, in tree order
node scripts/native-devtool.mjs tap Settings          # tap the element showing "Settings"
node scripts/native-devtool.mjs tap-label "Message composer"
node scripts/native-devtool.mjs type "hello"          # insert text into the focused input
node scripts/native-devtool.mjs screenshot out.png    # native frame via DevTool screencast
node scripts/linux-dev.mjs stop
```

On Linux the desktop host creates a windowless `LynxWindow` at 1x
(`resolveShellWindowChrome`) and falls back to a virtual work area because the
stock runtime has no `screen` implementation (`resolveShellWorkArea`).
`native` enables DevTool, so the screencast returns the real native frame even
though the runtime never presents it anywhere.

Stock-runtime limits: no visible window and no OS input (drive it through
DevTool); `dialog.show*Dialog` resolves as canceled; `shell.openExternal`,
`openPath` and `trashItem` fail; `clipboard` reads empty and drops writes;
`Notification.isSupported()` is `false`.

## Loop 3 — a Lynxtron runtime with the Linux presenter

A Lynxtron build that implements the Linux presenter (software frames
presented into an X11 window, X11 pointer/wheel/key input forwarded to Lynx,
a `display::Screen`, and freedesktop-tool backed dialogs, shell, clipboard and
notifications) is a drop-in replacement for the stock runtime. This is a
**local** Lynxtron patch, not an upstream feature; point the harness at it:

```sh
LYNXTRON_BIN=/path/to/lynxtron/out/Release/lynxtron node scripts/linux-dev.mjs native
```

Without `$DISPLAY` the harness starts `Xvfb :97`; on a desktop session the
window opens on your display. The presenter also writes each frame to
`.runtime/linux-dev/frame.ppm`, which `native-devtool.mjs screenshot` uses when
no DevTool session is available. Drive it like any X11 app, e.g.
`DISPLAY=:97 xdotool mousemove 64 797 click 1`.

Runtime switches understood by the presenter:

| Variable                        | Effect                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| `LYNXTRON_FRAME_DUMP=<file>`    | write the latest frame as a binary PPM (set by the harness) |
| `LYNXTRON_LINUX_RENDERER=noop`  | discard frames like the stock runtime                       |
| `LYNXTRON_SCREEN_SIZE=WxH`      | size of the virtual display reported to `screen`            |
| `LYNXTRON_SWAP_RB=1`            | swap red/blue if a platform's pixel order differs           |
