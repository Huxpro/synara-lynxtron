# Markdown fidelity — paired browser harness

## Authority and state

- Date: 2026-08-02
- Viewport: 1280×820, DPR 1
- Data: isolated server `127.0.0.1:62190`, sequence 174, thread
  `thread:1785617357970-wy83hd92` (`Draft seed task`)
- Web authority: `http://127.0.0.1:5734/thread:1785617357970-wy83hd92`
- Lynx-for-Web: `http://127.0.0.1:63211/`, same server/snapshot/thread
- Formal App/Lynxtron was not launched. Both captures used named background
  `agent-browser` sessions.

## Before

- Lynx rendered assistant code as a plain rounded text slab without the Web
  language/file header or wrap/copy actions.
- User transcript rows bypassed Markdown, so composer `$skill`, mention and URL
  token presentation could not survive into the sent transcript.
- The final message sat about 21.5px above the composer because Lynx omitted the
  Web timeline's 64px footer plus 16px desktop list padding.

Evidence: `before/web-1280x820.png`, `before/lynx-1280x820.png`.

## After measurements

Light, final JavaScript block and composer:

| Surface            | Web          | Lynx-for-Web | Delta         |
| ------------------ | ------------ | ------------ | ------------- |
| Code block x/y     | 399 / 463.89 | 407 / 466    | +8 / +2.11 px |
| Code block w/h     | 728 / 140.69 | 728 / 143    | 0 / +2.31 px  |
| Code block bottom  | 604.58       | 609          | +4.42 px      |
| Composer x/y       | 400 / 709    | 408 / 709    | +8 / 0 px     |
| Composer w/h       | 736 / 95     | 736 / 95     | 0 / 0 px      |
| Block→composer gap | 104.42       | 100          | -4.42 px      |

The code surface uses the same 11px / 16.5px code typography, 10px-class
radius, semantic background, header/action anatomy and 728px width. Fenced code
normalizes the trailing newline because Web `react-markdown` preserves it while
the Lynx mdast value does not; Lynx derives a minimum text height from that same
copy string instead of inserting an invisible display character.

Evidence:

- light: `after/web-1280x820.png`, `after/lynx-1280x820.png`
- dark token pass: `after-dark/web-1280x820.png`,
  `after-dark/lynx-1280x820.png`

## Interaction and state checks

- Real coordinate pointer activation changed the final code action from
  `Copy code` to `Copied`; the Web relay clipboard handler completed using its
  harness-local fallback when browser activation expired across the bridge.
- Real pointer activation changed `Enable soft wrap` to `Disable soft wrap` and
  added `MdCodeBlockShell--wrap`; a second activation restored the initial state.
- User transcript messages now pass through `ChatMarkdown variant="user"` with
  canonical mention references and the shared composer token label grammar.
- Assistant and user processors are separate, so user `$skill`/currency text is
  not consumed by math parsing.
- Light/dark capture changed only isolated harness root theme classes and was
  restored to light; no user setting or server data changed.

## Gates and explicit residuals

- Lynx focused: 2 files / 17 tests passed; final presentation rerun 1 file /
  5 tests passed.
- Web focused: 2 files / 40 tests passed.
- Web production: 8,932 modules passed.
- Lynx + desktop production: 2398.2kB / 2526.9kB total passed.
- Lynx-for-Web: 2497.6kB / 3443.7kB total passed.
- Strict audits: thread reuse 38.67%; style 98.07%; both checks passed. Per D13,
  reuse is reported rather than used as a standalone release gate.
- A direct `ChatMarkdown.lynx.tsx` Rstest probe could not enter the test runtime:
  Rstest bundled unified's Node `debug` dependency into the Lynx target and
  emitted invalid generated code. Production Web/Lynx compilers pass; the
  dependency-free presentation layer carries the focused behavioral coverage.
- Registered platform residuals: Web keeps Shiki syntax colors and KaTeX;
  Lynx currently renders semantically equivalent plain monospace code and a
  textual math fallback. Images remain an explicit text fallback. These are not
  represented as pixel-equivalent capabilities.

## Completion-audit supplement

Paired real input/output evidence now covers a selected provider skill and a
real thread mention, including their canonical `skills_json` / `mentions_json`
projections. The audit also records that Web original does not expose line
numbers in the authoritative code-block state, so Lynx does not invent them.
See `../markdown-tokens/notes.md` and its ten paired screenshots.
