# Sidebar Projects empty-state rhythm

Status: retained current-head Web/Lynx-for-Web and exact-owned Native evidence.

## Residual

The preceding Chats hitbox slice exposed a separate vertical anatomy mismatch.
The label positions looked close, but the empty Projects group and the
following Chats section did not consume the same layout primitives as Web:

- Lynx primary navigation added a private 4px bottom margin.
- Lynx Projects root omitted Web's 6px top/bottom group padding.
- Web empty state uses 12px/18px text with 16px top padding; Lynx used
  11px/native line height with an 18px margin.
- Web Chats root owns 4px top and 8px bottom padding; Lynx used an 8px top
  margin with no retained bottom anatomy.

The private values partly cancelled one another, leaving Chats approximately
7px above the Web authority while the Projects group was 15px shorter.

## Fix

The Lynx adapter now consumes the same section anatomy:

- primary navigation: `4px 6px 6px`, no private bottom margin;
- Projects/Studio root: 6px on all sides;
- Projects state: `padding: 16px 8px 0`, `12px/18px`;
- Chats root: `padding: 4px 6px 8px`.
- The collapsed disclosure keeps its 4px body shell mounted while unloading
  its children, matching Web's `pt-1` motion anatomy without retaining hidden
  rows.

The prior horizontal hitbox correction remains intact: Chats is
`x=6, width=244, height=28` with 8px internal horizontal padding.

## Browser result

At `1280x820`, DPR 1, light, comfortable, New Chat:

- primary nav: `0,87.25,256x158`;
- Projects root: `0,245.25,256x82`;
- Projects header: `6,255.25,244x28`;
- empty state: `6,287.25,244x34`, `12px/18px`;
- Chats root: `0,327.25,256x44`;
- Chats button: `6,331.25,244x28`.

Final Lynx-for-Web matches all Projects and Chats boxes and their internal
distances exactly:

- header to empty: 4px;
- empty to Chats button: 10px;
- Projects root to Chats button: 86px.

The retained Lynx screenshot was captured after a bundle reload and therefore
also shows the real provider-status banner. That banner changes landing-body
placement but does not change Sidebar geometry; it is not used as landing
fidelity evidence.

## Native result

- Production bundle:
  `9fe0a2c065b8688c364931803bfe0a509d543dcf69e70a7715be01b70188f06c`.
- Snapshot online backup:
  `423e33f197aee3aff46a4dbeab531d66a4bc40c4718847974fbb1ccf68721baa`.
- Owned launch root/child: `91369 -> 91374`.
- PID-derived DevTool target: `localhost:8901/session 1`.
- Session URL points to the exact staged Synara bundle.
- Native logical geometry:
  - primary nav `0,86,256x160`;
  - Projects root `0,246,256x82`;
  - Projects header `6,256,244x28`;
  - empty state `6,288,244x34`, `12px/18px`;
  - Chats root `0,328,256x44`;
  - Chats button `6,332,244x28`.
  - collapsed Chats body `6,356,244x4`, with no retained children.
- Internal distances are exactly 4px, 10px, and 86px.
- Warning/error console: empty.

Native rounds the fractional Browser coordinates to whole logical pixels while
preserving the exact internal anatomy.

An earlier valid capture transaction ran while a concurrent
`another-project` client occupied 8901. The PID-derived gate correctly chose
the owned Synara client on 8902 and did not touch 8901. The final retained
capture above ran after that unrelated client exited.

## Host boundary

Web's browser fallback sidebar header is 48px. Exact Native/Electron
hidden-titlebar chrome is intentionally 46px and was previously certified.
This creates an overall 2px host-relative offset above the shared sections,
but does not change the Projects/Chats internal geometry. No local row offset
or Native titlebar regression was introduced.

Focused Sidebar tests pass 3/3. Lynx-for-Web and Native/Desktop production
builds pass with only the existing encoder and optional `ws` warnings.
