# Settings Profile Edit

Status: retained Lynx-for-Web and exact-owned Native functional evidence for
the Profile Edit flow and local persistence.

## Residual

Web exposes two top-level Profile actions: Share and Edit. Lynx only exposed
the older `Copy summary` action, with no way to edit the local display name,
handle, avatar color, or photo.

This slice closes the Edit half with real behavior. It does not relabel
`Copy summary` as Share or claim that PNG share-card export exists.

## Implementation

- Added a Web-matching Edit action with the exact central `pencil.svg` asset.
- Added a controlled Lynx dialog with draft-on-open and Save/Cancel semantics.
- Added display-name and username fields, handle normalization, eight avatar
  colors, avatar-photo upload/replace/remove, and inline errors.
- Reused the canonical Web storage keys:
  - `synara:profile:name:v1`
  - `synara:profile:handle:v1`
  - `synara:profile:avatarColor:v1`
  - `synara:profile:avatarImage:v1`
- Defaults persist as empty strings so server-derived name/handle and default
  avatar behavior remain live.
- Added a narrow `dialogsPickProfileImage` platform port:
  - Native opens a filtered image picker, rejects files over 10MB, decodes
    with `nativeImage`, scales the longest edge to at most 256px, and returns a
    PNG data URL.
  - Lynx-for-Web uses an isolated image file input and returns a data URL.
- Avatar images render through native Lynx `<image mode="aspectFill">`.

## Browser

The same isolated Synara service at `ws://127.0.0.1:58155`, trusted origin
`http://localhost:8998`, dark theme, comfortable density, and `1280x820`
DPR 1 were used.

- Edit action: `1063.546875,32,64.453125x28`, matching Web.
- Dialog: `390,197.5,500x425`.
- Eight color controls and Upload photo are present.
- Real rendered controls selected blue (`#3b82f6`) and activated Save.
- The dialog closed, the avatar changed to `rgb(59,130,246)`, and
  `synara.lynx.synara:profile:avatarColor:v1` stored `#3b82f6`.
- A full bundle reload retained the blue avatar and the exact Edit geometry.
- Connection diagnostics remained empty.

The retained post-reload frame is `lynx-web-persisted.png` at `1280x820`.

## Native

- Production bundle:
  `6da861672dcb4a2cb0c305eb686399faffad6b1f6d6f0fb6e9455538f25c147c`;
- read-only SQLite online-backup:
  `fc491cb6c3bb20a69d3661e4d351cf019b34da69d5682f1ba470d6c863f9ef38`;
- final cold-start root/child: `15271 -> 15276`;
- PID-derived DevTool target: `localhost:8902/session 1`;
- session URL:
  `file:///Users/bytedance/github/synara/apps/lynx/dist/desktop/main.lynx.bundle`.

Before restart, real DevTool touches performed:

1. Profile navigation;
2. Edit action;
3. blue color option;
4. Save.

The owned KV then contained the four canonical profile keys and blue
`avatarColor`. After a full owned-process restart using the same isolated state:

- avatar: `736,88,64x64`, `rgb(59,130,246)`;
- Edit action: `1063,32,65x28`;
- Profile action row: `408,32,720x28`;
- `TransportStatusRetry` count: zero;
- warning/error console: empty;
- raw frame: `2560x1640` at DPR 2.

`native/kv-after-restart.json` retains the isolated persisted state. The owned
app and `/tmp` state were removed after capture; `.p10-view*` remained
untouched.

## Verification

- Focused Profile Rstest: 1 file, 4 tests passed.
- Lynx-for-Web production build passed.
- Native/Desktop isolated-service production build passed with only existing
  encoder and optional `ws` warnings.
- Uncached changed-lines React Doctor against `6ddbdc6c` reported zero
  diagnostics.

## Remaining

Web Share renders a dedicated activity card to PNG, copies/saves the image,
and opens social composers. Lynx still exposes `Copy summary`; implementing
Share requires a real render/export kernel and remains a separate feature
slice.
