// Guarded patches the generator applies to upstream's `EventRouter` source
// before extraction. Upstream is read-only, so a defect in the session-sync
// engine that Lynx cannot live with is corrected here, in the derivation, and
// nowhere else. Every patch:
//
//   - locates its anchors in the TypeScript AST and stops the generator (which
//     then writes nothing) when upstream's code is not the shape it was written
//     against;
//   - detects upstream's own fix and then applies nothing, reporting that the
//     patch can be deleted;
//   - is pinned by a behavior test that fails without it.
//
// ---------------------------------------------------------------------------
// drop-queued-thread-events-covered-by-snapshot
//
// Defect (upstream/main 6f54f53c6). A thread-detail event that passes the
// sequence fence is pushed onto `pendingDomainEvents` and reaches the store
// when the 100 ms flush throttler fires (only the first streaming delta of an
// assistant message flushes at once). A thread snapshot is applied
// immediately, through `syncServerThreadDetailHotPath(snapshot.thread,
// snapshot.snapshotSequence)`, in two places: the `onThreadEvent` snapshot
// branch (subscribe / resubscribe) and `reconcileThreadProjection` (the
// `getThreadDetailSnapshot` catch-up that runs while a turn is live). Both
// advance the fence and drop `pendingThreadEventsById`, but neither looks at
// `pendingDomainEvents`. A delta queued there with `sequence <=
// snapshotSequence` is already part of the snapshot's text (the server commits
// the hot projection and its cursor in the event's own transaction), and the
// flush then appends it a second time: "Hello world" becomes "Hello worldld"
// until the completion event replaces the text.
//
// Patch. Immediately before each of those two calls, remove from
// `pendingDomainEvents` the events of that thread the snapshot already covers
// (`sequence <= snapshotSequence`). Later events stay queued and apply on top
// of the snapshot, as before; query invalidation flags set when the event was
// queued are untouched.
// ---------------------------------------------------------------------------

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

export const QUEUED_EVENT_PATCH = "drop-queued-thread-events-covered-by-snapshot";
const PATCH_ROOT = "EventRouter";
const SNAPSHOT_APPLY = "syncServerThreadDetailHotPath";
const QUEUE = "pendingDomainEvents";
const QUEUE_FLUSH = "flushPendingDomainEvents";
/** `onThreadEvent` snapshot branch and `reconcileThreadProjection`. */
const EXPECTED_SNAPSHOT_SITES = 2;

export class EventRouterPatchError extends Error {
  constructor(message) {
    super(`generate-event-router: patch ${QUEUED_EVENT_PATCH}: ${message}`);
    this.name = "EventRouterPatchError";
  }
}

function fail(message) {
  throw new EventRouterPatchError(
    `${message}. Upstream's EventRouter changed shape; re-read the patch's description in ` +
      `apps/lynx/scripts/event-router-patches.mjs against the new code before changing it`,
  );
}

function isFunctionLike(node) {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node)
  );
}

function lineOf(sourceFile, position) {
  return ts.getLineAndCharacterOfPosition(sourceFile, position).line + 1;
}

/**
 * Returns `{ text, applied, upstreamFixed }`. `applied` lists the patches that
 * changed the text; `upstreamFixed` lists the ones upstream no longer needs.
 * A source without the root function is returned untouched: reporting that is
 * the extractor's job.
 */
export function applyEventRouterPatches({ sourceText, sourcePath }) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.ES2023,
    true,
    ts.ScriptKind.TSX,
  );
  const root = sourceFile.statements.find(
    (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === PATCH_ROOT,
  );
  if (!root) return { text: sourceText, applied: [], upstreamFixed: [] };

  /** @type {{ statement: import("typescript").Statement, snapshot: string }[]} */
  const sites = [];
  let queueDeclaration = null;
  let queueIsPushedTo = false;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === QUEUE &&
      ts.isVariableDeclarationList(node.parent)
    ) {
      if (queueDeclaration) fail(`${QUEUE} is declared more than once`);
      queueDeclaration = node;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === QUEUE &&
      node.expression.name.text === "push"
    ) {
      queueIsPushedTo = true;
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === SNAPSHOT_APPLY
    ) {
      const [thread, sequence] = node.arguments;
      const line = lineOf(sourceFile, node.getStart(sourceFile));
      if (
        node.arguments.length !== 2 ||
        !ts.isPropertyAccessExpression(thread) ||
        thread.name.text !== "thread" ||
        !ts.isPropertyAccessExpression(sequence) ||
        sequence.name.text !== "snapshotSequence" ||
        thread.expression.getText(sourceFile) !== sequence.expression.getText(sourceFile)
      ) {
        fail(
          `${SNAPSHOT_APPLY} at ${sourcePath}:${line} is not called as ` +
            `(snapshot.thread, snapshot.snapshotSequence)`,
        );
      }
      if (!ts.isExpressionStatement(node.parent) || !ts.isBlock(node.parent.parent)) {
        fail(`${SNAPSHOT_APPLY} at ${sourcePath}:${line} is not a statement of its own in a block`);
      }
      sites.push({ statement: node.parent, snapshot: thread.expression.getText(sourceFile) });
    }
    ts.forEachChild(node, visit);
  };
  visit(root);

  if (sites.length !== EXPECTED_SNAPSHOT_SITES) {
    fail(
      `expected ${EXPECTED_SNAPSHOT_SITES} calls of ${SNAPSHOT_APPLY} in ${PATCH_ROOT}, found ${sites.length}`,
    );
  }
  if (
    !queueDeclaration ||
    (queueDeclaration.parent.flags & ts.NodeFlags.Let) === 0 ||
    !queueDeclaration.initializer ||
    !ts.isArrayLiteralExpression(queueDeclaration.initializer)
  ) {
    fail(`${QUEUE} is no longer a reassignable array declared in ${PATCH_ROOT}`);
  }
  if (!queueIsPushedTo) fail(`nothing pushes to ${QUEUE} any more`);

  // Upstream's own fix has to deal with the queue before it applies the
  // snapshot. Only two forms count, each as a statement of the same block that
  // runs before the apply: reassigning the queue from a filter of itself, or
  // calling its flush. Any other mention of the queue before that point (a
  // read, a use inside a callback or another branch) is not evidence of a fix
  // and not something this patch understands, so generation stops and a person
  // decides. Today neither function touches the queue before the apply.
  const isQueueFix = (candidate) => {
    if (!ts.isExpressionStatement(candidate)) return false;
    const expression = candidate.expression;
    if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(expression.left) &&
      expression.left.text === QUEUE &&
      ts.isCallExpression(expression.right) &&
      ts.isPropertyAccessExpression(expression.right.expression) &&
      ts.isIdentifier(expression.right.expression.expression) &&
      expression.right.expression.expression.text === QUEUE &&
      expression.right.expression.name.text === "filter"
    ) {
      return true;
    }
    return (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === QUEUE_FLUSH &&
      expression.arguments.length === 0
    );
  };
  const handledUpstream = sites.map(({ statement }) => {
    const siblings = statement.parent.statements;
    const fixes = siblings.slice(0, siblings.indexOf(statement)).filter(isQueueFix);
    let owner = statement.parent;
    while (owner && !isFunctionLike(owner)) owner = owner.parent;
    if (!owner) fail(`${SNAPSHOT_APPLY} is not inside a function`);
    const scan = (node) => {
      if (fixes.includes(node) || node.getStart(sourceFile) >= statement.getStart(sourceFile)) {
        return;
      }
      if (ts.isIdentifier(node) && (node.text === QUEUE || node.text === QUEUE_FLUSH)) {
        fail(
          `${sourcePath}:${lineOf(sourceFile, node.getStart(sourceFile))} uses ${node.text} before ` +
            `${SNAPSHOT_APPLY} in a way this patch does not recognize; check whether upstream ` +
            `now prevents the duplicate (eventRouter.generated.test.tsx without the patch) and ` +
            `update or delete the patch`,
        );
      }
      ts.forEachChild(node, scan);
    };
    scan(owner);
    return fixes.length > 0;
  });
  if (handledUpstream.every(Boolean)) {
    return { text: sourceText, applied: [], upstreamFixed: [QUEUED_EVENT_PATCH] };
  }
  if (handledUpstream.some(Boolean)) {
    fail(
      `only one of the ${EXPECTED_SNAPSHOT_SITES} snapshot paths handles ${QUEUE} before applying the snapshot`,
    );
  }

  let text = sourceText;
  for (const { statement, snapshot } of sites.toSorted(
    (left, right) => right.statement.getStart(sourceFile) - left.statement.getStart(sourceFile),
  )) {
    const start = statement.getStart(sourceFile);
    const lineStart = sourceText.lastIndexOf("\n", start - 1) + 1;
    const indent = sourceText.slice(lineStart, start);
    if (indent.trim().length > 0) {
      fail(`${SNAPSHOT_APPLY} at ${sourcePath}:${lineOf(sourceFile, start)} shares its line`);
    }
    const inserted = [
      `// LYNX PATCH ${QUEUED_EVENT_PATCH} (scripts/event-router-patches.mjs):`,
      `// the snapshot already contains this thread's queued events up to its`,
      `// sequence; flushing them after it would apply them twice.`,
      `${QUEUE} = ${QUEUE}.filter(`,
      `  (queuedEvent) =>`,
      `    String(queuedEvent.aggregateId) !== ${snapshot}.thread.id ||`,
      `    queuedEvent.sequence > ${snapshot}.snapshotSequence,`,
      `);`,
    ]
      .map((line) => `${indent}${line}\n`)
      .join("");
    text = `${text.slice(0, lineStart)}${inserted}${text.slice(lineStart)}`;
  }
  return { text, applied: [QUEUED_EVENT_PATCH], upstreamFixed: [] };
}
