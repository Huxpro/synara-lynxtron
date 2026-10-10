// Deterministic "every transcript row type" fixture for the Lynx ↔ Web message
// format audit (apps/lynx/docs/message-formats-checklist.md).
//
// The comparison seed (scripts/comparison-fixture.mjs) only has what four real
// provider turns happened to produce. This builder clones that seed into an
// isolated SYNARA_HOME and appends hand-written events to the server's own
// journal (`orchestration_events`); the server's projection pipeline replays
// them at startup, so both clients read these threads through the normal
// snapshot/stream path. No provider runs and nothing here is model output.
//
// Two states cannot live in the journal, because server startup settles them
// (apps/server/src/orchestration/startupTurnReconciliation.ts): a pending
// approval and a pending user-input request. `--live <ws url>` appends those to
// a running isolated server through the client-dispatchable
// `thread.activity.append` command.
//
// A running turn cannot be written into the journal either (startup settles it
// as interrupted). `--live-turn <ws url>` starts one real provider turn in
// approval-required mode with a prompt that needs a shell command, so the turn
// stays running on its own approval request until `--stop-live-turn`.
//
// usage:
//   node scripts/message-formats-fixture.mjs --home <isolated SYNARA_HOME> [--rebuild]
//   node scripts/message-formats-fixture.mjs --live ws://127.0.0.1:<server port>
//   node scripts/message-formats-fixture.mjs --live-turn ws://127.0.0.1:<server port>
//   node scripts/message-formats-fixture.mjs --stop-live-turn ws://127.0.0.1:<server port>
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { deflateSync } from "node:zlib";

import {
  COMPARISON_FIXTURE_IDS,
  COMPARISON_FIXTURE_MODEL,
  openSynaraRpcSession,
  resolveComparisonFixturePaths,
} from "./comparison-fixture.mjs";

export const MESSAGE_FORMATS_FIXTURE_VERSION = 1;
export const MESSAGE_FORMATS_THREAD_IDS = Object.freeze({
  main: `message-formats-main-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
  failed: `message-formats-failed-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
  streaming: `message-formats-streaming-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
  approval: `message-formats-approval-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
  userInput: `message-formats-user-input-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
  liveTurn: `message-formats-live-turn-v${MESSAGE_FORMATS_FIXTURE_VERSION}`,
});

const BASE_TIME_MS = Date.parse("2026-10-09T12:00:00.000Z");
const METADATA_JSON = JSON.stringify({ persistedEventSchemaVersion: 1 });

const INLINE_MARKDOWN = `# Heading level one

## Heading level two

### Heading level three

#### Heading level four

A paragraph with **bold**, *italic*, ***bold italic***, ~~strikethrough~~, \`inline code\`, an [authored link](https://example.com/docs), a bare link https://example.com/bare and a hard<br>break.

- Unordered item one
- Unordered item two
  - Nested item A
  - Nested item B
    - Deep item
- Unordered item three

1. Ordered item one
2. Ordered item two
   1. Nested ordered A
   2. Nested ordered B
3. Ordered item three

- [x] Task done
- [ ] Task open

> A blockquote line.
> A second blockquote line with \`code\`.

> [!NOTE]
> A GitHub-style note alert.

---

Inline math $E = mc^2$ and a price of $5 that stays text.

$$
\\int_0^1 x^2 \\, dx = \\frac{1}{3}
$$
`;

const LONG_LINE = `const veryLongLine = [${Array.from({ length: 40 }, (_, index) => `"value-${index}"`).join(", ")}];`;

function blocksMarkdown(imagePath) {
  return `Here is a table:

| Function | Parameters | Returns |
| :-- | :-: | --: |
| \`add\` | \`a: number, b: number\` | \`number\` |
| \`clamp\` | \`value, min, max\` | \`number\` |
| \`greet\` | \`name: string\` | \`string\` |

TypeScript:

\`\`\`ts
export function add(a: number, b: number): number {
  // sum of two numbers
  return a + b;
}
\`\`\`

Python:

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name.strip()}!" if name.strip() else "Hello!"
\`\`\`

Shell:

\`\`\`bash
rg -n "export function" src | head -5
\`\`\`

JSON:

\`\`\`json
{ "name": "synara-fixture-app", "private": true, "count": 3 }
\`\`\`

Diff:

\`\`\`diff
@@ -1,3 +1,4 @@
 export function add(a, b) {
-  return a - b;
+  return a + b;
 }
\`\`\`

No language:

\`\`\`
plain fenced text
  with indentation
\`\`\`

A long line that overflows horizontally:

\`\`\`ts
${LONG_LINE}
\`\`\`

File references: \`src/math.ts\`, \`src/greeting.ts:2\`, [README.md](README.md) and a missing \`src/missing.ts\`.

An image:

![Fixture diagram](${imagePath})
`;
}

const PLAN_MARKDOWN = `# Add a multiply function

## Summary

Add \`multiply(a, b)\` next to \`add\` and document it.

## Steps

1. Edit \`src/math.ts\` and export \`multiply\`.
2. Add a bullet to **README.md**.
3. Run \`node --test\`.

## Risks

- None; the change is additive.
`;

const STREAMING_PARTIAL = `Writing the helper now:

\`\`\`ts
export function multiply(a: number, b: number): number {
  return a *`;

/** A small opaque PNG (two-tone rectangle), built without a dependency. */
export function messageFormatsFixturePng(width = 96, height = 64) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buffer) => {
    let c = 0xffffffff;
    for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc(body));
    return Buffer.concat([length, body, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width; x += 1) {
      const left = x < width / 2;
      raw.set(left ? [0x2f, 0x80, 0xed] : [0xf5, 0x9e, 0x0b], row + 1 + x * 3);
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function attachmentSegment(threadId) {
  return threadId
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .slice(0, 80);
}

/**
 * Events of every fixture thread, in journal order, plus the files the server
 * must find on disk. Pure: same input, same output.
 */
export function buildMessageFormatsFixture({ workspaceRoot, imagePath }) {
  const events = [];
  const files = [];
  const versions = new Map();
  let clock = BASE_TIME_MS;
  let counter = 0;
  let activitySequence = 5000;
  const tick = (ms = 400) => new Date((clock += ms)).toISOString();
  const uuid = (prefix) =>
    `${prefix}-0000-4000-8000-${String(++counter).padStart(12, "0")}`.replace(
      /^([a-z0-9]+)/,
      (value) => value.padEnd(8, "0").slice(0, 8),
    );

  const push = (threadId, eventType, actorKind, commandId, payload, occurredAt) => {
    const version = versions.get(threadId) ?? 0;
    versions.set(threadId, version + 1);
    events.push({
      eventId: uuid("mfev"),
      streamId: threadId,
      streamVersion: version,
      eventType,
      occurredAt,
      commandId,
      actorKind,
      payload,
    });
  };

  const thread = (threadId, title) => {
    const at = tick();
    push(
      threadId,
      "thread.created",
      "client",
      `${threadId}:create`,
      {
        threadId,
        projectId: COMPARISON_FIXTURE_IDS.projectId,
        title,
        modelSelection: COMPARISON_FIXTURE_MODEL,
        runtimeMode: "full-access",
        interactionMode: "default",
        envMode: "local",
        branch: "main",
        worktreePath: null,
        workingDirectory: null,
        associatedWorktreePath: null,
        associatedWorktreeBranch: null,
        associatedWorktreeRef: null,
        createBranchFlowCompleted: false,
        isPinned: false,
        parentThreadId: null,
        subagentAgentId: null,
        subagentNickname: null,
        subagentRole: null,
        forkSourceThreadId: null,
        lastKnownPr: null,
        handoff: null,
        createdAt: at,
        updatedAt: at,
      },
      at,
    );

    let turnNumber = 0;
    let assistantNumber = 0;
    let checkpointCount = 0;
    const session = (status, activeTurnId = null, lastError = null) => {
      const at = tick(50);
      push(
        threadId,
        "thread.session-set",
        "provider",
        `provider:${uuid("mfss")}:session-set`,
        {
          threadId,
          session: {
            threadId,
            status,
            providerName: "codex",
            runtimeMode: "full-access",
            activeTurnId,
            lastError,
            updatedAt: at,
          },
        },
        at,
      );
    };
    const api = {
      threadId,
      /** Starts a turn with a user message; returns the turn handle. */
      turn(text, { attachments = [], mentions } = {}) {
        turnNumber += 1;
        const turnId = `${threadId.replace(/[^a-z0-9]/g, "").slice(0, 8)}-turn-4000-8000-${String(turnNumber).padStart(12, "0")}`;
        const messageId = `${threadId}:user-${turnNumber}`;
        const commandId = `${threadId}:turn-${turnNumber}`;
        const at = tick(2000);
        push(
          threadId,
          "thread.message-sent",
          "client",
          commandId,
          {
            threadId,
            messageId,
            role: "user",
            text,
            attachments,
            ...(mentions ? { mentions } : {}),
            dispatchMode: "queue",
            dispatchOrigin: "user",
            startsNewTurn: true,
            turnId: null,
            streaming: false,
            source: "native",
            createdAt: at,
            updatedAt: at,
          },
          at,
        );
        push(
          threadId,
          "thread.turn-start-requested",
          "client",
          commandId,
          {
            threadId,
            messageId,
            modelSelection: COMPARISON_FIXTURE_MODEL,
            computerControlMode: "off",
            enableComputerControl: false,
            computerControlGeneration: 0,
            assistantDeliveryMode: "streaming",
            dispatchMode: "queue",
            dispatchOrigin: "user",
            runtimeMode: "full-access",
            interactionMode: "default",
            createdAt: at,
          },
          at,
        );
        session("running", turnId);

        const activity = (kind, tone, summary, payload, ms = 400) => {
          const at = tick(ms);
          const id = uuid("mfac");
          push(
            threadId,
            "thread.activity-appended",
            "provider",
            `provider:${id}:thread-activity-append:${threadId}:${kind}:${id}`,
            {
              threadId,
              activity: {
                id,
                createdAt: at,
                tone,
                kind,
                summary,
                payload,
                turnId,
                sequence: (activitySequence += 1),
              },
            },
            at,
          );
          return at;
        };
        const tool = (itemType, title, item, { detail, failed = false, ms = 900 } = {}) => {
          const itemId = uuid("mfit");
          activity("tool.started", "tool", `${title} started`, {
            itemType,
            status: "inProgress",
            title,
            ...(detail ? { detail } : {}),
            data: { item: { ...item, id: itemId, status: "inProgress" }, turnId },
          });
          activity(
            "tool.completed",
            "tool",
            title,
            {
              itemType,
              status: failed ? "failed" : "completed",
              title,
              ...(detail ? { detail } : {}),
              data: {
                item: { ...item, id: itemId, status: failed ? "failed" : "completed" },
                turnId,
              },
            },
            ms,
          );
        };
        const turn = {
          turnId,
          messageId,
          activity,
          reasoning(detail) {
            activity("task.progress", "tool", "Reasoning trace", {
              status: "completed",
              detail,
              data: { toolCallId: uuid("mfrs") },
            });
          },
          command(command, output, { actions = [], exitCode = 0, durationMs = 120 } = {}) {
            const shell = `/bin/zsh -lc ${JSON.stringify(command)}`;
            tool(
              "command_execution",
              "Ran command",
              {
                type: "commandExecution",
                command: shell,
                cwd: workspaceRoot,
                commandActions: actions,
                aggregatedOutput: output,
                exitCode,
                durationMs,
              },
              { detail: shell, failed: exitCode !== 0 },
            );
          },
          fileChange(changes) {
            tool("file_change", "File change", {
              type: "fileChange",
              changes: changes.map((change) => ({
                path: join(workspaceRoot, change.path),
                kind: { type: change.kind ?? "update", move_path: null },
                diff: change.diff,
              })),
            });
          },
          webSearch(query) {
            tool(
              "web_search",
              "Web search",
              { type: "webSearch", query, action: { type: "search", query } },
              { detail: query },
            );
          },
          mcpTool(server, name, args, result) {
            tool(
              "mcp_tool_call",
              `${server}.${name}`,
              {
                type: "mcpToolCall",
                server,
                tool: name,
                arguments: args,
                result: { content: [{ type: "text", text: result }] },
                error: null,
              },
              { detail: `${server}.${name}` },
            );
          },
          /** One assistant message: a streamed delta, then (unless left open) the completion. */
          assistant(text, { complete = true } = {}) {
            assistantNumber += 1;
            const assistantId = `assistant:${threadId}:${assistantNumber}`;
            const startedAt = tick(600);
            const delta = uuid("mfdl");
            push(
              threadId,
              "thread.message-sent",
              "provider",
              `provider:${delta}:assistant-delta:${assistantId}`,
              {
                threadId,
                messageId: assistantId,
                role: "assistant",
                text,
                segmentStartedAt: startedAt,
                segmentSequence: (activitySequence += 1),
                turnId,
                streaming: true,
                createdAt: startedAt,
                updatedAt: startedAt,
              },
              startedAt,
            );
            if (complete) {
              const completedAt = tick(800);
              const done = uuid("mfdn");
              push(
                threadId,
                "thread.message-sent",
                "provider",
                `provider:${done}:assistant-complete:${assistantId}`,
                {
                  threadId,
                  messageId: assistantId,
                  role: "assistant",
                  text,
                  turnId,
                  streaming: false,
                  createdAt: completedAt,
                  updatedAt: completedAt,
                },
                completedAt,
              );
            }
            return assistantId;
          },
          plan(planMarkdown) {
            const at = tick();
            push(
              threadId,
              "thread.proposed-plan-upserted",
              "provider",
              `provider:${uuid("mfpl")}:proposed-plan-upsert`,
              {
                threadId,
                proposedPlan: {
                  id: `plan:${threadId}:turn:${turnId}`,
                  turnId,
                  planMarkdown,
                  implementedAt: null,
                  implementationThreadId: null,
                  createdAt: at,
                  updatedAt: at,
                },
              },
              at,
            );
          },
          approval(requestId, detail, decision) {
            activity("approval.requested", "approval", "Command approval requested", {
              requestId,
              requestKind: "command",
              requestType: "command_execution_approval",
              detail,
              sessionApprovalAvailable: true,
            });
            if (decision) {
              activity("approval.resolved", "approval", "Approval resolved", {
                requestId,
                requestKind: "command",
                requestType: "command_execution_approval",
                decision,
              });
            }
          },
          userInput(requestId, questions, answers) {
            activity("user-input.requested", "info", "User input requested", {
              requestId,
              questions,
            });
            if (answers) {
              activity("user-input.resolved", "info", "User input submitted", {
                requestId,
                answers,
              });
            }
          },
          /** Settles the turn. `files` adds the checkpoint / changed-files summary. */
          finish({ state = "completed", files, assistantMessageId = null, error } = {}) {
            if (state === "failed") {
              activity("runtime.error", "error", "Provider runtime error", {
                message: error,
                class: "provider_error",
              });
            }
            const completedAt = activity(
              "turn.completed",
              state === "failed" ? "error" : "info",
              state === "failed"
                ? "Turn failed"
                : state === "interrupted"
                  ? "Turn interrupted"
                  : "Turn completed",
              { state, ...(state === "failed" ? { errorMessage: error } : {}) },
            );
            session(
              state === "failed" ? "error" : state === "interrupted" ? "interrupted" : "ready",
              null,
              state === "failed" ? error : null,
            );
            if (state !== "completed") return;
            checkpointCount += 1;
            push(
              threadId,
              "thread.turn-diff-completed",
              "server",
              `server:checkpoint-turn-diff-complete:${uuid("mfcp")}`,
              {
                threadId,
                turnId,
                checkpointTurnCount: checkpointCount,
                checkpointRef: `refs/synara/checkpoints/${Buffer.from(threadId).toString("base64url")}/turn/${checkpointCount}`,
                status: "ready",
                files: files ?? [],
                assistantMessageId,
                completedAt,
              },
              completedAt,
            );
          },
        };
        return turn;
      },
    };
    return api;
  };

  // ── Main thread: every settled row type ────────────────────────────────────
  const main = thread(MESSAGE_FORMATS_THREAD_IDS.main, "Message formats");

  let turn = main.turn("Show me every inline markdown format.");
  turn.finish({ assistantMessageId: turn.assistant(INLINE_MARKDOWN) });

  turn = main.turn(
    "A multi-line user message.\nSecond line with **markdown** and `code`.\n\nA paragraph after a blank line, with a pasted link https://example.com/pasted and a list:\n- one\n- two",
  );
  turn.finish({ assistantMessageId: turn.assistant(blocksMarkdown(imagePath)) });

  turn = main.turn(
    "Add a multiply function to @src/math.ts and document it in @README.md please.",
    {
      mentions: [
        { name: "math.ts", path: join(workspaceRoot, "src/math.ts") },
        { name: "README.md", path: join(workspaceRoot, "README.md") },
      ],
    },
  );
  turn.reasoning("**Inspecting the math module**\n\nI should read `src/math.ts` before editing.");
  turn.assistant("I'll read the module, then add `multiply` and document it.");
  turn.command(
    "sed -n '1,40p' src/math.ts",
    "export function add(a: number, b: number): number {\n  return a + b;\n}\n",
    {
      actions: [
        {
          type: "read",
          command: "sed -n '1,40p' src/math.ts",
          name: "math.ts",
          path: join(workspaceRoot, "src/math.ts"),
        },
      ],
    },
  );
  turn.command('rg -n "export function" src', "src/math.ts:1:export function add\n", {
    actions: [
      {
        type: "search",
        command: 'rg -n "export function" src',
        query: "export function",
        path: "src",
      },
    ],
  });
  turn.command("ls src", "greeting.ts\nmath.ts\n", {
    actions: [{ type: "listFiles", command: "ls src", path: "src" }],
  });
  turn.webSearch("typescript export function overloads");
  turn.mcpTool("docs", "lookup", { topic: "node:test" }, "node:test runs files matching the glob.");
  turn.reasoning("**Applying the edit**");
  turn.fileChange([
    {
      path: "src/math.ts",
      diff: "@@ -3,2 +3,6 @@\n }\n+\n+export function multiply(a: number, b: number): number {\n+  return a * b;\n+}\n \n",
    },
    {
      path: "README.md",
      diff: "@@ -7,2 +7,3 @@\n - `add(a, b)` returns the sum of two numbers.\n+- `multiply(a, b)` returns the product of two numbers.\n - `greet(name)` returns a friendly greeting.\n",
    },
    {
      path: "src/multiply.test.ts",
      kind: "add",
      diff: "@@ -0,0 +1,2 @@\n+import test from 'node:test';\n+test('multiply', () => {});\n",
    },
  ]);
  turn.command("node --test", "not ok 1 - multiply\n# fail 1\n", { exitCode: 1, durationMs: 2300 });
  turn.finish({
    assistantMessageId: turn.assistant(
      "Added `multiply` to `src/math.ts` and documented it in [README.md](README.md).\n\nThe test run **failed** once; see the command output above.",
    ),
    files: [
      { path: "README.md", kind: "modified", additions: 1, deletions: 0 },
      { path: "src/math.ts", kind: "modified", additions: 4, deletions: 0 },
      { path: "src/multiply.test.ts", kind: "added", additions: 2, deletions: 0 },
    ],
  });

  const segment = attachmentSegment(main.threadId);
  const imageAttachment = {
    type: "image",
    id: `${segment}-00000000-0000-4000-8000-000000000001`,
    name: "diagram.png",
    mimeType: "image/png",
    sizeBytes: 0,
  };
  const fileAttachment = {
    type: "file",
    id: `${segment}-00000000-0000-4000-8000-000000000002`,
    name: "notes.txt",
    mimeType: "text/plain",
    sizeBytes: 0,
  };
  const png = messageFormatsFixturePng();
  const notes = Buffer.from("Fixture notes attachment.\n");
  imageAttachment.sizeBytes = png.length;
  fileAttachment.sizeBytes = notes.length;
  files.push({ relativePath: `attachments/${imageAttachment.id}.png`, data: png });
  files.push({ relativePath: `attachments/${fileAttachment.id}.txt`, data: notes });
  turn = main.turn("What do this image and this file contain?", {
    attachments: [imageAttachment, fileAttachment],
  });
  turn.finish({
    assistantMessageId: turn.assistant(
      "The image is a two-tone rectangle and the file is a one-line note.",
    ),
  });

  turn = main.turn("Plan how to add a divide function. Ask me before choosing error handling.");
  turn.userInput(
    "mf-user-input-answered",
    [
      {
        id: "errors",
        header: "Errors",
        question: "How should divide handle a zero divisor?",
        options: [
          { label: "Throw", description: "Throw a RangeError." },
          { label: "Return NaN", description: "Match JavaScript division." },
        ],
        multiSelect: false,
      },
    ],
    { errors: "Throw" },
  );
  turn.approval("mf-approval-resolved", '/bin/zsh -lc "node --test"', "accept");
  turn.command("node --test", "ok 1 - add\n# pass 1\n");
  turn.plan(PLAN_MARKDOWN);
  turn.finish({
    assistantMessageId: turn.assistant("The plan is ready for review."),
  });

  turn = main.turn("Start a long refactor of the greeting module.");
  turn.reasoning("**Scanning the greeting module**");
  turn.command(
    "sed -n '1,40p' src/greeting.ts",
    "export function greet(name: string): string {\n",
    {
      actions: [
        {
          type: "read",
          command: "sed -n '1,40p' src/greeting.ts",
          name: "greeting.ts",
          path: join(workspaceRoot, "src/greeting.ts"),
        },
      ],
    },
  );
  turn.assistant("I started reading the module and will");
  turn.finish({ state: "interrupted" });

  // ── Failed turn (its own thread: an errored session blocks the composer) ───
  const failed = thread(MESSAGE_FORMATS_THREAD_IDS.failed, "Message formats: failed turn");
  turn = failed.turn("Run the release script.");
  turn.command("./scripts/release.sh", "release.sh: permission denied\n", { exitCode: 126 });
  turn.finish({
    state: "failed",
    error: "The provider stopped responding: stream disconnected before completion.",
  });

  // ── Streaming: an assistant message left open, mid code fence ──────────────
  const streaming = thread(
    MESSAGE_FORMATS_THREAD_IDS.streaming,
    "Message formats: streaming partial",
  );
  turn = streaming.turn("Write a multiply helper.");
  turn.reasoning("**Drafting the helper**");
  turn.assistant(STREAMING_PARTIAL, { complete: false });

  // ── Hosts for the live-appended pending requests ───────────────────────────
  for (const [threadId, title] of [
    [MESSAGE_FORMATS_THREAD_IDS.approval, "Message formats: pending approval"],
    [MESSAGE_FORMATS_THREAD_IDS.userInput, "Message formats: pending user input"],
  ]) {
    const host = thread(threadId, title);
    turn = host.turn("Run the tests when you are ready.");
    turn.finish({ assistantMessageId: turn.assistant("I will ask before running anything.") });
  }

  return { events, files };
}

/** Pending requests appended to a running server (see the header comment). */
export function messageFormatsLiveCommands(now = new Date().toISOString()) {
  const append = (threadId, activity) => ({
    type: "thread.activity.append",
    commandId: `${threadId}:live:${activity.id}`,
    threadId,
    activity: { ...activity, turnId: null, createdAt: now },
    createdAt: now,
  });
  return [
    append(MESSAGE_FORMATS_THREAD_IDS.approval, {
      id: "mf-live-approval-requested",
      tone: "approval",
      kind: "approval.requested",
      summary: "Command approval requested",
      payload: {
        requestId: "mf-approval-pending",
        requestKind: "command",
        requestType: "command_execution_approval",
        detail: '/bin/zsh -lc "node --test src/math.test.ts"',
        sessionApprovalAvailable: true,
      },
    }),
    append(MESSAGE_FORMATS_THREAD_IDS.userInput, {
      id: "mf-live-user-input-requested",
      tone: "info",
      kind: "user-input.requested",
      summary: "User input requested",
      payload: {
        requestId: "mf-user-input-pending",
        questions: [
          {
            id: "scope",
            header: "Scope",
            question: "Which tests should run?",
            options: [
              { label: "All tests", description: "Run the whole suite." },
              { label: "Math only", description: "Run src/math.test.ts." },
            ],
            multiSelect: false,
          },
          {
            id: "report",
            header: "Report",
            question: "How detailed should the report be?",
            options: [
              { label: "Short", description: "One line per file." },
              { label: "Full", description: "Every assertion." },
            ],
            multiSelect: false,
          },
        ],
      },
    }),
  ];
}

/** One real turn that stops on a command approval and therefore stays running. */
export function messageFormatsLiveTurnCommands(now = new Date().toISOString()) {
  const threadId = MESSAGE_FORMATS_THREAD_IDS.liveTurn;
  return [
    {
      type: "thread.create",
      commandId: `${threadId}:create:${now}`,
      threadId,
      projectId: COMPARISON_FIXTURE_IDS.projectId,
      title: "Message formats: running turn",
      modelSelection: COMPARISON_FIXTURE_MODEL,
      runtimeMode: "approval-required",
      interactionMode: "default",
      branch: "main",
      worktreePath: null,
      createdAt: now,
    },
    {
      type: "thread.turn.start",
      commandId: `${threadId}:turn-1:${now}`,
      threadId,
      message: {
        messageId: `${threadId}:user-1`,
        role: "user",
        text: "Say in one sentence what you are about to do, then run `node --version > /tmp/message-formats-live-turn.txt` in the shell. Do nothing else.",
        attachments: [],
      },
      modelSelection: COMPARISON_FIXTURE_MODEL,
      runtimeMode: "approval-required",
      interactionMode: "default",
      createdAt: now,
    },
  ];
}

function sqlString(value) {
  return value === null || value === undefined
    ? "NULL"
    : `'${String(value).replaceAll("'", "''")}'`;
}

export function messageFormatsFixtureSql(events) {
  const rows = events.map(
    (event) =>
      `INSERT INTO orchestration_events (event_id, aggregate_kind, stream_id, stream_version, event_type, occurred_at, command_id, causation_event_id, correlation_id, actor_kind, payload_json, metadata_json) VALUES (${[
        sqlString(event.eventId),
        "'thread'",
        sqlString(event.streamId),
        event.streamVersion,
        sqlString(event.eventType),
        sqlString(event.occurredAt),
        sqlString(event.commandId),
        "NULL",
        sqlString(event.commandId),
        sqlString(event.actorKind),
        sqlString(JSON.stringify(event.payload)),
        sqlString(METADATA_JSON),
      ].join(", ")});`,
  );
  return [
    "BEGIN;",
    ...rows,
    // The fixture's turn-start requests are history, not work: mark them
    // consumed so the provider command reactor never starts a real turn.
    "UPDATE orchestration_consumer_state SET last_acked_sequence = (SELECT MAX(sequence) FROM orchestration_events);",
    "COMMIT;",
  ].join("\n");
}

function sqlite(databasePath, input) {
  const result = spawnSync("sqlite3", [databasePath], { input, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`sqlite3 failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

export function installMessageFormatsFixture({ home, rebuild = false }) {
  const paths = resolveComparisonFixturePaths();
  if (!existsSync(paths.seedDatabase)) {
    throw new Error(
      `comparison seed missing at ${paths.seedDatabase}; run node scripts/comparison-fixture.mjs first`,
    );
  }
  const stateDir = join(resolve(home), "dev");
  const database = join(stateDir, "state.sqlite");
  if (existsSync(database)) {
    if (!rebuild) throw new Error(`${database} exists; pass --rebuild to replace it`);
    for (const suffix of ["", "-wal", "-shm"]) rmSync(`${database}${suffix}`, { force: true });
  }
  mkdirSync(stateDir, { recursive: true });
  const backup = spawnSync("sqlite3", [paths.seedDatabase, `.backup '${database}'`], {
    encoding: "utf8",
  });
  if (backup.status !== 0) throw new Error(`seed backup failed: ${backup.stderr}`);

  const imagePath = join(resolve(home), "message-formats-assets", "diagram.png");
  mkdirSync(dirname(imagePath), { recursive: true });
  writeFileSync(imagePath, messageFormatsFixturePng(240, 120));
  const fixture = buildMessageFormatsFixture({ workspaceRoot: paths.workspaceRoot, imagePath });
  for (const file of fixture.files) {
    const target = join(stateDir, file.relativePath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.data);
  }
  sqlite(database, messageFormatsFixtureSql(fixture.events));
  return { database, events: fixture.events.length, threads: MESSAGE_FORMATS_THREAD_IDS };
}

export async function appendMessageFormatsLiveRequests(serverUrl) {
  const session = await openSynaraRpcSession(serverUrl, "message-formats-fixture");
  try {
    for (const command of messageFormatsLiveCommands()) {
      await session.request("orchestration.dispatchCommand", command);
    }
  } finally {
    session.close();
  }
}

async function dispatchAll(serverUrl, commands, { tolerate = false } = {}) {
  const session = await openSynaraRpcSession(serverUrl, "message-formats-fixture");
  try {
    for (const command of commands) {
      try {
        await session.request("orchestration.dispatchCommand", command);
      } catch (error) {
        if (!tolerate) throw error;
        console.warn(error instanceof Error ? error.message : error);
      }
    }
  } finally {
    session.close();
  }
}

async function main(argv) {
  const value = (flag) => {
    const index = argv.indexOf(flag);
    return index < 0 ? null : (argv[index + 1] ?? null);
  };
  const liveTurn = value("--live-turn");
  if (liveTurn) {
    // The thread may exist from an earlier run; its create is then rejected.
    await dispatchAll(liveTurn, messageFormatsLiveTurnCommands(), { tolerate: true });
    console.log(`started a real turn on ${MESSAGE_FORMATS_THREAD_IDS.liveTurn}`);
    return;
  }
  const stopLiveTurn = value("--stop-live-turn");
  if (stopLiveTurn) {
    const now = new Date().toISOString();
    await dispatchAll(
      stopLiveTurn,
      [
        {
          type: "thread.session.stop",
          commandId: `${MESSAGE_FORMATS_THREAD_IDS.liveTurn}:stop:${now}`,
          threadId: MESSAGE_FORMATS_THREAD_IDS.liveTurn,
          createdAt: now,
        },
      ],
      { tolerate: true },
    );
    console.log(`stopped the session of ${MESSAGE_FORMATS_THREAD_IDS.liveTurn}`);
    return;
  }
  const live = value("--live");
  if (live) {
    await appendMessageFormatsLiveRequests(live);
    console.log(`appended pending approval and user-input requests through ${live}`);
    return;
  }
  const home = value("--home");
  if (!home) {
    throw new Error(
      "usage: message-formats-fixture.mjs --home <isolated SYNARA_HOME> [--rebuild] | --live <ws url>",
    );
  }
  const result = installMessageFormatsFixture({ home, rebuild: argv.includes("--rebuild") });
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
