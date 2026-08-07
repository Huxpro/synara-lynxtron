# Responsive Settings Integrations evidence

- Date: 2026-08-07
- Runtime: current Lynx-for-Web production bundle staged under a same-origin
  isolated Synara Web harness.
- Data: two real repository projects were created through the canonical Web
  Create Project dialog, alongside the server-owned Home and Studio projects.
- State: Settings → Integrations, `Access all of Synara` turned off through
  the rendered switch to expose the real project selection grid.
- Theme/density: light / comfortable.
- Device pixel ratio: `1`.

## Web authority

The Web Integrations composition owns two responsive rules:

- connection name input: full width by default, `256px` from `sm=640`;
- project selection: one column by default, two columns from `sm=640`.

The Lynx adapter previously kept both values in their wide state at every
viewport: a fixed 256px input and unconditional two-column project cards.
Its route-owned form rows also stayed horizontal even though they are not
consumers of the generic `SharedSettingsRow` compact rule.

## After

At `600x820`:

- each custom Integrations row stacks copy and control vertically;
- the name input fills the available `270px` inner row width;
- Home, Studio, synara, and vue-lynx form one column of four `270x36` cards.

At `640x820` (`sm-up`):

- the name input returns to `256x32`;
- the project grid becomes two columns of `151x36`.

At `1024x820`:

- the existing wide row composition remains horizontal;
- the name input remains `256x32`;
- the grid uses two `269x36` columns.

Artifacts:

- `compact-600.json`, `compact-600.png`;
- `compact-640.json`, `compact-640.png`;
- `wide-1024.json`, `wide-1024.png`;
- `errors.txt`, `console.txt`, `bundle-hashes.txt`.

All PNG dimensions match their requested viewport. Page errors are empty.
Console output contains only host setup logs and the registered upstream
`@lynx-js/web-core` deprecated-initialization warning.

## Verification

- Integrations + responsive focused Rstest: `5/5`;
- Lynx-for-Web production build: pass;
- Native/Desktop production build: pass;
- React Doctor changed scope: `100/100`, zero diagnostics.

The named browser sessions, `58122/9001` processes, staged `/lynx` assets, and
temporary isolated home were removed after capture.
