import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  generateDecisionPanelModel,
  SOURCE as APPROVAL_SOURCE,
} from "./generate-decision-panel-model.mjs";
import {
  generatePendingInteractions,
  SOURCE as HOOK_SOURCE,
} from "./generate-pending-interactions.mjs";
import { applyPendingInteractionRefTypePort } from "./event-router-patches.mjs";
const root = new URL("../../../", import.meta.url);
test("approval actions and parameter formatter come from guarded upstream declarations", () => {
  const source = readFileSync(new URL(APPROVAL_SOURCE, root), "utf8");
  const result = generateDecisionPanelModel(source);
  assert.ok(result.approvalActions.text.includes("WITHOUT_SESSION_APPROVAL"));
  assert.ok(result.approvalActions.text.includes("COMPUTER_SCOPES"));
  assert.ok(result.approvalParameters.text.includes("formatToolParameterValue"));
  assert.throws(() =>
    generateDecisionPanelModel(source.replaceAll("COMPUTER_SCOPES", "SCOPES_CHANGED")),
  );
});
test("pending hook only changes the React ref type import, with upstream bodies intact", () => {
  const source = readFileSync(new URL(HOOK_SOURCE, root), "utf8");
  const patch = applyPendingInteractionRefTypePort({ sourceText: source, sourcePath: HOOK_SOURCE });
  assert.equal(patch.text.replace("MutableRefObject as RefObject", "RefObject"), source);
  const result = generatePendingInteractions(source);
  assert.ok(result.text.includes('type: "thread.user-input.respond"'));
  assert.ok(result.text.includes("await respondToThreadApproval({"));
  assert.throws(() =>
    applyPendingInteractionRefTypePort({
      sourceText: source.replaceAll("RefObject", "ChangedRef"),
      sourcePath: HOOK_SOURCE,
    }),
  );
});
