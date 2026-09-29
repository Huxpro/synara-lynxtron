import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMPARISON_FIXTURE_IDS,
  comparisonFixtureContainerCommands,
  comparisonFixtureMismatches,
  comparisonFixtureSetupCommands,
  comparisonFixtureTurnCommand,
  fixtureTurnSettlement,
  readComparisonFixtureEntities,
} from "./comparison-fixture.mjs";

const manifest = {
  projectId: "project-1",
  workspaceRoot: "/fixture/app",
  sequence: 42,
  threads: [{ threadId: "thread-1", messageCount: 4, lastMessageId: "assistant:4" }],
};

describe("comparison fixture", () => {
  it("creates the fixture only through canonical orchestration commands", () => {
    const commands = comparisonFixtureSetupCommands("/fixture/app", "2026-09-29T00:00:00.000Z");
    expect(commands.map((command) => command.type)).toEqual([
      "project.create",
      "thread.create",
      "thread.create",
    ]);
    expect(commands[0]).toMatchObject({
      projectId: COMPARISON_FIXTURE_IDS.projectId,
      kind: "project",
      workspaceRoot: "/fixture/app",
    });
    expect(comparisonFixtureTurnCommand("thread-1", 1, "hello", "t")).toMatchObject({
      type: "thread.turn.start",
      commandId: "thread-1:turn-2",
      message: { messageId: "thread-1:user-2", role: "user", text: "hello", attachments: [] },
    });
  });

  it("seeds the Home and Studio containers exactly as the app creates them", () => {
    expect(
      comparisonFixtureContainerCommands(
        { homeDir: "/Users/me", studioWorkspaceRoot: "/Users/me/Documents/Synara/Studio" },
        "t",
      ),
    ).toEqual([
      {
        type: "project.create",
        commandId: `${COMPARISON_FIXTURE_IDS.homeProjectId}:create`,
        projectId: COMPARISON_FIXTURE_IDS.homeProjectId,
        kind: "chat",
        title: "Home",
        workspaceRoot: "/Users/me",
        createdAt: "t",
      },
      {
        type: "project.create",
        commandId: `${COMPARISON_FIXTURE_IDS.studioProjectId}:create`,
        projectId: COMPARISON_FIXTURE_IDS.studioProjectId,
        kind: "studio",
        title: "Studio",
        workspaceRoot: "/Users/me/Documents/Synara/Studio",
        createWorkspaceRootIfMissing: true,
        createdAt: "t",
      },
    ]);
    expect(comparisonFixtureContainerCommands({})).toEqual([]);
    expect(comparisonFixtureSetupCommands("/fixture/app", "t")[1]).toMatchObject({
      branch: "main",
    });
  });

  it("waits for a new turn to complete and release its session", () => {
    const thread = (state, turnId = "turn-2", activeTurnId = null) => ({
      latestTurn: { turnId, state },
      session: { activeTurnId },
    });

    expect(fixtureTurnSettlement(thread("completed", "turn-1"), "turn-1")).toEqual({
      settled: false,
      reason: "pending",
    });
    expect(fixtureTurnSettlement(thread("running"), "turn-1").settled).toBe(false);
    expect(fixtureTurnSettlement(thread("completed", "turn-2", "turn-2"), "turn-1")).toEqual({
      settled: false,
      reason: "session-active",
    });
    expect(fixtureTurnSettlement(thread("completed"), "turn-1")).toEqual({
      settled: true,
      ok: true,
      turnId: "turn-2",
    });
    expect(fixtureTurnSettlement(thread("error"), "turn-1")).toEqual({
      settled: true,
      ok: false,
      reason: "turn error",
    });
  });

  it("accepts a clone only when project, threads, transcript tails, and sequence match", () => {
    const entities = {
      projects: [{ projectId: "project-1", workspaceRoot: "/fixture/app" }],
      threads: [{ threadId: "thread-1", messageCount: 4, lastMessageId: "assistant:4" }],
      sequence: 42,
    };
    expect(comparisonFixtureMismatches(manifest, entities)).toEqual([]);
    expect(
      comparisonFixtureMismatches(manifest, { ...entities, threads: [], sequence: 45 }),
    ).toEqual([
      "thread thread-1 is missing, deleted, or archived",
      "event sequence 45 does not match 42",
    ]);
    expect(
      comparisonFixtureMismatches(manifest, {
        ...entities,
        projects: [],
        threads: [{ threadId: "thread-1", messageCount: 3, lastMessageId: "assistant:3" }],
      }),
    ).toEqual([
      "project project-1 is missing or hidden",
      "thread thread-1 has 3 messages, expected 4",
      "thread thread-1 ends at assistant:3, expected assistant:4",
    ]);
  });

  it("reads only visible entities from a cloned database", () => {
    const database = join(mkdtempSync(join(tmpdir(), "synara-fixture-entities-")), "state.sqlite");
    const sqlite = spawnSync(
      "sqlite3",
      [
        database,
        [
          "create table projection_projects(project_id text, kind text, workspace_root text, deleted_at text);",
          "create table projection_threads(thread_id text, project_id text, deleted_at text, archived_at text);",
          "create table projection_thread_messages(message_id text, thread_id text, sequence integer);",
          "create table orchestration_events(sequence integer);",
          "insert into projection_projects values ('project-1','project','/fixture/app',null), ('chat-1','chat','/home',null);",
          "insert into projection_threads values ('thread-1','project-1',null,null), ('thread-archived','project-1',null,'2026-01-01'), ('thread-deleted','project-1','2026-01-01',null);",
          "insert into projection_thread_messages values ('user:1','thread-1',1), ('assistant:2','thread-1',2);",
          "insert into orchestration_events values (7), (9);",
        ].join(" "),
      ],
      { encoding: "utf8" },
    );
    expect(sqlite.status).toBe(0);

    expect(readComparisonFixtureEntities(database)).toEqual({
      projects: [{ projectId: "project-1", workspaceRoot: "/fixture/app" }],
      threads: [
        {
          threadId: "thread-1",
          projectId: "project-1",
          messageCount: 2,
          lastMessageId: "assistant:2",
        },
      ],
      sequence: 9,
    });
  });
});
