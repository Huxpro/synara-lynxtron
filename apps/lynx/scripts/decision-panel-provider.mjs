#!/usr/bin/env node
// Deterministic provider-protocol fixture for detached decision panels; no live model.
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
if (process.argv.includes("--version")) {
  console.log("codex 0.125.0");
  process.exit(0);
}
if (process.argv.includes("login") && process.argv.includes("status")) {
  console.error("Logged in using ChatGPT");
  process.exit(0);
}
if (process.argv[2] !== "app-server") throw new Error("Only app-server is supported");
const output = (frame) => process.stdout.write(JSON.stringify(frame) + "\n");
let pending = null;
createInterface({ input: process.stdin }).on("line", (line) => {
  const request = JSON.parse(line);
  if (request.method === undefined && request.id === 9000 && pending) {
    const { threadId, turnId } = pending;
    pending = null;
    const item = {
      id: randomUUID(),
      type: "agentMessage",
      text: "Decision received: " + JSON.stringify(request.result),
    };
    output({ method: "item/started", params: { threadId, turnId, item: { ...item, text: "" } } });
    output({
      method: "item/agentMessage/delta",
      params: { threadId, turnId, itemId: item.id, delta: item.text },
    });
    output({ method: "item/completed", params: { threadId, turnId, item } });
    output({
      method: "turn/completed",
      params: { threadId, turnId, turn: { id: turnId, status: "completed" } },
    });
    return;
  }
  if (request.id === undefined) return;
  let result = {};
  if (["thread/start", "thread/resume"].includes(request.method))
    result = { thread: { id: request.params.threadId ?? randomUUID() } };
  if (request.method === "model/list") result = { data: [], nextCursor: null };
  if (request.method === "turn/start") {
    const text = request.params.input
      .filter((x) => x.type === "text")
      .map((x) => x.text)
      .join("\n");
    if (!text.includes("CHAT-82")) {
      output({ id: request.id, error: { code: -32602, message: "Fixture accepts only CHAT-82" } });
      return;
    }
    const threadId = request.params.threadId,
      turnId = randomUUID();
    pending = { threadId, turnId };
    result = { turn: { id: turnId } };
    output({ id: request.id, result });
    output({
      method: "turn/started",
      params: { threadId, turnId, turn: { id: turnId, status: "inProgress" } },
    });
    setTimeout(() => {
      if (text.includes("APPROVAL"))
        output({
          id: 9000,
          method: "item/commandExecution/requestApproval",
          params: {
            threadId,
            turnId,
            itemId: randomUUID(),
            command: "git status --short",
            reason: "Inspect the workspace status",
          },
        });
      else
        output({
          id: 9000,
          method: "item/tool/requestUserInput",
          params: {
            threadId,
            turnId,
            itemId: randomUUID(),
            questions: [
              {
                id: "mode",
                header: "Mode",
                question: "Which mode should be used?",
                options: [
                  { label: "Read only", description: "Inspect files without changing them" },
                  { label: "Workspace write", description: "Allow changes in this workspace" },
                ],
              },
              {
                id: "notes",
                header: "Notes",
                question: "What should the agent check next?",
                options: [],
              },
            ],
          },
        });
    }, 400);
    return;
  }
  output({ id: request.id, result });
});
