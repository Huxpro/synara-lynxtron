# Empty Editor Chat rail at compact and short heights

## Newly discovered scope

A canonical empty Thread was opened in Editor at `320x200`, `320x568`,
`800x568`, and `1280x820`. Existing Editor compact evidence covered populated
Files/Changes and Chat visibility, not the empty Chat rail composition.

## P1 losses

At `320x200` before:

- Editor body: `154px` high;
- center: `96.25px`;
- Chat rail: only `57.75px`;
- duplicate Chat header consumed `46px`;
- hero extended to `y=241.5`;
- composer was `y=241.5..336.5`, entirely unreachable.

At `320x568`, the same empty rail still overflowed:

- Chat rail: `y=372.25..568`;
- header: 46px;
- hero: 216px;
- composer: `y=574.63..669.63`.

At `800x568`, provider banner added another 80px and composer ended at
`y=580.63`.

Loss accounting:

- `lynx-editor-short-empty-chat-unreachable`: P1 `1.00 -> 0.00`;
- `lynx-editor-compact-empty-chat-unreachable`: P1 `1.00 -> 0.00`;
- `lynx-editor-medium-empty-chat-overflow`: P1 `1.00 -> 0.00`.

## Root fix

- Short-height Editor uses equal center/Chat rows.
- Short-height Chat rail hides duplicate header, hero, context tray, and
  provider banner; it uses the short Thread 20px composer editor and 8px
  transcript inset.
- Compact/medium Editor Chat hides the redundant empty hero/context tray.
- Compact/medium Editor Chat hides the provider banner where needed; wide
  retains the full composition.

## After evidence

`320x200`:

- center/chat: `77px / 77px`;
- header/hero/banner hidden in Chat rail;
- composer: `248x62 @ (60,130.5)`, bottom `192.5`.

`320x568`:

- Chat rail: `195.75px`;
- hero/banner hidden;
- header retained;
- composer ends `y=540.63`, inside the rail.

`800x568`:

- Chat rail: `195.75px`;
- hero/banner hidden;
- header retained;
- composer ends `y=540.63`.

`1280x820` wide retains header, 80px provider banner, 146px hero, and normal
95px composer.

## Verification

- Editor + empty Thread suites: `12/12`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Fixture was created and removed through canonical commands.
- No screenshot retained; local count remained `100`.
