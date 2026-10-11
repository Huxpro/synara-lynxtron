#!/usr/bin/env node
import { appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
// Isolated deterministic app-server fixture; no live-model claims.
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
let workspaceRoot = process.cwd();
const output = (frame) => process.stdout.write(JSON.stringify(frame) + "\n");
createInterface({ input: process.stdin }).on("line", (line) => {
  const request = JSON.parse(line);
  if (request.id === undefined) return;
  let result = {};
  if (["thread/start", "thread/resume"].includes(request.method) && request.params.cwd)
    workspaceRoot = request.params.cwd;
  if (["thread/start", "thread/resume"].includes(request.method))
    result = { thread: { id: request.params.threadId ?? randomUUID() } };
  if (request.method === "model/list") result = { data: [], nextCursor: null };
  if (request.method === "turn/start") {
    const text = request.params.input
      .filter((x) => x.type === "text")
      .map((x) => x.text)
      .join("\n");
    const recovery = text.startsWith(
      "Continue the interrupted task from the existing conversation and working state.",
    );
    if (!text.includes("CHAT-83") && !text.startsWith("CHAT-84") && !recovery) {
      output({
        id: request.id,
        error: { code: -32602, message: "Only CHAT-83, CHAT-84 or continuation is supported" },
      });
      return;
    }
    const threadId = request.params.threadId,
      turnId = randomUUID();
    output({ id: request.id, result: { turn: { id: turnId } } });
    output({
      method: "turn/started",
      params: { threadId, turnId, turn: { id: turnId, status: "inProgress" } },
    });
    setTimeout(() => {
      if (text.includes("FAILURE")) {
        output({
          method: "turn/completed",
          params: {
            threadId,
            turnId,
            turn: {
              id: turnId,
              status: "failed",
              error: { message: "Temporarily unavailable", codexErrorInfo: "serverOverloaded" },
            },
          },
        });
        return;
      }
      if (text.includes("FILES")) {
        if (!existsSync(join(workspaceRoot, ".chat83-owned")))
          throw new Error("Refusing to edit an unowned workspace");
        appendFileSync(join(workspaceRoot, "README.md"), "\n- Card action audit.\n");
        appendFileSync(join(workspaceRoot, "src/math.ts"), "\nexport const cardAudit = 83;\n");
        const item = {
          id: randomUUID(),
          type: "fileChange",
          status: "completed",
          changes: [
            {
              path: "README.md",
              kind: { type: "update", move_path: null },
              diff: "@@ -1 +1,3 @@\n # Card fixture\n+\n+- Card action audit.\n",
            },
            {
              path: "src/math.ts",
              kind: { type: "update", move_path: null },
              diff: "@@ -1 +1,3 @@\n export const baseline = true;\n+\n+export const cardAudit = 83;\n",
            },
          ],
        };
        output({ method: "item/started", params: { threadId, turnId, item } });
        output({ method: "item/completed", params: { threadId, turnId, item } });
      }
      const item = text.includes("PLAN")
        ? {
            id: randomUUID(),
            type: "plan",
            text: "# Card action audit\n\n## Summary\n\n- Read the existing code.\n- Apply the smallest safe change.\n- Run focused tests.\n",
          }
        : {
            id: randomUUID(),
            type: "agentMessage",
            text: text.startsWith("CHAT-84")
              ? "Context fixture acknowledged."
              : "Recovery received: " +
                JSON.stringify({
                  text,
                  model: request.params.model,
                  effort: request.params.effort,
                }),
          };
      output({ method: "item/started", params: { threadId, turnId, item: { ...item, text: "" } } });
      output({
        method: item.type === "plan" ? "item/plan/delta" : "item/agentMessage/delta",
        params: { threadId, turnId, itemId: item.id, delta: item.text },
      });
      output({ method: "item/completed", params: { threadId, turnId, item } });
      output({
        method: "turn/completed",
        params: { threadId, turnId, turn: { id: turnId, status: "completed" } },
      });
    }, 400);
    return;
  }
  output({ id: request.id, result });
});
