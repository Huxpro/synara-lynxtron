// Workflow definitions (plan N3) run by scripts/comparison-workflow-run.mjs.
// Each workflow receives one renderer driver plus the backend and returns a
// list of verified steps; any failed expectation throws with its context.
import { waitFor } from "./comparison-workflow.mjs";

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

export const WORKFLOWS = Object.freeze({ J1: workflowJ1 });
