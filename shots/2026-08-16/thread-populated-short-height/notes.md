# Populated Thread at 320x200

## Canonical state

A project/thread were created through canonical commands. A real transcript
work row was added with public `thread.activity.append`; no provider was
started and SQLite was never written directly.

An initial attempt incorrectly used the external-provider `importThread` API
without its required `externalId`. Project/thread creation had already
succeeded, the import failed before adding messages, and cleanup immediately
reconfirmed browser zero state. The fixture was then completed through the
public activity command.

## P1 product loss

The empty-Thread short-height fix kept the composer visible, but the populated
path exposed a second loss.

Before final repair:

- header: `320x92`;
- composer after first compaction: `296x62 @ (12,138)`;
- transcript viewport: only `296x46 @ (12,92)`;
- TranscriptList auto-stuck to bottom at `scrollTop=65`;
- fixed `TranscriptBottomInset=80px` filled the complete visible transcript;
- every sampled point `y=96..135` hit the empty inset instead of the activity.

`lynx-populated-thread-short-transcript-hidden`: P1 contribution
`1.00 -> 0.00`.

## Root fix

Short-height ordinary Thread now:

- uses a one-line 20px composer editor with 4px/2px vertical padding;
- keeps the full footer and controls;
- reduces Thread-only transcript bottom inset from 80px to 8px.

Normal-height transcript/composer spacing remains unchanged.

## After evidence

At `320x200`:

- composer: `296x62 @ (12,138)`, fully visible;
- transcript: `296x46 @ (12,92)`;
- TranscriptList: `clientHeight=scrollHeight=46`, `scrollTop=0`;
- points `y=96`, `105`, and `120` hit
  `Short populated transcript activity` / its message row.

Web output/stage SHA-256:
`72f816522a670d24f5e48d855075fc5ef9351e66e40c3bbb74fce4e5364e421c`.

## Verification

- Empty Thread + drag-region suites: `8/8`.
- Lynx-for-Web production build: passed.
- Native/Desktop production build: passed with registered warnings only.
- Fixture was removed through canonical thread/project delete commands.
- No screenshot retained; local count remained `100`.
