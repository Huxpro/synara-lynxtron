// Canonical populated-workspace fixture for the Electron ↔ Lynxtron comparison
// harness (scripts/dev-electron-lynxtron.mjs).
//
// The fixture is created only through the server's canonical RPC surface: a
// real git workspace on disk, `project.create` / `thread.create` commands, and
// real provider turns. Once every turn has settled, the isolated server is
// stopped and its database is frozen with `sqlite3 .backup` into the fixture
// seed. The harness clones that seed per run and certifies against the entity
// set recorded in fixture.json, so a run can never silently fall back to an
// empty workspace, a hidden thread, or a different snapshot.
//
// usage: node scripts/comparison-fixture.mjs [--rebuild]
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Plain Node cannot load @synara/contracts (TypeScript with extensionless
// imports), so the fixture keeps a copy that comparison-fixture.test.mjs pins to
// WS_PROTOCOL_* — a server protocol bump fails that test instead of the run.
export const COMPARISON_WS_PROTOCOL = Object.freeze({ epoch: 1, minRevision: 2, maxRevision: 2 });

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const COMPARISON_FIXTURE_VERSION = 2;
export const COMPARISON_FIXTURE_MODEL = Object.freeze({
  provider: "codex",
  model: "gpt-5.6-luna",
  options: { reasoningEffort: "low" },
});
export const COMPARISON_FIXTURE_IDS = Object.freeze({
  projectId: `comparison-fixture-project-v${COMPARISON_FIXTURE_VERSION}`,
  transcriptThreadId: `comparison-fixture-transcript-v${COMPARISON_FIXTURE_VERSION}`,
  secondaryThreadId: `comparison-fixture-secondary-v${COMPARISON_FIXTURE_VERSION}`,
  homeProjectId: `comparison-fixture-home-v${COMPARISON_FIXTURE_VERSION}`,
  studioProjectId: `comparison-fixture-studio-v${COMPARISON_FIXTURE_VERSION}`,
});

// Turns run in order on the transcript thread. Together they produce tool
// activity, a real file edit (Diff/checkpoint), markdown lists, a table, a
// fenced code block, and enough rows to scroll.
export const COMPARISON_FIXTURE_TRANSCRIPT_TURNS = Object.freeze([
  "Look at this repository and summarize its layout as a short bulleted list. Do not modify any files.",
  "In src/math.ts add an exported `subtract(a: number, b: number): number` function directly below `add`, and add one bullet for it under the Functions section of README.md. Keep the change minimal.",
  "Without modifying files, reply with a markdown table listing every exported function in src/math.ts (name, parameters, return type), followed by a fenced TypeScript example that calls two of them.",
  "Without modifying files, write a numbered list of 40 short, distinct one-line tips for writing readable TypeScript.",
]);
export const COMPARISON_FIXTURE_SECONDARY_TURNS = Object.freeze([
  "Without modifying files, reply with one short sentence describing what src/greeting.ts does.",
]);

export function resolveComparisonFixturePaths(root = repositoryRoot) {
  const fixtureRoot = join(root, ".synara-desktop-comparison", "fixture");
  const seedHome = join(fixtureRoot, "seed");
  return {
    fixtureRoot,
    builderHome: join(fixtureRoot, "builder-home"),
    workspaceRoot: join(fixtureRoot, "workspace", "synara-fixture-app"),
    seedHome,
    seedDatabase: join(seedHome, "dev", "state.sqlite"),
    manifestPath: join(fixtureRoot, "fixture.json"),
    serverEntry: join(root, "apps", "server", "dist", "index.mjs"),
  };
}

export function comparisonFixtureWorkspaceFiles() {
  return {
    "package.json": `${JSON.stringify(
      {
        name: "synara-fixture-app",
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: { test: 'node --test "src/**/*.test.ts"' },
      },
      null,
      2,
    )}\n`,
    "README.md": [
      "# Synara Fixture App",
      "",
      "A tiny TypeScript workspace used to certify Synara desktop UI parity.",
      "",
      "## Functions",
      "",
      "- `add(a, b)` returns the sum of two numbers.",
      "- `greet(name)` returns a friendly greeting.",
      "",
    ].join("\n"),
    "src/math.ts": [
      "export function add(a: number, b: number): number {",
      "  return a + b;",
      "}",
      "",
      "export function clamp(value: number, min: number, max: number): number {",
      "  return Math.min(max, Math.max(min, value));",
      "}",
      "",
    ].join("\n"),
    "src/greeting.ts": [
      "export function greet(name: string): string {",
      "  const trimmed = name.trim();",
      '  return trimmed.length > 0 ? `Hello, ${trimmed}!` : "Hello!";',
      "}",
      "",
    ].join("\n"),
    "src/math.test.ts": [
      'import assert from "node:assert/strict";',
      'import { test } from "node:test";',
      'import { add, clamp } from "./math.ts";',
      "",
      'test("add sums two numbers", () => {',
      "  assert.equal(add(2, 3), 5);",
      "});",
      "",
      'test("clamp bounds a value", () => {',
      "  assert.equal(clamp(12, 0, 10), 10);",
      "});",
      "",
    ].join("\n"),
    "docs/notes.md": [
      "# Notes",
      "",
      "Keep functions small and pure. Prefer explicit return types on exports.",
      "",
    ].join("\n"),
  };
}

export function comparisonFixtureSetupCommands(workspaceRoot, now = new Date().toISOString()) {
  const { projectId, transcriptThreadId, secondaryThreadId } = COMPARISON_FIXTURE_IDS;
  const thread = (threadId, title) => ({
    type: "thread.create",
    commandId: `${threadId}:create`,
    threadId,
    projectId,
    title,
    modelSelection: COMPARISON_FIXTURE_MODEL,
    runtimeMode: "full-access",
    interactionMode: "default",
    // The workspace is a real git repo on `main`; the app records the live
    // branch when a thread opens, so the fixture starts already in sync.
    branch: "main",
    worktreePath: null,
    createdAt: now,
  });
  return [
    {
      type: "project.create",
      commandId: `${projectId}:create`,
      projectId,
      kind: "project",
      title: "synara-fixture-app",
      workspaceRoot,
      createWorkspaceRootIfMissing: false,
      defaultModelSelection: COMPARISON_FIXTURE_MODEL,
      createdAt: now,
    },
    thread(transcriptThreadId, "Fixture transcript"),
    thread(secondaryThreadId, "Fixture secondary"),
  ];
}

export function comparisonFixtureTurnCommand(
  threadId,
  index,
  text,
  now = new Date().toISOString(),
) {
  return {
    type: "thread.turn.start",
    commandId: `${threadId}:turn-${index + 1}`,
    threadId,
    message: {
      messageId: `${threadId}:user-${index + 1}`,
      role: "user",
      text,
      attachments: [],
    },
    modelSelection: COMPARISON_FIXTURE_MODEL,
    runtimeMode: "full-access",
    interactionMode: "default",
    createdAt: now,
  };
}

/**
 * The Home and Studio containers the app itself creates on first launch
 * (apps/web/src/lib/chatProjects.ts, studioProjects.ts), with the same kinds,
 * titles, and roots the server reports. Seeding them keeps the certification
 * window mutation-free: the app finds them instead of creating them.
 */
export function comparisonFixtureContainerCommands(serverConfig, now = new Date().toISOString()) {
  const commands = [];
  if (serverConfig?.homeDir) {
    commands.push({
      type: "project.create",
      commandId: `${COMPARISON_FIXTURE_IDS.homeProjectId}:create`,
      projectId: COMPARISON_FIXTURE_IDS.homeProjectId,
      kind: "chat",
      title: "Home",
      workspaceRoot: serverConfig.homeDir,
      createdAt: now,
    });
  }
  if (serverConfig?.studioWorkspaceRoot) {
    commands.push({
      type: "project.create",
      commandId: `${COMPARISON_FIXTURE_IDS.studioProjectId}:create`,
      projectId: COMPARISON_FIXTURE_IDS.studioProjectId,
      kind: "studio",
      title: "Studio",
      workspaceRoot: serverConfig.studioWorkspaceRoot,
      createWorkspaceRootIfMissing: true,
      createdAt: now,
    });
  }
  return commands;
}

/** A turn has settled once it completed and the session no longer owns it. */
export function fixtureTurnSettlement(thread, previousTurnId) {
  const latest = thread?.latestTurn ?? null;
  if (!latest || latest.turnId === previousTurnId) return { settled: false, reason: "pending" };
  if (latest.state === "running") return { settled: false, reason: "running" };
  if (latest.state !== "completed") {
    return { settled: true, ok: false, reason: `turn ${latest.state}` };
  }
  if (thread.session?.activeTurnId) return { settled: false, reason: "session-active" };
  return { settled: true, ok: true, turnId: latest.turnId };
}

/**
 * Reads the frozen entity set straight from a seed/cloned database. Only
 * visible (non-deleted, non-archived) rows count: that is what the UI renders.
 */
export function readComparisonFixtureEntities(databasePath) {
  const run = (sql) => {
    const result = spawnSync("sqlite3", ["-json", databasePath, sql], { encoding: "utf8" });
    if (result.status !== 0) {
      throw new Error(`Failed to read fixture entities: ${result.stderr.trim()}`);
    }
    return JSON.parse(result.stdout || "[]");
  };
  const projects = run(
    "select project_id as projectId, workspace_root as workspaceRoot from projection_projects where deleted_at is null and kind = 'project' order by project_id;",
  );
  const threads = run(
    "select t.thread_id as threadId, t.project_id as projectId, (select count(*) from projection_thread_messages m where m.thread_id = t.thread_id) as messageCount, (select message_id from projection_thread_messages m where m.thread_id = t.thread_id order by sequence desc, rowid desc limit 1) as lastMessageId from projection_threads t where t.deleted_at is null and t.archived_at is null order by t.thread_id;",
  );
  const [{ sequence } = { sequence: null }] = run(
    "select max(sequence) as sequence from orchestration_events;",
  );
  return { projects, threads, sequence };
}

/**
 * Compares a cloned database against the fixture manifest. Returns a list of
 * human-readable mismatches; an empty list means the clone is certifiable.
 */
/**
 * The same entities read from a live server's `orchestration.getSnapshot`. The
 * server holds `state.sqlite` under an exclusive lock while it runs, so once the
 * backend is up the snapshot RPC is the only way to observe them.
 */
export function comparisonFixtureEntitiesFromSnapshot(snapshot) {
  const byKey = (key) => (left, right) =>
    left[key] < right[key] ? -1 : left[key] > right[key] ? 1 : 0;
  const projects = (snapshot?.projects ?? [])
    .filter((project) => project.deletedAt == null && project.kind === "project")
    .map((project) => ({ projectId: project.id, workspaceRoot: project.workspaceRoot }))
    .sort(byKey("projectId"));
  const threads = (snapshot?.threads ?? [])
    .filter((thread) => thread.deletedAt == null && thread.archivedAt == null)
    .map((thread) => ({
      threadId: thread.id,
      projectId: thread.projectId,
      messageCount: thread.messages?.length ?? 0,
      lastMessageId: thread.messages?.at(-1)?.id ?? null,
    }))
    .sort(byKey("threadId"));
  return { projects, threads, sequence: snapshot?.snapshotSequence ?? null };
}

export function comparisonFixtureMismatches(manifest, entities) {
  const mismatches = [];
  const project = entities.projects.find((row) => row.projectId === manifest.projectId);
  if (!project) mismatches.push(`project ${manifest.projectId} is missing or hidden`);
  else if (project.workspaceRoot !== manifest.workspaceRoot) {
    mismatches.push(
      `project workspace ${project.workspaceRoot} does not match ${manifest.workspaceRoot}`,
    );
  }
  for (const expected of manifest.threads) {
    const actual = entities.threads.find((row) => row.threadId === expected.threadId);
    if (!actual) {
      mismatches.push(`thread ${expected.threadId} is missing, deleted, or archived`);
      continue;
    }
    if (actual.messageCount !== expected.messageCount) {
      mismatches.push(
        `thread ${expected.threadId} has ${actual.messageCount} messages, expected ${expected.messageCount}`,
      );
    }
    if (actual.lastMessageId !== expected.lastMessageId) {
      mismatches.push(
        `thread ${expected.threadId} ends at ${actual.lastMessageId}, expected ${expected.lastMessageId}`,
      );
    }
  }
  if (entities.sequence !== manifest.sequence) {
    mismatches.push(`event sequence ${entities.sequence} does not match ${manifest.sequence}`);
  }
  return mismatches;
}

export function readComparisonFixtureManifest(paths = resolveComparisonFixturePaths()) {
  if (!existsSync(paths.manifestPath) || !existsSync(paths.seedDatabase)) return null;
  const manifest = JSON.parse(readFileSync(paths.manifestPath, "utf8"));
  if (manifest.version !== COMPARISON_FIXTURE_VERSION) return null;
  return manifest;
}

/** Minimal canonical RPC session: bootstrap negotiation + one feature socket. */
export async function openSynaraRpcSession(serverUrl, clientBuild = "comparison-fixture") {
  const timeoutMs = 30_000;
  let sequence = 0;
  const open = (url) =>
    new Promise((resolveOpen, rejectOpen) => {
      const socket = new WebSocket(url);
      const timer = setTimeout(() => rejectOpen(new Error(`open timeout: ${url}`)), timeoutMs);
      socket.addEventListener("open", () => (clearTimeout(timer), resolveOpen(socket)), {
        once: true,
      });
      socket.addEventListener("error", (event) => (clearTimeout(timer), rejectOpen(event)), {
        once: true,
      });
    });
  const request = (socket, tag, payload = {}) =>
    new Promise((resolveRequest, rejectRequest) => {
      const id = String(++sequence);
      const timer = setTimeout(() => {
        socket.removeEventListener("message", onMessage);
        rejectRequest(new Error(`${tag} timed out`));
      }, timeoutMs);
      const onMessage = (event) => {
        let message;
        try {
          message = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (message?._tag !== "Exit" || message.requestId !== id) return;
        clearTimeout(timer);
        socket.removeEventListener("message", onMessage);
        if (message.exit?._tag === "Success") resolveRequest(message.exit.value);
        else rejectRequest(new Error(`${tag} failed: ${JSON.stringify(message.exit?.cause)}`));
      };
      socket.addEventListener("message", onMessage);
      socket.send(JSON.stringify({ _tag: "Request", id, tag, payload, headers: [] }));
    });

  const base = new URL(serverUrl);
  const bootstrapUrl = new URL(base);
  bootstrapUrl.pathname = "/ws/bootstrap";
  const bootstrap = await open(bootstrapUrl.toString());
  let negotiated;
  try {
    negotiated = await request(bootstrap, "bootstrap.negotiate", {
      protocolEpoch: COMPARISON_WS_PROTOCOL.epoch,
      minRevision: COMPARISON_WS_PROTOCOL.minRevision,
      maxRevision: COMPARISON_WS_PROTOCOL.maxRevision,
      clientBuild,
      requiredCapabilities: ["orchestration.cursor-safe-streams", "rpc.typed-errors"],
    });
  } finally {
    bootstrap.close();
  }
  const featureUrl = new URL(base);
  featureUrl.pathname = "/ws";
  featureUrl.searchParams.set("x-synara-client-build", clientBuild);
  featureUrl.searchParams.set("x-synara-protocol-epoch", String(negotiated.protocolEpoch));
  featureUrl.searchParams.set("x-synara-protocol-revision", String(negotiated.negotiatedRevision));
  featureUrl.searchParams.set("x-synara-server-instance", String(negotiated.serverInstanceId));
  const feature = await open(featureUrl.toString());
  return {
    serverInstanceId: String(negotiated.serverInstanceId),
    request: (tag, payload) => request(feature, tag, payload),
    close: () => feature.close(),
  };
}

function freePort() {
  return new Promise((resolvePort, rejectPort) => {
    const server = createServer();
    server.once("error", rejectPort);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });
}

function runGit(workspaceRoot, args) {
  const result = spawnSync("git", args, { cwd: workspaceRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function createFixtureWorkspace(workspaceRoot) {
  rmSync(workspaceRoot, { recursive: true, force: true });
  for (const [relativePath, content] of Object.entries(comparisonFixtureWorkspaceFiles())) {
    const filePath = join(workspaceRoot, relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content);
  }
  runGit(workspaceRoot, ["init", "--quiet", "--initial-branch=main"]);
  runGit(workspaceRoot, ["add", "."]);
  runGit(workspaceRoot, [
    "-c",
    "user.name=Synara Fixture",
    "-c",
    "user.email=fixture@synara.invalid",
    "commit",
    "--quiet",
    "-m",
    "Initial fixture workspace",
  ]);
}

async function waitFor(check, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await check();
    if (last?.done) return last;
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
  throw new Error(`Timed out waiting for ${label}: ${JSON.stringify(last)}`);
}

async function snapshotThread(session, threadId) {
  const snapshot = await session.request("orchestration.getSnapshot", {});
  return snapshot.threads.find((thread) => thread.id === threadId) ?? null;
}

async function runTurns(session, threadId, turns) {
  let previousTurnId = (await snapshotThread(session, threadId))?.latestTurn?.turnId ?? null;
  for (const [index, text] of turns.entries()) {
    console.log(`[fixture] ${threadId} turn ${index + 1}/${turns.length}`);
    await session.request(
      "orchestration.dispatchCommand",
      comparisonFixtureTurnCommand(threadId, index, text),
    );
    const settled = await waitFor(
      async () => {
        const settlement = fixtureTurnSettlement(
          await snapshotThread(session, threadId),
          previousTurnId,
        );
        return { done: settlement.settled, ...settlement };
      },
      10 * 60_000,
      `${threadId} turn ${index + 1}`,
    );
    if (!settled.ok) throw new Error(`${threadId} turn ${index + 1} failed: ${settled.reason}`);
    previousTurnId = settled.turnId;
  }
}

export async function buildComparisonFixture(paths = resolveComparisonFixturePaths()) {
  if (!existsSync(paths.serverEntry)) {
    throw new Error(
      `Server build is missing at ${paths.serverEntry}; run apps/server build first.`,
    );
  }
  rmSync(paths.builderHome, { recursive: true, force: true });
  mkdirSync(paths.builderHome, { recursive: true });
  createFixtureWorkspace(paths.workspaceRoot);

  const port = await freePort();
  const token = "synara-comparison-fixture";
  const server = spawn(process.execPath, [paths.serverEntry], {
    cwd: dirname(paths.serverEntry),
    env: {
      ...process.env,
      SYNARA_MODE: "desktop",
      SYNARA_NO_BROWSER: "1",
      SYNARA_PORT: String(port),
      SYNARA_HOME: paths.builderHome,
      SYNARA_AUTH_TOKEN: token,
      SYNARA_DISABLE_THREAD_RETENTION: "1",
      // Selects the `dev` state layout the comparison harness clones.
      VITE_DEV_SERVER_URL: "http://127.0.0.1:1/",
    },
    stdio: ["ignore", "inherit", "inherit"],
  });
  const serverExit = new Promise((resolveExit) => server.once("exit", resolveExit));
  let session = null;
  try {
    const serverUrl = `ws://127.0.0.1:${port}/?token=${token}`;
    session = await waitFor(
      async () => {
        try {
          return { done: true, session: await openSynaraRpcSession(serverUrl) };
        } catch (error) {
          return { done: false, error: String(error) };
        }
      },
      60_000,
      "fixture server",
    ).then((result) => result.session);

    const serverConfig = await session.request("server.getConfig", {});
    for (const command of [
      ...comparisonFixtureContainerCommands(serverConfig),
      ...comparisonFixtureSetupCommands(paths.workspaceRoot),
    ]) {
      await session.request("orchestration.dispatchCommand", command);
    }
    await runTurns(
      session,
      COMPARISON_FIXTURE_IDS.transcriptThreadId,
      COMPARISON_FIXTURE_TRANSCRIPT_TURNS,
    );
    await runTurns(
      session,
      COMPARISON_FIXTURE_IDS.secondaryThreadId,
      COMPARISON_FIXTURE_SECONDARY_TURNS,
    );
    const snapshot = await session.request("orchestration.getSnapshot", {});
    const transcript = snapshot.threads.find(
      (thread) => thread.id === COMPARISON_FIXTURE_IDS.transcriptThreadId,
    );
    const diffTurnId =
      transcript?.checkpoints?.find((checkpoint) => (checkpoint.files ?? []).length > 0)?.turnId ??
      null;
    if (!diffTurnId) throw new Error("The fixture edit turn did not record a file checkpoint.");
    session.close();
    session = null;

    server.kill("SIGTERM");
    await Promise.race([serverExit, new Promise((resolveWait) => setTimeout(resolveWait, 10_000))]);
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");

    const builderDatabase = join(paths.builderHome, "dev", "state.sqlite");
    rmSync(paths.seedHome, { recursive: true, force: true });
    mkdirSync(dirname(paths.seedDatabase), { recursive: true });
    const backup = spawnSync("sqlite3", [builderDatabase, `.backup '${paths.seedDatabase}'`], {
      encoding: "utf8",
    });
    if (backup.status !== 0) throw new Error(`Failed to freeze fixture: ${backup.stderr.trim()}`);

    const entities = readComparisonFixtureEntities(paths.seedDatabase);
    const manifest = {
      version: COMPARISON_FIXTURE_VERSION,
      createdAt: new Date().toISOString(),
      model: COMPARISON_FIXTURE_MODEL,
      projectId: COMPARISON_FIXTURE_IDS.projectId,
      workspaceRoot: paths.workspaceRoot,
      workspaceHead: runGit(paths.workspaceRoot, ["rev-parse", "HEAD"]),
      transcriptThreadId: COMPARISON_FIXTURE_IDS.transcriptThreadId,
      secondaryThreadId: COMPARISON_FIXTURE_IDS.secondaryThreadId,
      diffTurnId,
      explorerPath: "src/math.ts",
      sequence: entities.sequence,
      threads: entities.threads.filter((thread) =>
        [
          COMPARISON_FIXTURE_IDS.transcriptThreadId,
          COMPARISON_FIXTURE_IDS.secondaryThreadId,
        ].includes(thread.threadId),
      ),
    };
    const mismatches = comparisonFixtureMismatches(manifest, entities);
    if (mismatches.length > 0) throw new Error(`Frozen fixture is inconsistent: ${mismatches}`);
    writeFileSync(paths.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`[fixture] frozen ${paths.seedDatabase}: ${JSON.stringify(manifest)}`);
    return manifest;
  } finally {
    session?.close();
    if (server.exitCode === null && server.signalCode === null) server.kill("SIGKILL");
  }
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const paths = resolveComparisonFixturePaths();
  const existing = process.argv.includes("--rebuild") ? null : readComparisonFixtureManifest(paths);
  if (existing) {
    console.log(`[fixture] reusing ${paths.manifestPath}; pass --rebuild to recreate it.`);
  } else {
    buildComparisonFixture(paths).catch((error) => {
      console.error(`[fixture] ${error instanceof Error ? error.stack : String(error)}`);
      process.exit(1);
    });
  }
}
