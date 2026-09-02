# Current transcript pinned and detached recapture

Status: retained Electron and Lynx-for-Web evidence. This is a Browser fast-loop
cell, not Native certification.

## Identity

- Thread: `lynx-landing-thread-1787254540864-987357febecef`.
- Route: the same thread route in Electron and Lynx-for-Web.
- Backend: the Electron desktop bridge and Lynx relay both used
  `ws://127.0.0.1:54095/`; the retained Lynx diagnostics record server instance
  `9240f5bd-66ad-4e46-8f05-9f739b614103`.
- Theme/state: light, same provider-update dialog, same provider-runtime error
  banner, same 11-message transcript, sidebar open, dock closed.
- Viewport: `864x620`, DPR 2; all four PNGs are `1728x1240`.
- Lynx-for-Web bundle SHA-256:
  `8886c4b8e2894f90707bdfd4e876f085f1a04adaf733cb7ce2b2df501df5729c`.
- Read-only state snapshot SHA-256:
  `1ae63d69c298c877dbb8e882ff6c14eff791dc575bc60fa59370b63346cd753e`.
- No message, thread, provider, database, or persisted setting was mutated.

## States and result

Pinned:

- Electron transcript: `scrollTop=344`, `clientHeight=402`,
  `scrollHeight=746`; no jump control.
- Lynx-for-Web transcript: `scrollTop=526`, `clientHeight=371`,
  `scrollHeight=897`; no jump control.
- Whole-frame RGB MAE: `2.2276836697940823%`, down from the archived
  `8.08137092997768%`.

Detached:

- Electron transcript: `scrollTop=0`; the real `Scroll to bottom` control is
  mounted.
- Lynx-for-Web transcript: `scrollTop=0`; the same named control is mounted.
- Whole-frame RGB MAE: `2.263906763671219%`, down from the archived
  `6.653651437709229%`.

The retained images replace the four old 2026-08-02 transcript-scroll images.
The old pair remains available in Git history and remains scored over its
historical interval.

## Fidelity fix found by the recapture

The first detached Lynx-for-Web frame exposed an empty circular jump control.
The shared React SVG node existed, but Web Core resolved its `currentColor`
stroke to `none`, leaving every path unpainted. The transcript now consumes the
generated Lynx icon adapter, which supplies a colorized SVG through the native
`content` path. The final DOM contains explicit `stroke="#0d0d0d"`, and the
final screenshot visibly contains the same downward arrow as Electron.

## Verification

- Focused transcript jump test: `2/2`.
- ReactLynx best-practices scan: zero issues in `Transcript.tsx`.
- Endpoint-pinned Lynx-for-Web production build: passed.
- Electron and fresh Lynx-for-Web page-error buffers: empty.
- Lynx relay socket state: open; transport and RPC errors: null.
- Browser cleanup gate: no sessions and no owned browser processes.

Electron's renderer-local jump flag remained stale after its scroll owner was
returned to the exact live-edge geometry. The retained pinned frame predates
that setup change and is valid; the restoration residual is recorded rather
than copied into Lynx or treated as backend state.
