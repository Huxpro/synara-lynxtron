// Workflow definitions (plan N3) run by scripts/comparison-workflow-run.mjs.
// Each workflow receives one renderer driver plus the backend and returns a
// list of verified steps; any failed expectation throws with its context.
import { execFileSync } from "node:child_process";
import { chmodSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { readComparisonFixtureManifest } from "./comparison-fixture.mjs";
import { nativeNodesMatchingClasses } from "./comparison-measure.mjs";
import { waitFor } from "./comparison-workflow.mjs";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

export const FIXTURE_PROJECT_TITLE = "synara-fixture-app";

function pick(driver, targets) {
  return targets[driver.kind] ?? targets.both;
}

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
  );
}

/** A rendered message row inside the transcript viewport, to watch for movement. */
async function pickAnchorRow(driver, viewport) {
  // Any row crossing the viewport middle works; a long reply can span the
  // whole viewport with its top edge above it.
  const middle = (viewport.top + viewport.bottom) / 2;
  const rows = (await messageRowRects(driver)).filter(
    (row) => row.top <= middle && row.bottom >= middle,
  );
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

/** J1 — existing project → new thread → send → complete → model picker → stream → stop → resend. */
export async function workflowJ1(context) {
  const { driver, backend, step } = context;
  const token = `J1-${driver.kind}-${Date.now().toString(36)}`;

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

  const thread = await step("send and complete a real provider turn", async () => {
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
    return { threadId: settled.id, turnId: settled.latestTurn.turnId, assistantMessageId: last.id };
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
    );
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
      async () => userMessagesWith(await backend.thread(thread.threadId), continueToken).length > 0,
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

  return { threadId: thread.threadId, token };
}

function longPrompt(topic, marker) {
  return `Without using tools, write a numbered list of 70 one-line facts about ${topic}, one per line. First line: ${marker}`;
}

/**
 * J2 — long transcript → follow live output → scroll away → new output keeps
 * the reader's place → Jump → tool-only activity never snaps a detached reader
 * → switch threads and back with the right content.
 */
export async function workflowJ2(context) {
  const { driver, backend, step } = context;
  const token = `J2-${driver.kind}-${Date.now().toString(36)}`;
  let threadId;

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
    await composeAndSend(driver, longPrompt("mountains", `${token}-follow`));
    await waitForStreamingText(backend, threadId, streamTurnBefore, 1);
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
    const drift = [];
    const deadline = Date.now() + 2_500;
    while (Date.now() < deadline) {
      await sleep(300);
      const top = await rowTop(driver, anchor.id);
      if (top === null) throw new Error(`Anchor row ${anchor.id} left the viewport.`);
      drift.push(Math.round((top - anchor.top) * 10) / 10);
      if (!(await scrollToBottomOffered(driver)))
        throw new Error("Scroll to bottom disappeared while detached.");
    }
    const after = await backend.thread(threadId);
    const grewChars = after.messages.at(-1).text.length - startChars;
    if (grewChars <= 0) throw new Error("No new output arrived during the detach check.");
    const maxDrift = Math.max(...drift.map(Math.abs));
    if (maxDrift > 2)
      throw new Error(`The detached transcript moved ${maxDrift}px under new output.`);
    return { anchor: anchor.id, detachAttempts, maxDriftPx: maxDrift, grewChars };
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
    return driver.evaluate(`(${root})?.innerText.includes(${JSON.stringify(needle)}) === true`);
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

function treeRow(driver, path, kind) {
  return pick(driver, {
    electron: { selector: `button[title=${JSON.stringify(path)}]` },
    native: { label: kind === "directory" ? `Expand ${path}` : `Open ${path}` },
  });
}

async function openExplorerFromDock(driver) {
  if (!(await driver.find(DOCK_TARGETS.addPanel))) {
    await driver.tap({ label: "Toggle diff panel" });
    await waitFor(() => driver.find(DOCK_TARGETS.addPanel), { label: "the dock" });
  }
  await driver.tap(DOCK_TARGETS.addPanel);
  await driver.tap(pick(driver, DOCK_TARGETS.explorerItem));
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
    await driver.tap(dockTab(driver, "Diff"));
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

export const WORKFLOWS = Object.freeze({ J1: workflowJ1, J2: workflowJ2, J3: workflowJ3 });
