# Native DevTool Registration Restored

## Blocker

The previous exact-owned Native preflight launched a healthy Synara process
with `SYNARA_ENABLE_DEVTOOL=1`, but:

- no PID-owned DevTool listener appeared;
- no `@synara/lynx` client or Lynx session appeared;
- the host logged
  `LynxViewStateObserver not found in registry`.

This blocked Native DOM, console, screenshot, and interaction certification.
The result was correctly classified as harness missing coverage rather than a
Native product result.

## Root cause

The installed stable Lynxtron `0.0.9` host contained only:

`LynxResources.bundle`

It did not contain the inspector build output:

`LynxDebugResources.bundle/Contents/Resources/lynx_core_dev.js`

Lynxtron creates `LynxViewStateObserver` through its global delegate registry.
Without the inspector artifact, calling `devtool.setDevToolEnabled(true)` cannot
register that delegate.

The latest stable `0.0.10` package was checked in an isolated install and had
the same missing resource. `0.0.12-dev` is the first currently published host
artifact that includes `LynxDebugResources.bundle`.

The `0.0.9` and `0.0.12-dev` npm tarballs have identical JS and TypeScript API
surfaces; package metadata differs only in version. The functional change is
the downloaded host artifact.

## Installation contract

The workspace-local `apps/lynx/package.json#allowScripts` configuration was
not honored by Bun workspaces. Fresh minimal installs proved:

- workspace `allowScripts`: host postinstall did not run;
- root `allowScripts`: host postinstall did not run;
- root `trustedDependencies`: host postinstall ran and installed the inspector
  runtime.

The fix therefore:

- upgrades only `@lynx-js/lynxtron` to `0.0.12-dev`;
- leaves `lynxtron-builder` and `lynxtron-dev-plugins` at `0.0.9`;
- moves Lynxtron/Builder/Windows-installer lifecycle trust to root
  `trustedDependencies`;
- removes the ineffective workspace `allowScripts`;
- adds a prebuild runtime verifier for the executable and inspector resources.

A fresh temporary Bun workspace using the committed root trust configuration
automatically installed the executable and `LynxDebugResources.bundle`.

## Exact-owned workspace certification

An isolated `900x650` production launch used:

- current staged `apps/lynx/dist/desktop`;
- `NODE_ENV=production`;
- `SYNARA_ENABLE_DEVTOOL=1`;
- isolated server state and Native user data;
- exact-owned process groups.

The owned Lynxtron PID exposed a dynamic listener and matching client:

- listener/client: `localhost:8903`;
- session: `1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`;
- DOM: `DOM.getDocument` returned a tree containing `SliceRoot`;
- console warning/error query: `[]`;
- LynxView screenshot: JPEG `1800x1300`, the DPR 2 rendering of `900x650`;
- app log: no `LynxViewStateObserver not found in registry`.

The DevTool listener was resolved from the exact-owned PID and `lsof`, never
from a remembered port or list order.

## Packaged-app certification

`bun run pack` completed with `lynxtron-builder@0.0.9` consuming the
`0.0.12-dev` host:

- generated DMG: approximately `55MB`;
- packaged app included `LynxDebugResources.bundle`;
- packaged app included the current staged Native bundle;
- workspace, staged, and packaged bundle SHA-256:
  `c82671de96a9a907701b06741e3069386a8c9158b89d518fa08ed7b2ca157578`.

The packaged app was then launched directly from
`dist/mac-arm64/Synara Lynx.app`, not through the workspace host. PID-derived
client matching again proved:

- dynamic listener/client: `localhost:8903`;
- session: `1`;
- DOM contains `SliceRoot`;
- console warning/error query: `[]`;
- screenshot: JPEG `1800x1300`;
- no observer-registry error.

The first packaged probe incorrectly filtered clients by the workspace package
name and rejected a healthy product-name client. That harness failure was not
reported as a product regression. The retained probe matched listener ports
from the owned process group, which is the certification authority.

## Classification

- `native-medium-devtool-registration`:
  harness missing coverage `1.00 -> 0.00`;
- product-loss contribution:
  `0.00 -> 0.00`;
- Native medium DOM/console/screenshot certification surface:
  restored;
- pre-release host dependency:
  explicit residual risk, bounded by exact version pinning, fresh-install
  verification, prebuild runtime verification, workspace certification, and
  packaged-app certification.

This closes the harness blocker; it does not retroactively certify every
previously blocked Native product state. Those cells remain work for subsequent
Native fidelity loops.

## Verification

- runtime verifier unit tests: `4/4`;
- Native capture helper tests: `4/4`;
- Sharp staging test: `1/1`;
- connection preflight tests: `2/2`;
- Native/Desktop production build: passed;
- packaged DMG build: passed;
- exact-owned workspace client/DOM/console/screenshot: passed;
- exact-owned packaged client/DOM/console/screenshot: passed.

All exact-owned server/app process groups were stopped. Ports `58090`,
`8903`, and `8904` were released. Unrelated existing `8901` and `8902` clients
were not touched. Browser entry/failure/exit gates reported `sessions: []` and
zero agent-browser-owned processes. Temporary screenshots were deleted and the
repository screenshot count remained `100`.
