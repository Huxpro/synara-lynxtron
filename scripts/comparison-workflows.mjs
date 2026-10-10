// Workflow definitions (plan N3) run by scripts/comparison-workflow-run.mjs.
// Each workflow receives one renderer driver plus the backend and returns a
// list of verified steps; any failed expectation throws with its context.
import { execFileSync } from "node:child_process";
import { chmodSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { readComparisonFixtureManifest } from "./comparison-fixture.mjs";
import { COMPARISON_UNKNOWN_SETTING } from "./dev-electron-lynxtron.mjs";
import { nativeNodesMatchingClasses } from "./comparison-measure.mjs";
import {
  NAVIGATION_TARGETS,
  showAppSidebar,
  openAutomationsSurface,
  openDockWithPane,
  openKanbanSurface,
  openPullRequestsSurface,
  openSettings,
  pick,
  settingsShown,
} from "./comparison-navigation.mjs";
import { waitFor } from "./comparison-workflow.mjs";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

export const FIXTURE_PROJECT_TITLE = "synara-fixture-app";

/** Message rows as the renderer shows them: [{ id }] in transcript order. */
export async function renderedMessageIds(driver) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `Array.from(document.querySelectorAll('[data-timeline-row-kind="message"][data-message-id]')).map((node) => node.getAttribute('data-message-id'))`,
    );
  }
  const root = await driver.documentRoot();
  const ids = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "item-key") ids.push(String(attributes[index + 1]));
    }
    queue.push(...(node?.children ?? []));
  }
  return ids;
}

/** The thread the sidebar marks active, or null. */
export async function activeThreadId(driver) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `document.querySelector('[data-thread-id][data-active="true"]')?.getAttribute('data-thread-id') ?? null`,
    );
  }
  const queue = [await driver.documentRoot()];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    const map = {};
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      map[attributes[index]] = attributes[index + 1];
    }
    if (map["data-thread-id"] && map["data-active"] === "true") return map["data-thread-id"];
    queue.push(...(node?.children ?? []));
  }
  return null;
}

/** Window-space rects of the rendered transcript message rows, in order. */
export async function messageRowRects(driver) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `Array.from(document.querySelectorAll('[data-timeline-row-kind="message"][data-message-id]')).map((node) => { const r = node.getBoundingClientRect(); return { id: node.getAttribute('data-message-id'), top: r.top, bottom: r.bottom }; })`,
    );
  }
  const rows = [];
  const queue = [await driver.documentRoot()];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "item-key")
        rows.push({ nodeId: node.nodeId, id: String(attributes[index + 1]) });
    }
    queue.push(...(node?.children ?? []));
  }
  const rects = [];
  for (const row of rows) {
    const quad = (await driver.send("DOM.getBoxModel", { nodeId: row.nodeId }))?.model?.border;
    if (!quad) continue;
    const ys = [quad[1], quad[3], quad[5], quad[7]];
    // Recycled (off-screen) list items report an empty box.
    if (Math.max(...ys) - Math.min(...ys) <= 0) continue;
    rects.push({ id: row.id, top: Math.min(...ys), bottom: Math.max(...ys) });
  }
  return rects;
}

/** Whether the transcript offers "Scroll to bottom" (i.e. it is not following the end). */
export async function scrollToBottomOffered(driver) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `document.querySelector('[aria-label="Scroll to bottom"]')?.getAttribute('aria-hidden') === 'false'`,
    );
  }
  return (await driver.find({ label: "Scroll to bottom" })) !== null;
}

async function threadWithMessage(backend, token) {
  const snapshot = await backend.snapshot();
  return (
    snapshot.threads.find((thread) =>
      (thread.messages ?? []).some(
        (message) => message.role === "user" && message.text.includes(token),
      ),
    ) ?? null
  );
}

async function composeAndSend(driver, text) {
  await driver.tap(
    pick(driver, {
      electron: { testId: "composer-editor" },
      native: { label: "Message composer" },
    }),
  );
  await driver.type(text);
  await driver.tap({ label: "Send message" });
}

function userMessagesWith(thread, token) {
  return (thread.messages ?? []).filter(
    (message) => message.role === "user" && message.text.includes(token),
  );
}

/**
 * Waits for a turn newer than `previousTurnId` to settle. Without the turn
 * identity check, a just-sent message would read as "settled" against the
 * previous, already-completed turn.
 */
async function waitForSettled(
  backend,
  threadId,
  label,
  previousTurnId = null,
  timeoutMs = 120_000,
) {
  return waitFor(
    async () => {
      const thread = await backend.thread(threadId);
      const turn = thread?.latestTurn;
      return turn &&
        turn.turnId !== previousTurnId &&
        turn.state !== "running" &&
        !thread.session?.activeTurnId
        ? thread
        : null;
    },
    { label, timeoutMs, intervalMs: 500 },
  );
}

const COMPOSER_TARGET = {
  electron: { testId: "composer-editor" },
  native: { label: "Message composer" },
};
const FIXTURE_SECONDARY_THREAD_ID = "comparison-fixture-secondary-v2";
const FIXTURE_TRANSCRIPT_THREAD_ID = "comparison-fixture-transcript-v2";

async function openNewThread(driver) {
  await driver.tap({ label: `Create new thread in ${FIXTURE_PROJECT_TITLE}` });
  await waitFor(() => driver.find(pick(driver, COMPOSER_TARGET)), {
    label: "the new thread composer",
  });
}

/** Sends `text` and resolves with the thread once the new turn has settled as completed. */
async function sendAndComplete(driver, backend, text, marker, threadId = null) {
  const previousTurnId = threadId
    ? ((await backend.thread(threadId))?.latestTurn?.turnId ?? null)
    : null;
  await composeAndSend(driver, text);
  const sent = await waitFor(() => threadWithMessage(backend, marker), {
    label: `"${marker}" in the backend`,
    timeoutMs: 30_000,
  });
  const settled = await waitForSettled(
    backend,
    sent.id,
    `the "${marker}" turn`,
    previousTurnId,
    180_000,
  );
  if (settled.latestTurn.state !== "completed")
    throw new Error(`"${marker}" turn ended ${settled.latestTurn.state}.`);
  if (userMessagesWith(settled, marker).length !== 1)
    throw new Error(`"${marker}" was not sent exactly once.`);
  return settled;
}

/** Waits for the newest turn to be running with at least `minChars` of streamed assistant text. */
async function waitForStreamingText(
  backend,
  threadId,
  previousTurnId,
  minChars,
  timeoutMs = 60_000,
) {
  return waitFor(
    async () => {
      const current = await backend.thread(threadId);
      const turn = current?.latestTurn;
      const last = current?.messages?.at(-1);
      return turn?.turnId !== previousTurnId &&
        turn?.state === "running" &&
        last?.role === "assistant" &&
        last.streaming &&
        last.text.length >= minChars
        ? current
        : null;
    },
    { label: `${minChars} chars of streamed text`, timeoutMs, intervalMs: 150 },
  ).catch(async (error) => {
    // A turn the provider never started (a rejected command, a lock held by another
    // instance on the machine) looks the same from here as a slow one; say which it was.
    const current = await backend.thread(threadId);
    throw new Error(
      `${error.message} Latest turn: ${JSON.stringify(current?.latestTurn)}; session: ${JSON.stringify(current?.session)}; last message: ${JSON.stringify(current?.messages?.at(-1)?.text?.slice(0, 120))}`,
    );
  });
}

/** The message row showing the most of itself in the transcript viewport, to watch for movement. */
async function pickAnchorRow(driver, viewport) {
  // Not "the row at the middle": rows other than messages (the 37px "Working for" header
  // between a prompt and its reply) can sit there, and where they land depends on how much
  // of the reply had streamed when the reader scrolled away.
  const shown = (row) => Math.min(row.bottom, viewport.bottom) - Math.max(row.top, viewport.top);
  const rows = (await messageRowRects(driver))
    .filter((row) => shown(row) > 0)
    .toSorted((left, right) => shown(right) - shown(left));
  if (rows.length === 0)
    throw new Error("No message row inside the transcript viewport to anchor on.");
  return rows[0];
}

/**
 * Scrolls toward the top until the transcript reports it is detached. A wheel
 * that races an in-flight follow scroll can be absorbed; a user scrolls again.
 */
async function detachTranscript(driver, viewport, deltaY) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await driver.scroll({ x: viewport.x, y: (viewport.top + viewport.bottom) / 2 }, deltaY);
    const detached = await waitFor(() => scrollToBottomOffered(driver), {
      label: "the transcript to detach",
      timeoutMs: 1_500,
    }).catch(() => false);
    if (detached) {
      await sleep(300);
      return attempt;
    }
  }
  throw new Error("The transcript never detached from the end after scrolling up.");
}

function latestTurnActivityCount(thread) {
  const turnId = thread.latestTurn.turnId;
  return (thread.activities ?? []).filter((activity) => activity.turnId === turnId).length;
}

async function rowTop(driver, id) {
  return (await messageRowRects(driver)).find((row) => row.id === id)?.top ?? null;
}

async function transcriptViewport(driver) {
  const composer = await driver.find(pick(driver, COMPOSER_TARGET));
  // The transcript sits above the composer; 60px clears the header.
  return { top: 60, bottom: composer.y - composer.height / 2 - 20, x: composer.x };
}

/** Deletes a thread a workflow created so later workflows see the canonical fixture. */
async function deleteWorkflowThread(backend, threadId) {
  if (!threadId) return;
  await backend
    .request("orchestration.dispatchCommand", {
      type: "thread.delete",
      commandId: `workflow-cleanup-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      threadId,
    })
    .catch(() => undefined);
}

/** J1 — existing project → new thread → send → complete → model picker → stream → stop → resend. */
export async function workflowJ1(context) {
  const { driver, backend, step } = context;
  const token = `J1-${driver.kind}-${Date.now().toString(36)}`;
  let thread;
  try {
    await step("open a new thread in the fixture project", async () => {
      await driver.tap({ label: `Create new thread in ${FIXTURE_PROJECT_TITLE}` });
      await waitFor(
        () =>
          driver.find(
            pick(driver, {
              electron: { testId: "composer-editor" },
              native: { label: "Message composer" },
            }),
          ),
        {
          label: "the new thread composer",
        },
      );
    });

    thread = await step("send and complete a real provider turn", async () => {
      await composeAndSend(driver, `Reply with exactly one line: ${token} ok`);
      const created = await waitFor(() => threadWithMessage(backend, token), {
        label: "the sent message in the backend",
        timeoutMs: 30_000,
      });
      const settled = await waitForSettled(backend, created.id, "the turn to complete");
      if (settled.latestTurn.state !== "completed") {
        throw new Error(
          `Turn ended ${settled.latestTurn.state}: ${settled.session?.lastError ?? ""}`,
        );
      }
      if (userMessagesWith(settled, token).length !== 1)
        throw new Error("The message was sent more than once.");
      const last = settled.messages.at(-1);
      if (last.role !== "assistant" || !last.text.includes(`${token} ok`)) {
        throw new Error(`Unexpected assistant reply: ${JSON.stringify(last.text).slice(0, 200)}`);
      }
      await waitFor(async () => (await renderedMessageIds(driver)).includes(last.id), {
        label: "the assistant reply in the transcript",
        timeoutMs: 20_000,
      });
      return {
        threadId: settled.id,
        turnId: settled.latestTurn.turnId,
        assistantMessageId: last.id,
      };
    });

    await step("open and close the thread model picker", async () => {
      await driver.tap({ label: "Change model and reasoning" });
      const menu = await waitFor(
        () =>
          driver.kind === "electron"
            ? driver.find({ selector: '[data-slot="menu-popup"]' })
            : driver.find({ className: "LxMenuLayer" }),
        { label: "the model menu" },
      );
      await driver.tap({ label: "Change model and reasoning" });
      await waitFor(
        async () =>
          !(driver.kind === "electron"
            ? await driver.find({ selector: '[data-slot="menu-popup"]' })
            : await driver.find({ className: "LxMenuLayer" })),
        { label: "the model menu to close" },
      );
      return { menu: { width: menu.width, height: menu.height } };
    });

    await step("mention a workspace file from the @ menu and send it", async () => {
      const mentionToken = `${token}-mention`;
      await driver.tap(
        pick(driver, {
          electron: { testId: "composer-editor" },
          native: { label: "Message composer" },
        }),
      );
      await driver.type("@math");
      const optionTarget = pick(driver, {
        electron: { selector: '[data-slot="command-item"]', text: "math.ts" },
        native: { label: /^math\.ts$/ },
      });
      // The first workspace search can take a while as the server indexes.
      await waitFor(() => driver.find(optionTarget), {
        label: "the math.ts option",
        timeoutMs: 30_000,
      });
      const option = await driver.tap(optionTarget);
      await driver.type(`Reply with exactly one line: ${mentionToken} ok`);
      await driver.tap({ label: "Send message" });
      const sent = await waitFor(
        async () => {
          const current = await backend.thread(thread.threadId);
          return userMessagesWith(current, mentionToken).length > 0 ? current : null;
        },
        { label: "the mention message", timeoutMs: 30_000 },
      );
      const message = userMessagesWith(sent, mentionToken)[0];
      if (!message.text.includes("src/math.ts")) {
        throw new Error(
          `The file mention did not reach the provider: ${JSON.stringify(message.text)}`,
        );
      }
      const settled = await waitForSettled(
        backend,
        thread.threadId,
        "the mention turn",
        thread.turnId,
      );
      if (settled.latestTurn.state !== "completed")
        throw new Error(`Mention turn ended ${settled.latestTurn.state}.`);
      if (userMessagesWith(settled, mentionToken).length !== 1)
        throw new Error("The mention was sent more than once.");
      thread.turnId = settled.latestTurn.turnId;
      return { option: { width: option.width, height: option.height }, sentText: message.text };
    });

    await step("stop a streaming turn, then resend", async () => {
      const stopToken = `${token}-stop`;
      const beforeStop = (await backend.thread(thread.threadId)).latestTurn?.turnId ?? null;
      await composeAndSend(
        driver,
        `Without using tools, write a numbered list of 60 one-line facts about the ocean. First line: ${stopToken}`,
      );
      const streaming = await waitFor(
        async () => {
          const current = await backend.thread(thread.threadId);
          const turn = current?.latestTurn;
          if (turn?.turnId === beforeStop || turn?.state !== "running") return null;
          // Codex may deliver text in large chunks, so a running turn counts as
          // streaming once text shows up or 3s after it started.
          const assistant = current.messages.at(-1);
          const hasText =
            assistant?.role === "assistant" && assistant.streaming && assistant.text.length > 40;
          const runningMs = turn.startedAt ? Date.now() - Date.parse(turn.startedAt) : 0;
          return hasText || runningMs > 3_000 ? current : null;
        },
        { label: "the long turn to be running", timeoutMs: 60_000, intervalMs: 200 },
      ).catch(async (error) => {
        const current = await backend.thread(thread.threadId);
        throw new Error(
          `${error.message} Latest turn: ${JSON.stringify(current?.latestTurn)}; last message: ${JSON.stringify(current?.messages?.at(-1)?.text?.slice(0, 120))}`,
        );
      });
      const lastBeforeStop = streaming.messages.at(-1);
      const streamedChars = lastBeforeStop.role === "assistant" ? lastBeforeStop.text.length : 0;
      const stoppedAt = Date.now();
      await driver.tap({ label: "Stop generation" });
      const stopped = await waitForSettled(
        backend,
        thread.threadId,
        "the stopped turn to settle",
        beforeStop,
        30_000,
      );
      // The server records a stopped Codex turn as "completed" (its checkpoint
      // still captures), so the stop is proven by what was produced: a full
      // answer takes ~10s and reaches item 60. A Stop that lands before the
      // first text arrives leaves no assistant reply at all.
      const stoppedReply =
        stopped.messages.at(-1)?.role === "assistant" ? stopped.messages.at(-1) : null;
      const settledAfterStopMs = Date.parse(stopped.latestTurn.completedAt) - stoppedAt;
      if ((stoppedReply && /(^|\n)60\./.test(stoppedReply.text)) || settledAfterStopMs > 5_000) {
        throw new Error(
          `The turn ran to completion (${settledAfterStopMs}ms after Stop); Stop did not interrupt it.`,
        );
      }
      await waitFor(() => driver.find({ label: "Send message" }), {
        label: "the send action to return after Stop",
      });
      const resendToken = `${token}-resend`;
      await composeAndSend(driver, `Reply with exactly one line: ${resendToken} ok`);
      const resent = await waitFor(
        async () => {
          const current = await backend.thread(thread.threadId);
          return userMessagesWith(current, resendToken).length > 0 ? current : null;
        },
        { label: "the resent message", timeoutMs: 30_000 },
      );
      const settled = await waitForSettled(
        backend,
        resent.id,
        "the resent turn to complete",
        stopped.latestTurn.turnId,
      );
      if (settled.latestTurn.state !== "completed")
        throw new Error(`Resend ended ${settled.latestTurn.state}.`);
      for (const marker of [stopToken, resendToken]) {
        if (userMessagesWith(settled, marker).length !== 1)
          throw new Error(`"${marker}" was not sent exactly once.`);
      }
      return {
        streamedCharsBeforeStop: streamedChars,
        stoppedReplyChars: stoppedReply?.text.length ?? 0,
        settledAfterStopMs,
        stoppedTurnId: stopped.latestTurn.turnId,
        resentTurnId: settled.latestTurn.turnId,
      };
    });

    await step("reload the renderer, reopen the thread, and continue it", async () => {
      const before = await backend.thread(thread.threadId);
      const lastMessage = before.messages.at(-1);
      const reloadStartedAt = Date.now();
      await driver.reload();
      // Electron keeps the thread in its URL. A LynxView reload reloads the
      // launch deep link (the product Reload relaunches with the current route),
      // so Native may come back on another thread and is reopened from the sidebar.
      const landedOn = await waitFor(() => activeThreadId(driver), {
        label: "an active thread after reload",
        timeoutMs: 30_000,
      });
      const routeRestored = landedOn === thread.threadId;
      if (!routeRestored) await driver.tap({ attribute: ["data-thread-id", thread.threadId] });
      await waitFor(
        async () =>
          (await activeThreadId(driver)) === thread.threadId &&
          (await renderedMessageIds(driver)).includes(lastMessage.id),
        { label: "the thread transcript after reload", timeoutMs: 30_000 },
      );
      const recoveredMs = Date.now() - reloadStartedAt;
      const after = await backend.thread(thread.threadId);
      if (after.messages.length !== before.messages.length) {
        throw new Error(
          `Reload changed the thread: ${before.messages.length} → ${after.messages.length} messages.`,
        );
      }
      const continueToken = `${token}-after-reload`;
      await composeAndSend(driver, `Reply with exactly one line: ${continueToken} ok`);
      await waitFor(
        async () =>
          userMessagesWith(await backend.thread(thread.threadId), continueToken).length > 0,
        { label: "the post-reload message", timeoutMs: 30_000 },
      );
      const settled = await waitForSettled(
        backend,
        thread.threadId,
        "the post-reload turn",
        after.latestTurn.turnId,
      );
      if (settled.latestTurn.state !== "completed")
        throw new Error(`Post-reload turn ended ${settled.latestTurn.state}.`);
      const userMessages = settled.messages.filter((message) => message.role === "user");
      const distinct = new Set(userMessages.map((message) => message.text));
      if (distinct.size !== userMessages.length)
        throw new Error("A message was sent twice across the reload.");
      await waitFor(
        async () => (await renderedMessageIds(driver)).includes(settled.messages.at(-1).id),
        {
          label: "the post-reload reply in the transcript",
          timeoutMs: 20_000,
        },
      );
      return {
        routeRestored,
        landedOn,
        recoveredMs,
        messagesBefore: before.messages.length,
        messagesAfter: settled.messages.length,
        userMessages: userMessages.length,
      };
    });
  } finally {
    await deleteWorkflowThread(
      backend,
      thread?.threadId ?? (await threadWithMessage(backend, token).catch(() => null))?.id,
    );
  }
  return { threadId: thread?.threadId, token };
}

function longPrompt(topic, marker, lines = 70) {
  return `Without using tools, write a numbered list of ${lines} one-line facts about ${topic}, one per line. First line: ${marker}`;
}

// The turn J2 follows and then scrolls away from has to outlast both checks
// (about 7s after its first text). A 70-line reply has streamed in 5.5s, so
// that turn asks for three times as much.
const FOLLOWED_TURN_LINES = 210;
// First text from a live provider has taken 43s; a minute is not a failure.
const FIRST_TEXT_TIMEOUT_MS = 180_000;
// Fewest samples, taken while the turn is still running, that decide the detach check, and
// how many of them must follow new text (the second lets the renderer have drawn the first).
const MIN_STREAMING_DRIFT_SAMPLES = 4;
const MIN_SAMPLES_WITH_NEW_OUTPUT = 2;

/**
 * J2 — long transcript → follow live output → scroll away → new output keeps
 * the reader's place → Jump → tool-only activity never snaps a detached reader
 * → switch threads and back with the right content.
 */
export async function workflowJ2(context) {
  const { driver, backend, step } = context;
  const token = `J2-${driver.kind}-${Date.now().toString(36)}`;
  let threadId;
  try {
    await step("build a long transcript with a real turn", async () => {
      await openNewThread(driver);
      const settled = await sendAndComplete(
        driver,
        backend,
        longPrompt("rivers", `${token}-long`),
        `${token}-long`,
      );
      threadId = settled.id;
      const last = settled.messages.at(-1);
      await waitFor(async () => (await renderedMessageIds(driver)).includes(last.id), {
        label: "the long reply in the transcript",
        timeoutMs: 20_000,
      });
      return { threadId, replyChars: last.text.length };
    });

    let streamTurnBefore;
    await step("follow live output to the end of the transcript", async () => {
      streamTurnBefore = (await backend.thread(threadId)).latestTurn.turnId;
      await composeAndSend(driver, longPrompt("mountains", `${token}-follow`, FOLLOWED_TURN_LINES));
      await waitForStreamingText(backend, threadId, streamTurnBefore, 1, FIRST_TEXT_TIMEOUT_MS);
      const samples = [];
      const deadline = Date.now() + 2_500;
      while (Date.now() < deadline) {
        samples.push(await scrollToBottomOffered(driver));
        await sleep(250);
      }
      if (samples.some(Boolean)) {
        throw new Error(
          `The transcript stopped following live output (${samples.filter(Boolean).length}/${samples.length} samples).`,
        );
      }
      return { samples: samples.length };
    });

    await step("scroll away while output streams; the reader keeps their place", async () => {
      const viewport = await transcriptViewport(driver);
      const detachAttempts = await detachTranscript(driver, viewport, -500);
      const anchor = await pickAnchorRow(driver, viewport);
      const before = await backend.thread(threadId);
      const startChars = before.messages.at(-1).text.length;
      if (before.latestTurn.state !== "running")
        throw new Error("The turn finished before the detach check.");
      // This step is about new output, so a sample counts only if the turn was
      // still running after it was read. A turn that settles re-lays the row out
      // for another reason: upstream removes the 37px "Working for" header above
      // the reply, which is not output arriving.
      const startedAt = Date.now();
      const drift = [];
      let streamedChars = startChars;
      let samplesWithNewOutput = 0;
      let settledAfterMs = null;
      // Runs for 2.5s and until it has the samples that decide it, whichever is later: a busy
      // machine reads a Native row slowly, and a provider can hold its text for seconds and
      // then send it at once. The turn outlasts all of that.
      const decided = () =>
        Date.now() - startedAt >= 2_500 &&
        drift.length >= MIN_STREAMING_DRIFT_SAMPLES &&
        samplesWithNewOutput >= MIN_SAMPLES_WITH_NEW_OUTPUT;
      while (!decided()) {
        await sleep(300);
        const top = await rowTop(driver, anchor.id);
        const offered = await scrollToBottomOffered(driver);
        const current = await backend.thread(threadId);
        if (current.latestTurn.state !== "running") {
          settledAfterMs = Date.now() - startedAt;
          break;
        }
        if (top === null) throw new Error(`Anchor row ${anchor.id} left the viewport.`);
        if (!offered) throw new Error("Scroll to bottom disappeared while detached.");
        drift.push(Math.round((top - anchor.top) * 10) / 10);
        streamedChars = current.messages.at(-1).text.length;
        if (streamedChars > startChars) samplesWithNewOutput += 1;
      }
      if (!decided()) {
        throw new Error(
          `The turn settled ${settledAfterMs}ms into the detach check with ${drift.length} samples, ${samplesWithNewOutput} of them after new output; it needs ${MIN_STREAMING_DRIFT_SAMPLES} and ${MIN_SAMPLES_WITH_NEW_OUTPUT}.`,
        );
      }
      const grewChars = streamedChars - startChars;
      const maxDrift = Math.max(...drift.map(Math.abs));
      if (maxDrift > 2)
        throw new Error(`The detached transcript moved ${maxDrift}px under new output.`);
      return {
        anchor: anchor.id,
        detachAttempts,
        samples: drift.length,
        maxDriftPx: maxDrift,
        grewChars,
      };
    });

    await step("jump back to the latest output", async () => {
      await driver.tap({ label: "Scroll to bottom" });
      await waitFor(async () => !(await scrollToBottomOffered(driver)), {
        label: "Scroll to bottom to hide",
      });
      const settled = await waitForSettled(
        backend,
        threadId,
        "the followed turn",
        streamTurnBefore,
        180_000,
      );
      const last = settled.messages.at(-1);
      await waitFor(async () => (await renderedMessageIds(driver)).includes(last.id), {
        label: "the final reply rendered",
      });
      await sleep(500);
      if (await scrollToBottomOffered(driver))
        throw new Error("The transcript detached again after Jump.");
      const viewport = await transcriptViewport(driver);
      const lastRow = (await messageRowRects(driver)).find((row) => row.id === last.id);
      return {
        lastRowBottom: lastRow ? Math.round(lastRow.bottom) : null,
        viewportBottom: Math.round(viewport.bottom),
      };
    });

    await step("tool activity does not snap a detached reader", async () => {
      const marker = `${token}-tool`;
      const previousTurnId = (await backend.thread(threadId)).latestTurn.turnId;
      await composeAndSend(
        driver,
        `Use the shell to run \`sleep 5 && ls src\`, then reply with exactly one line: ${marker} ok`,
      );
      // Let the send's own scroll-to-end finish before the reader scrolls away.
      await waitFor(
        async () => {
          const turn = (await backend.thread(threadId))?.latestTurn;
          return turn?.turnId !== previousTurnId &&
            turn?.state === "running" &&
            Date.now() - Date.parse(turn.startedAt) > 1_500
            ? turn
            : null;
        },
        { label: "the tool turn to be under way", timeoutMs: 30_000 },
      );
      const viewport = await transcriptViewport(driver);
      const detachAttempts = await detachTranscript(driver, viewport, -400);
      const anchor = await pickAnchorRow(driver, viewport);
      const detachedAt = await backend.thread(threadId);
      const activitiesAtDetach = latestTurnActivityCount(detachedAt);
      const drift = [];
      for (;;) {
        const current = await backend.thread(threadId);
        const top = await rowTop(driver, anchor.id);
        if (top === null)
          throw new Error(`Anchor row ${anchor.id} left the viewport while detached.`);
        drift.push(Math.round((top - anchor.top) * 10) / 10);
        if (!(await scrollToBottomOffered(driver)))
          throw new Error("Activity snapped the detached transcript to the end.");
        if (current.latestTurn.state !== "running") break;
        if (drift.length > 200) throw new Error("The tool turn did not finish.");
        await sleep(300);
      }
      const settled = await waitForSettled(
        backend,
        threadId,
        "the tool turn",
        previousTurnId,
        60_000,
      );
      if (userMessagesWith(settled, marker).length !== 1)
        throw new Error(`"${marker}" was not sent exactly once.`);
      const toolActivitiesWhileDetached = latestTurnActivityCount(settled) - activitiesAtDetach;
      if (toolActivitiesWhileDetached <= 0)
        throw new Error("No tool activity arrived while detached.");
      await sleep(800);
      const maxDrift = Math.max(...drift.map(Math.abs));
      if (maxDrift > 2)
        throw new Error(`The detached transcript moved ${maxDrift}px under tool activity.`);
      if (!(await scrollToBottomOffered(driver)))
        throw new Error("The final reply snapped the detached transcript.");
      return {
        detachAttempts,
        samples: drift.length,
        maxDriftPx: maxDrift,
        toolActivitiesWhileDetached,
      };
    });

    await step("switch to another thread and back with the right content", async () => {
      const secondary = await backend.thread(FIXTURE_SECONDARY_THREAD_ID);
      const own = await backend.thread(threadId);
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_SECONDARY_THREAD_ID] });
      await waitFor(
        async () =>
          (await activeThreadId(driver)) === FIXTURE_SECONDARY_THREAD_ID &&
          (await renderedMessageIds(driver)).includes(secondary.messages.at(-1).id),
        { label: "the secondary thread", timeoutMs: 20_000 },
      );
      await driver.tap({ attribute: ["data-thread-id", threadId] });
      await waitFor(
        async () =>
          (await activeThreadId(driver)) === threadId &&
          (await renderedMessageIds(driver)).includes(own.messages.at(-1).id),
        { label: "the J2 thread again", timeoutMs: 20_000 },
      );
      const foreign = new Set(secondary.messages.map((message) => message.id));
      const rendered = await renderedMessageIds(driver);
      const leaked = rendered.filter((id) => foreign.has(id));
      if (leaked.length > 0)
        throw new Error(`Secondary-thread rows rendered in J2: ${leaked.join(", ")}`);
      await sleep(500);
      return { renderedRows: rendered.length, atEnd: !(await scrollToBottomOffered(driver)) };
    });
  } finally {
    await deleteWorkflowThread(
      backend,
      threadId ?? (await threadWithMessage(backend, `${token}-long`).catch(() => null))?.id,
    );
  }
  return { threadId, token };
}

/**
 * Whether rendered text contains `needle` (Electron: element text; Native: raw
 * text nodes). `scope` limits the search: "explorer" is the Explorer pane,
 * whose preview must not be confused with the same text in the transcript.
 */
async function renderedTextIncludes(driver, needle, scope = null) {
  if (driver.kind === "electron") {
    const root =
      scope === "explorer"
        ? `document.querySelector('[aria-label="Search files"]')?.closest("aside")?.parentElement`
        : "document.body";
    // File previews render inside a shadow root (<diffs-container>), which
    // innerText does not cross; read the rendered text of both (displayed
    // shadow children only: innerText of a hidden <style> is its source).
    return driver.evaluate(
      `(() => { const root = ${root}; if (!root) return false; const shadowText = Array.from(root.querySelectorAll("*")).flatMap((node) => Array.from(node.shadowRoot?.children ?? [])).filter((child) => getComputedStyle(child).display !== "none").map((child) => child.innerText ?? "").join("\\n"); return (root.innerText + "\\n" + shadowText).includes(${JSON.stringify(needle)}); })()`,
    );
  }
  const documentNode = await driver.documentRoot();
  const root =
    scope === "explorer"
      ? nativeNodesMatchingClasses(documentNode, ".ExplorerDockBody")[0]
      : documentNode;
  if (!root) return false;
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    const attributes = node?.attributes ?? [];
    for (let index = 0; index + 1 < attributes.length; index += 2) {
      if (attributes[index] === "text" && String(attributes[index + 1]).includes(needle))
        return true;
    }
    queue.push(...(node?.children ?? []));
  }
  return false;
}

const DOCK_TARGETS = {
  addPanel: { label: "Add panel" },
  explorerItem: {
    electron: { selector: '[role="menuitem"]', text: "Explorer" },
    native: { text: "Explorer", within: ".LxMenuLayer" },
  },
  search: { label: "Search files" },
  retry: {
    electron: { selector: '[role="alert"] button', text: "Retry" },
    native: { text: "Retry" },
  },
};

function dockTab(driver, title) {
  return pick(driver, {
    electron: { selector: `button[title=${JSON.stringify(title)}][aria-pressed]` },
    native: { label: title },
  });
}

/** Selects a dock tab, adding its pane from the Add panel menu when the dock lacks it. */
async function openDockTab(driver, title) {
  const tab = dockTab(driver, title);
  if (!(await driver.find(tab))) {
    await driver.tap(DOCK_TARGETS.addPanel);
    await driver.tap(
      pick(driver, {
        electron: { selector: '[role="menuitem"]', text: title },
        native: { text: title, within: ".LxMenuLayer" },
      }),
    );
    await waitFor(() => driver.find(tab), { label: `the ${title} tab` });
  }
  await driver.tap(tab);
}

function treeRow(driver, path, kind) {
  return pick(driver, {
    electron: { selector: `button[title=${JSON.stringify(path)}]` },
    native: { label: kind === "directory" ? `Expand ${path}` : `Open ${path}` },
  });
}

async function openExplorerFromDock(driver) {
  // From the empty dock's launcher Files opens directly; otherwise add it as a tab.
  await openDockWithPane(driver, "Open Files");
  if (!(await driver.find(DOCK_TARGETS.search))) {
    await driver.tap(DOCK_TARGETS.addPanel);
    await driver.tap(pick(driver, DOCK_TARGETS.explorerItem));
  }
  await waitFor(() => driver.find(DOCK_TARGETS.search), { label: "the Explorer pane" });
}

async function openTreeFile(driver, path) {
  const directory = path.split("/").slice(0, -1).join("/");
  const fileTarget = treeRow(driver, path, "file");
  const visible = () =>
    waitFor(() => driver.find(fileTarget), { label: path, timeoutMs: 3_000 }).catch(() => null);
  if (!(await visible()) && directory) {
    // Expand only a collapsed directory; tapping an expanded one would close it.
    const collapsed = pick(driver, {
      electron: { selector: `button[title=${JSON.stringify(directory)}][aria-expanded="false"]` },
      native: { label: `Expand ${directory}` },
    });
    if (await driver.find(collapsed)) await driver.tap(collapsed);
  }
  await driver.tap(fileTarget);
}

/**
 * J3 — Explorer: open from the dock → workspace listing → search → select and
 * preview a real file → Diff → close/reopen and reload persistence → a real
 * read failure recovered with Retry.
 */
export async function workflowJ3(context) {
  const { driver, run, step } = context;
  const workspaceRoot =
    run.seed?.fixture?.workspaceRoot ?? readComparisonFixtureManifest().workspaceRoot;

  await step("open Explorer from the dock on the fixture workspace", async () => {
    // An existing thread: Native's new-thread landing keeps the dock disabled
    // (Electron allows it on the draft); recorded as a separate parity gap.
    // Arrive from another thread so Explorer starts from its reset browse state.
    await driver.tap({ attribute: ["data-thread-id", FIXTURE_SECONDARY_THREAD_ID] });
    await waitFor(async () => (await activeThreadId(driver)) === FIXTURE_SECONDARY_THREAD_ID, {
      label: "the secondary thread",
    });
    await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
    await waitFor(async () => (await activeThreadId(driver)) === FIXTURE_TRANSCRIPT_THREAD_ID, {
      label: "the fixture transcript thread",
    });
    if (!(await driver.find(DOCK_TARGETS.search))) await openExplorerFromDock(driver);
    const expected = readdirSync(workspaceRoot).filter((name) => !name.startsWith("."));
    const missing = [];
    for (const name of expected) {
      const isDirectory = statSync(join(workspaceRoot, name)).isDirectory();
      const target = pick(driver, {
        electron: { selector: `button[title=${JSON.stringify(name)}]` },
        native: { label: `${isDirectory ? "Expand" : "Open"} ${name}` },
      });
      const shown = await waitFor(() => driver.find(target), {
        label: `the ${name} entry`,
        timeoutMs: 10_000,
      }).catch(() => null);
      if (!shown) missing.push(name);
    }
    if (missing.length > 0)
      throw new Error(`Workspace entries missing from Explorer: ${missing.join(", ")}`);
    return { workspaceRoot, entries: expected };
  });

  await step("search the workspace for a file", async () => {
    await driver.tap(DOCK_TARGETS.search);
    await driver.type("math");
    const result = pick(driver, {
      electron: { selector: 'button[title="src/math.ts"]' },
      native: { label: "Open src/math.ts" },
    });
    await waitFor(() => driver.find(result), { label: "the src/math.ts result" });
    const excluded = pick(driver, {
      electron: { selector: 'button[title="src/greeting.ts"]' },
      native: { label: "Open src/greeting.ts" },
    });
    if (await driver.find(excluded)) throw new Error("Search did not filter out greeting.ts.");
    // Clear the query. Electron: Escape in the field. The DevTool cannot send
    // keys to Native, whose query resets on a thread switch, so go away and back.
    if (driver.kind === "electron") {
      await driver.press("Escape");
    } else {
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_SECONDARY_THREAD_ID] });
      await waitFor(async () => (await activeThreadId(driver)) === FIXTURE_SECONDARY_THREAD_ID, {
        label: "the secondary thread",
      });
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
      await waitFor(() => driver.find(DOCK_TARGETS.search), { label: "Explorer on return" });
    }
    await waitFor(
      async () => (await driver.find(treeRow(driver, "package.json", "file"))) !== null,
      {
        label: "the tree after clearing search",
      },
    );
    return { query: "math", cleared: driver.kind === "electron" ? "Escape" : "thread switch" };
  });

  await step("select a real file and preview its contents", async () => {
    // Preview another file first so the math.ts content is proven to come from this selection.
    await openTreeFile(driver, "package.json");
    await waitFor(() => renderedTextIncludes(driver, "synara-fixture-app", "explorer"), {
      label: "the package.json preview",
    });
    await waitFor(async () => !(await renderedTextIncludes(driver, "clamp", "explorer")), {
      label: "math.ts to leave the preview",
    });
    // A click that lands while the tree is still laying out rows can miss; a
    // user clicks again, so retry once and record it.
    let attempts = 0;
    for (;;) {
      attempts += 1;
      await openTreeFile(driver, "src/math.ts");
      const shown = await waitFor(() => renderedTextIncludes(driver, "clamp", "explorer"), {
        label: "the math.ts preview",
        timeoutMs: attempts === 1 ? 5_000 : 15_000,
      }).catch((error) => (attempts === 1 ? null : Promise.reject(error)));
      if (shown) break;
    }
    const onDisk = readFileSync(join(workspaceRoot, "src/math.ts"), "utf8");
    if (!onDisk.includes("clamp")) throw new Error("Fixture math.ts changed unexpectedly.");
    return { path: "src/math.ts", attempts };
  });

  await step("switch to Diff and see the file's change", async () => {
    const numstat = execFileSync(
      "git",
      ["-C", workspaceRoot, "diff", "--numstat", "--", "src/math.ts"],
      {
        encoding: "utf8",
      },
    ).trim();
    const [added, removed] = numstat.split(/\s+/);
    if (!added) throw new Error("The fixture workspace has no src/math.ts change to show.");
    // The dock opened on Files from the launcher, so Diff may not be a tab yet.
    await openDockTab(driver, "Diff");
    await waitFor(
      () =>
        driver.kind === "electron"
          ? renderedTextIncludes(driver, `math.ts\nsrc/\n+${added}\n-${removed}`)
          : driver.find({ label: "Collapse src/math.ts" }),
      { label: "src/math.ts in the Diff pane", timeoutMs: 20_000 },
    );
    return { file: "src/math.ts", added: Number(added), removed: Number(removed) };
  });

  await step("close Explorer, reopen it, and keep the dock across a reload", async () => {
    await driver.tap({ label: "Close Explorer" });
    await waitFor(async () => !(await driver.find({ label: "Close Explorer" })), {
      label: "Explorer to close",
    });
    await openExplorerFromDock(driver);
    await driver.reload();
    await waitFor(
      async () =>
        (await driver.find({ label: "Close Explorer" })) &&
        (await driver.find({ label: "Close Diff" })),
      { label: "the Explorer and Diff tabs after reload", timeoutMs: 30_000 },
    );
    return { persisted: ["Diff", "Explorer"] };
  });

  await step("recover from a real read failure with Retry", async () => {
    const target = join(workspaceRoot, "docs/notes.md");
    const mode = statSync(target).mode & 0o777;
    chmodSync(target, 0o000);
    try {
      await driver.tap(dockTab(driver, "Explorer"));
      await openTreeFile(driver, "docs/notes.md");
      await waitFor(() => driver.find(pick(driver, DOCK_TARGETS.retry)), {
        label: "the read error with Retry",
        timeoutMs: 20_000,
      });
    } finally {
      chmodSync(target, mode);
    }
    await driver.tap(pick(driver, DOCK_TARGETS.retry));
    await waitFor(() => renderedTextIncludes(driver, "Keep functions small", "explorer"), {
      label: "notes.md after Retry",
      timeoutMs: 20_000,
    });
    return { path: "docs/notes.md" };
  });

  return { workspaceRoot };
}

const SETTINGS_TARGETS = {
  newThread: NAVIGATION_TARGETS.newThread,
  section: (name) => ({ electron: { selector: "button", text: name }, native: { label: name } }),
  segment: (group, option) => ({
    electron: { selector: `[aria-label=${JSON.stringify(group)}] [role="radio"]`, text: option },
    native: { label: `${group}: ${option}` },
  }),
  streaming: {
    electron: { selector: '[role="switch"][aria-label="Stream assistant messages"]' },
    native: { label: "Stream assistant messages" },
  },
};

// Electron lists automations in the sidebar surface; a row is a `div[role="button"]`
// (it nests its own buttons), not a <button>.
const AUTOMATION_ROW_SELECTOR = '[role="button"]';

/** Settings nav label of the section that owns the streaming switch (`settingsNavigation.ts`). */
const BEHAVIOR_SECTION = "Chat behavior";

/** Scrolls the page content until `target` is on screen. */
async function scrollIntoView(driver, target, point, maxSteps = 10) {
  for (let index = 0; index < maxSteps; index += 1) {
    const box = await driver.find(target);
    if (box && box.y > 40 && box.y < 760) return box;
    await driver.scroll(point, box && box.y <= 40 ? -250 : 250);
    await sleep(350);
  }
  throw new Error(`Could not scroll ${JSON.stringify(target)} into view.`);
}

/** The applied theme variant and UI density as the renderer shows them. */
async function appliedAppearance(driver) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `({ theme: document.documentElement.dataset.themeVariant, density: document.documentElement.dataset.uiDensity })`,
    );
  }
  const root = nativeNodesMatchingClasses(await driver.documentRoot(), ".SliceRoot")[0];
  const attributes = root?.attributes ?? [];
  let classes = "";
  for (let index = 0; index + 1 < attributes.length; index += 2) {
    if (attributes[index] === "class") classes = String(attributes[index + 1]);
  }
  return {
    theme: /SliceRoot--theme-(\w+)/.exec(classes)?.[1],
    density: /SliceRoot--density-(\w+)/.exec(classes)?.[1],
  };
}

/** `synara:theme` is either a bare mode ("dark") or a serialized theme state with `mode`. */
function parseThemeMode(raw) {
  if (raw === null || raw === undefined) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : (parsed?.mode ?? null);
  } catch {
    return raw;
  }
}

/** Persisted theme mode, UI density and the unknown sentinel from renderer storage. */
async function persistedAppearance(driver, run) {
  let theme;
  let appSettings;
  if (driver.kind === "electron") {
    const raw = await driver.evaluate(
      `JSON.stringify({ theme: localStorage.getItem("synara:theme"), appSettings: localStorage.getItem("synara:app-settings:v1") })`,
    );
    ({ theme, appSettings } = JSON.parse(raw));
  } else {
    const kv = JSON.parse(
      readFileSync(join(run.stateRoot, "lynx", "synara-lynx-slice", "kv.json"), "utf8"),
    );
    theme = kv["synara:theme"];
    appSettings = kv["synara:app-settings:v1"];
  }
  const settings = JSON.parse(appSettings ?? "{}");
  return {
    themeMode: parseThemeMode(theme),
    density: settings.uiDensity,
    sentinel: settings[COMPARISON_UNKNOWN_SETTING.key],
  };
}

async function switchIsOn(driver, target) {
  if (driver.kind === "electron") {
    return driver.evaluate(
      `document.querySelector(${JSON.stringify(target.selector)})?.getAttribute("aria-checked") === "true"`,
    );
  }
  const box = await driver.find(target);
  if (!box) return null;
  const root = await driver.documentRoot();
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node.nodeId === box.nodeId) {
      const attributes = node.attributes ?? [];
      for (let index = 0; index + 1 < attributes.length; index += 2) {
        if (attributes[index] === "accessibility-value") return attributes[index + 1] === "On";
      }
      return null;
    }
    queue.push(...(node.children ?? []));
  }
  return null;
}

async function openSettingsSection(driver, section) {
  if (!(await settingsShown(driver))) await openSettings(driver);
  await waitFor(() => settingsShown(driver), { label: "Settings" });
  await driver.tap(pick(driver, SETTINGS_TARGETS.section(section)));
  await sleep(500);
}

/**
 * J4 — page ↔ Settings repeatedly with one correct sidebar → change theme and
 * density → persisted with unknown settings kept → survives a reload → a
 * server-backed setting stays consistent across both clients.
 */
export async function workflowJ4(context) {
  const { driver, backend, run, step, openPeer } = context;
  const contentPoint = { x: 700, y: 420 };

  await step("switch between a thread and Settings with one correct sidebar", async () => {
    await showAppSidebar(driver);
    await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
    const rounds = [];
    for (let round = 0; round < 3; round += 1) {
      const openedAt = Date.now();
      await openSettings(driver);
      await waitFor(() => settingsShown(driver), { label: "the Settings sidebar" });
      if (await driver.find(pick(driver, SETTINGS_TARGETS.newThread)))
        throw new Error("The app sidebar stayed next to Settings.");
      if (!(await driver.find(pick(driver, SETTINGS_TARGETS.section("Appearance"))))) {
        throw new Error("Settings sections are missing.");
      }
      const settingsMs = Date.now() - openedAt;
      await showAppSidebar(driver);
      await waitFor(() => driver.find(pick(driver, SETTINGS_TARGETS.newThread)), {
        label: "the app sidebar",
      });
      if (await settingsShown(driver))
        throw new Error("The Settings sidebar stayed after returning.");
      const returned = await waitFor(
        async () => (await activeThreadId(driver)) === FIXTURE_TRANSCRIPT_THREAD_ID,
        {
          label: "the thread to be active again",
        },
      ).catch(() => false);
      rounds.push({ settingsMs, returnedToThread: Boolean(returned) });
    }
    if (rounds.some((round) => !round.returnedToThread)) {
      throw new Error(`Back to app did not return to the thread: ${JSON.stringify(rounds)}`);
    }
    return { rounds };
  });

  await step("change theme and density; the app applies them", async () => {
    const before = await persistedAppearance(driver, run);
    // Electron re-encodes app settings through its schema on load and drops
    // unknown keys (recorded, not asserted); Native must keep them.
    if (driver.kind === "native" && before.sentinel !== COMPARISON_UNKNOWN_SETTING.value) {
      throw new Error(
        `The seeded unknown setting is missing before the change: ${JSON.stringify(before)}`,
      );
    }
    await openSettingsSection(driver, "Appearance");
    await driver.tap(pick(driver, SETTINGS_TARGETS.segment("Theme preference", "Light")));
    const density = pick(driver, SETTINGS_TARGETS.segment("UI density", "Compact"));
    await scrollIntoView(driver, density, contentPoint);
    await driver.tap(density);
    const applied = await waitFor(
      async () => {
        const state = await appliedAppearance(driver);
        return state.theme === "light" && state.density === "compact" ? state : null;
      },
      { label: "light theme and compact density applied" },
    );
    return { before, applied };
  });

  await step("persist the change and keep settings the app does not know", async () => {
    const persisted = await waitFor(
      async () => {
        const state = await persistedAppearance(driver, run);
        return state.themeMode === "light" && state.density === "compact" ? state : null;
      },
      { label: "the persisted appearance" },
    );
    const unknownSettingKept = persisted.sentinel === COMPARISON_UNKNOWN_SETTING.value;
    if (driver.kind === "native" && !unknownSettingKept) {
      throw new Error(`Saving settings dropped the unknown setting: ${JSON.stringify(persisted)}`);
    }
    return { ...persisted, unknownSettingKept };
  });

  await step("keep the appearance across a renderer reload", async () => {
    await driver.reload();
    const applied = await waitFor(
      async () => {
        const state = await appliedAppearance(driver).catch(() => ({}));
        return state.theme === "light" && state.density === "compact" ? state : null;
      },
      { label: "the appearance after reload", timeoutMs: 30_000 },
    );
    return { applied, persisted: await persistedAppearance(driver, run) };
  });

  await step("keep a server setting consistent across both clients", async () => {
    const peer = await openPeer();
    const readServer = async () =>
      (await backend.request("server.getSettings", {})).enableAssistantStreaming;
    if ((await readServer()) !== true) throw new Error("Streaming should start enabled.");
    const streaming = pick(driver, SETTINGS_TARGETS.streaming);
    const peerStreaming = pick(peer, SETTINGS_TARGETS.streaming);
    await openSettingsSection(driver, BEHAVIOR_SECTION);
    await openSettingsSection(peer, BEHAVIOR_SECTION);
    // A client showing that section sees a change made in the other client either
    // live or, at the latest, when the section is opened again.
    const observe = async (client, target, expected) => {
      const live = await waitFor(async () => (await switchIsOn(client, target)) === expected, {
        label: "a live update",
        timeoutMs: 8_000,
      }).catch(() => false);
      if (live) return "live";
      await client.tap(pick(client, SETTINGS_TARGETS.section("General")));
      await openSettingsSection(client, BEHAVIOR_SECTION);
      await waitFor(async () => (await switchIsOn(client, target)) === expected, {
        label: `the ${client.kind} client to show streaming ${expected ? "on" : "off"}`,
      });
      return "on reopen";
    };
    await driver.tap(streaming);
    await waitFor(async () => (await readServer()) === false, {
      label: "the server to store streaming off",
    });
    const peerSaw = await observe(peer, peerStreaming, false);
    await peer.tap(peerStreaming);
    await waitFor(async () => (await readServer()) === true, {
      label: "the server to store streaming on",
    });
    const driverSaw = await observe(driver, streaming, true);
    await showAppSidebar(peer);
    return {
      [`${driver.kind}To${peer.kind}`]: peerSaw,
      [`${peer.kind}To${driver.kind}`]: driverSaw,
    };
  });

  await step("restore the canonical appearance", async () => {
    await openSettingsSection(driver, "Appearance");
    await scrollIntoView(
      driver,
      pick(driver, SETTINGS_TARGETS.segment("Theme preference", "Dark")),
      contentPoint,
    );
    await driver.tap(pick(driver, SETTINGS_TARGETS.segment("Theme preference", "Dark")));
    const density = pick(driver, SETTINGS_TARGETS.segment("UI density", "Comfortable"));
    await scrollIntoView(driver, density, contentPoint);
    await driver.tap(density);
    await waitFor(
      async () => {
        const state = await appliedAppearance(driver);
        return state.theme === "dark" && state.density === "comfortable";
      },
      { label: "the canonical appearance" },
    );
    await showAppSidebar(driver);
    return await persistedAppearance(driver, run);
  });

  return {};
}

async function automationNamed(backend, name) {
  const list = await backend.request("automation.list", {});
  return list.definitions.find((definition) => definition.name === name) ?? null;
}

/** Chooses a value in a detail-page select. */
async function chooseDetailOption(driver, label, value, optionText) {
  if (driver.kind === "electron") {
    // Electron renders these as native <select> elements whose popup menu is
    // outside the page, so CDP input cannot reach it; set the value and fire
    // the change event the popup would.
    const changed = await driver.evaluate(`(() => {
      const select = Array.from(document.querySelectorAll("select")).find((candidate) =>
        Array.from(candidate.options).some((option) => option.value === ${JSON.stringify(value)}),
      );
      if (!select) return false;
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, ${JSON.stringify(value)});
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    })()`);
    if (!changed) throw new Error(`No ${label} select offers ${value}.`);
    return "select value (native popup not drivable)";
  }
  await driver.tap({ label });
  await driver.tap({ text: optionText, within: ".LxMenuLayer" });
  return "menu tap";
}

/**
 * J5 — create an automation → open it → edit a field → pause/resume → back to
 * the list and into the detail again, each change checked against the
 * canonical automation store. Running it is out of scope (plan N3).
 */
export async function workflowJ5(context) {
  const { driver, backend, step } = context;
  const name = `J5 ${driver.kind} ${Date.now().toString(36)}`;
  const prompt = `Summarize the latest changes (${name}).`;
  const pauseButton = { label: "Pause" };
  const resumeButton = { label: "Resume" };

  try {
    await step("create an automation", async () => {
      await showAppSidebar(driver);
      // Start from a thread: Electron's sidebar entry does not leave an open
      // automation detail (it stays on the current automations route).
      await driver.tap({ attribute: ["data-thread-id", FIXTURE_TRANSCRIPT_THREAD_ID] });
      await openAutomationsSurface(driver);
      await driver.tap(
        pick(driver, {
          electron: { selector: "button", text: "New automation" },
          native: { label: "New automation" },
        }),
      );
      await driver.tap({ label: "Automation title" });
      await driver.type(name);
      await driver.tap({ label: "Automation prompt" });
      await driver.type(prompt);
      // The local-checkout fallback warning must be acknowledged before Create.
      await driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"] input[type="checkbox"]' },
          native: { label: /^Auto fallback may use local checkout\./ },
        }),
      );
      await driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"] button', text: "Create" },
          native: { text: "Create" },
        }),
      );
      const created = await waitFor(() => automationNamed(backend, name), {
        label: "the automation in the store",
      });
      await waitFor(async () => !(await driver.find({ label: "Automation title" })), {
        label: "the create dialog to close",
      });
      await sleep(400);
      if (created.prompt !== prompt || created.enabled !== true) {
        throw new Error(
          `Stored automation differs: ${JSON.stringify({ prompt: created.prompt, enabled: created.enabled })}`,
        );
      }
      await waitFor(
        () =>
          driver.find(
            pick(driver, {
              electron: { selector: AUTOMATION_ROW_SELECTOR, text: name },
              native: { label: new RegExp(`^${name}\\. `) },
            }),
          ),
        { label: "the automation row" },
      );
      return {
        id: created.id,
        worktreeMode: created.worktreeMode,
        acknowledgedRisks: created.acknowledgedRisks,
      };
    });

    const row = () =>
      pick(driver, {
        electron: { selector: AUTOMATION_ROW_SELECTOR, text: name },
        native: { label: new RegExp(`^${name}\\. `) },
      });

    await step("open it and edit where it runs", async () => {
      await driver.tap(row());
      await waitFor(() => driver.find(pauseButton), { label: "the automation detail" });
      const via = await chooseDetailOption(driver, "Runs in", "worktree", "Worktree");
      const edited = await waitFor(
        async () => {
          const definition = await automationNamed(backend, name);
          return definition?.worktreeMode === "worktree" ? definition : null;
        },
        { label: "worktreeMode to be stored" },
      );
      return { worktreeMode: edited.worktreeMode, via };
    });

    await step("pause and resume it", async () => {
      await driver.tap(pauseButton);
      await waitFor(async () => (await automationNamed(backend, name))?.enabled === false, {
        label: "the automation to be paused in the store",
      });
      await waitFor(() => driver.find(resumeButton), { label: "the Resume action" });
      await driver.tap(resumeButton);
      await waitFor(async () => (await automationNamed(backend, name))?.enabled === true, {
        label: "the automation to be resumed in the store",
      });
      await waitFor(() => driver.find(pauseButton), { label: "the Pause action again" });
      return { pausedThenResumed: true };
    });

    await step("return to the list and back into the same state", async () => {
      await driver.tap(
        pick(driver, {
          electron: { selector: "button", text: "Automations" },
          native: { label: "Back to automations" },
        }),
      );
      await waitFor(() => driver.find(row()), { label: "the automation row" });
      await driver.tap(row());
      await waitFor(() => driver.find(pauseButton), { label: "the detail again" });
      const definition = await automationNamed(backend, name);
      if (definition.worktreeMode !== "worktree" || definition.enabled !== true) {
        throw new Error(`State drifted: ${JSON.stringify(definition)}`);
      }
      const shownWorktree =
        driver.kind === "electron"
          ? await driver.evaluate(
              `Array.from(document.querySelectorAll("select")).some((select) => select.value === "worktree")`,
            )
          : Boolean(await driver.find({ text: "Worktree" }));
      if (!shownWorktree) throw new Error("The detail does not show the stored Worktree mode.");
      return { worktreeMode: definition.worktreeMode, enabled: definition.enabled };
    });
  } finally {
    const leftover = await automationNamed(backend, name).catch(() => null);
    if (leftover)
      await backend.request("automation.delete", { id: leftover.id }).catch(() => undefined);
  }

  return { name };
}

/**
 * Kanban cards in board order as the renderer labels them ("<title>, <status>").
 * Both renderers expose the same accessible card label.
 */
async function kanbanCards(driver, knownTitles) {
  let labels;
  if (driver.kind === "electron") {
    // Electron's cards carry no label: a card is `li > button` whose text lines are
    // the title first and the status last (branch and age in between).
    labels = await driver.evaluate(
      `Array.from(document.querySelectorAll("main li > button")).filter((node) => node.getBoundingClientRect().width > 0).map((node) => (node.innerText ?? "").split("\\n").map((line) => line.trim()).filter(Boolean)).filter((lines) => lines.length >= 2).map((lines) => lines[0] + ", " + lines.at(-1))`,
    );
  } else {
    labels = [];
    const queue = [await driver.documentRoot()];
    while (queue.length > 0) {
      const node = queue.shift();
      const attributes = node?.attributes ?? [];
      for (let index = 0; index + 1 < attributes.length; index += 2) {
        if (attributes[index] === "accessibility-label") labels.push(String(attributes[index + 1]));
      }
      queue.push(...(node?.children ?? []));
    }
  }
  const cards = [];
  for (const label of labels) {
    const split = label.lastIndexOf(", ");
    if (split < 0) continue;
    const title = label.slice(0, split);
    if (!knownTitles.has(title)) continue;
    cards.push({ title, status: label.slice(split + 2) });
  }
  return cards;
}

// Electron keeps "Send as draft" tasks in its local composer store: client-only,
// so they are left out when boards are compared with the store or each other.
function canonicalCards(cards) {
  return cards.filter((card) => card.status !== "Draft");
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The canonical board as [{ threadId, status }], matching cards by the current titles. */
async function boardByThread(driver, backend, projectId) {
  const threads = await projectThreadTitles(backend, projectId);
  const idByTitle = new Map(threads.map((thread) => [thread.title, thread.id]));
  const cards = canonicalCards(await kanbanCards(driver, new Set(idByTitle.keys())));
  return cards.map((card) => ({ threadId: idByTitle.get(card.title), status: card.status }));
}

async function projectThreadTitles(backend, projectId) {
  const snapshot = await backend.snapshot();
  return snapshot.threads.filter(
    (thread) => thread.projectId === projectId && !thread.archivedAt && !thread.deletedAt,
  );
}

const KANBAN_NEW_TASK = {
  electron: { selector: "main button", text: "New task" },
  native: { label: "New task" },
};

async function openKanban(driver) {
  await openKanbanSurface(driver);
  // Electron opens on its Attention board, which regroups cards by what needs the
  // user; Classic is the status board the store and Native describe.
  if (driver.kind === "electron") {
    const classic = (pressed) => ({
      selector: `[aria-label="Board view"] button[aria-pressed="${pressed}"]`,
      text: "Classic",
    });
    await waitFor(
      async () => {
        if (await driver.find(classic(true))) return true;
        if (await driver.find(classic(false))) await driver.tap(classic(false));
        return false;
      },
      { label: "the Classic board" },
    );
  }
  await waitFor(() => driver.find(pick(driver, KANBAN_NEW_TASK)), { label: "the Kanban board" });
}

/**
 * J6 — populated Kanban (counts/order vs the store and the other client) →
 * create a task that runs a real turn → open it and return → survive a
 * reconnect; Pull Requests is a named blocked cell without a GitHub remote.
 */
export async function workflowJ6(context) {
  const { driver, backend, run, step, openPeer } = context;
  const projectId = run.seed?.fixture?.projectId ?? readComparisonFixtureManifest().projectId;
  const token = `J6-${driver.kind}-${Date.now().toString(36)}`;
  let createdThreadId = null;

  try {
    await step("show the populated board as the store and the other client do", async () => {
      await openKanban(driver);
      const threads = await projectThreadTitles(backend, projectId);
      const titles = new Set(threads.map((thread) => thread.title));
      const cards = await waitFor(
        async () => {
          const shown = canonicalCards(await kanbanCards(driver, titles));
          return shown.length === threads.length ? shown : null;
        },
        { label: `${threads.length} canonical cards` },
      );
      const peer = await openPeer();
      await openKanban(peer);
      const peerCards = canonicalCards(await kanbanCards(peer, titles));
      if (JSON.stringify(peerCards) !== JSON.stringify(cards)) {
        throw new Error(
          `Boards differ: ${JSON.stringify({ [driver.kind]: cards, [peer.kind]: peerCards })}`,
        );
      }
      return { cards, peerMatches: true };
    });

    await step("create a task that runs a real turn; both clients show it", async () => {
      await driver.tap(pick(driver, KANBAN_NEW_TASK));
      await driver.tap(
        pick(driver, {
          electron: {
            selector: '[role="dialog"]:not([data-closed]) [data-testid="composer-editor"]',
          },
          native: { label: "Task prompt" },
        }),
      );
      await driver.type(`Reply with exactly one line: ${token} ok`);
      // Must be off: a draft never reaches the server.
      const draftOn =
        driver.kind === "electron"
          ? await driver.evaluate(
              `document.querySelector('[role="dialog"]:not([data-closed]) input[type="checkbox"]')?.checked === true`,
            )
          : await switchIsOn(driver, { label: "Send as draft" });
      if (draftOn) throw new Error("Send as draft is on by default.");
      await driver.tap(
        pick(driver, {
          electron: { selector: '[role="dialog"]:not([data-closed]) button', text: "Create task" },
          native: { text: "Create task" },
        }),
      );
      const created = await waitFor(() => threadWithMessage(backend, token), {
        label: "the task thread in the store",
        timeoutMs: 30_000,
      });
      createdThreadId = created.id;
      const settled = await waitForSettled(backend, created.id, "the task turn", null, 180_000);
      if (settled.latestTurn.state !== "completed")
        throw new Error(`Task turn ended ${settled.latestTurn.state}.`);
      const titles = new Set([settled.title]);
      const completedAt = Date.parse(settled.latestTurn.completedAt);
      // A completed task card moves to Done; measure how soon each client shows it.
      const doneLatency = async (client) => {
        await waitFor(async () => (await kanbanCards(client, titles))[0]?.status === "Done", {
          label: `the card to show Done on ${client.kind}`,
          timeoutMs: 20_000,
          intervalMs: 100,
        });
        return Date.now() - completedAt;
      };
      const peer = await openPeer();
      const [driverDoneMs, peerDoneMs] = await Promise.all([
        doneLatency(driver),
        doneLatency(peer),
      ]);
      return {
        threadId: created.id,
        title: settled.title,
        [`${driver.kind}DoneMs`]: driverDoneMs,
        [`${peer.kind}DoneMs`]: peerDoneMs,
      };
    });

    await step("open the task and return to the board", async () => {
      const cardFor = (title) =>
        pick(driver, {
          electron: { selector: "main li > button", text: title },
          native: { label: new RegExp(`^${escapeRegExp(title)}, `) },
        });
      // The title can change (title generation), so resolve it right before tapping.
      await waitFor(
        async () => {
          const { title } = await backend.thread(createdThreadId);
          if (!(await driver.find(cardFor(title)))) return false;
          await driver.tap(cardFor(title));
          return true;
        },
        { label: "the task card", timeoutMs: 20_000 },
      );
      const thread = await backend.thread(createdThreadId);
      await waitFor(
        async () =>
          (await activeThreadId(driver)) === createdThreadId &&
          (await renderedMessageIds(driver)).includes(thread.messages.at(-1).id),
        { label: "the task transcript", timeoutMs: 20_000 },
      );
      await openKanban(driver);
      await waitFor(
        async () =>
          (await boardByThread(driver, backend, projectId)).some(
            (card) => card.threadId === createdThreadId,
          ),
        { label: "the card on the board again" },
      );
      return { opened: createdThreadId };
    });

    await step("keep the board across a reconnect", async () => {
      // Cards are compared by thread identity: a finished task may be retitled
      // by title generation at any moment.
      const before = await boardByThread(driver, backend, projectId);
      await driver.reload();
      // Like J1: Electron keeps the route; a LynxView reload returns to the
      // launch route, so Native reopens Kanban.
      const routeRestored = await waitFor(() => driver.find(pick(driver, KANBAN_NEW_TASK)), {
        label: "the board route",
        timeoutMs: 5_000,
      })
        .then(() => true)
        .catch(() => false);
      if (!routeRestored) await openKanban(driver);
      let after = [];
      await waitFor(
        async () => {
          after = await boardByThread(driver, backend, projectId).catch(() => []);
          return JSON.stringify(after) === JSON.stringify(before);
        },
        { label: "the board after reload", timeoutMs: 30_000 },
      ).catch(() => {
        throw new Error(`Board changed across reload: ${JSON.stringify({ before, after })}`);
      });
      return { cards: after.length, routeRestored };
    });

    await step("pull requests: same empty state (named blocked cell)", async () => {
      await openPullRequestsSurface(driver);
      // The Code review page lists pull requests and issues together, on both renderers.
      const emptyText = "No pull requests and issues found";
      const empty = await waitFor(() => renderedTextIncludes(driver, emptyText), {
        label: "the pull requests page",
        timeoutMs: 20_000,
      });
      return {
        blocked:
          "The fixture workspace has no GitHub remote, so the PR service has nothing to list; populated PR cells need a real repository.",
        emptyStateShown: empty,
      };
    });
  } finally {
    await deleteWorkflowThread(backend, createdThreadId);
  }

  return { token };
}

export const WORKFLOWS = Object.freeze({
  J1: workflowJ1,
  J2: workflowJ2,
  J3: workflowJ3,
  J4: workflowJ4,
  J5: workflowJ5,
  J6: workflowJ6,
});
