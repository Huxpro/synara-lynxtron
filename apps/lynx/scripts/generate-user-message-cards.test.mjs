import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { SOURCES, generateUserMessageCards } from "./generate-user-message-cards.mjs";
const sources = Object.fromEntries(
  Object.entries(SOURCES).map(([key, file]) => [
    key,
    fs.readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8"),
  ]),
);
test("derives upstream annotation limit and PR icon inventory", () => {
  const result = generateUserMessageCards(sources);
  assert.match(result, /MAX_VISIBLE_BROWSER_ANNOTATIONS = 2/);
  assert.match(result, /reference: "GitPullRequestIcon"/);
  assert.match(result, /conflicts: "GitMergeConflictIcon"/);
});
test("rejects unrecognized upstream rules", () => {
  assert.throws(
    () =>
      generateUserMessageCards({
        ...sources,
        annotations: sources.annotations.replace(
          "MAX_VISIBLE_BROWSER_ANNOTATIONS = 2",
          "MAX_VISIBLE_BROWSER_ANNOTATIONS = dynamicLimit()",
        ),
      }),
    /changed shape/,
  );
  assert.throws(
    () =>
      generateUserMessageCards({
        ...sources,
        pullRequest: sources.pullRequest.replace("const SCOPE_ICONS", "const OTHER_ICONS"),
      }),
    /Expected one/,
  );
});
