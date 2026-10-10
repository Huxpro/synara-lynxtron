export const DEFAULT_CHAT_COMPOSER_PLACEHOLDER =
  "Ask anything, @tag files/folders, or use / to show available commands";

export type ChatComposerSessionPhase = "disconnected" | "connecting" | "running" | "ready";

/**
 * A thread session's phase from its status. Accepts both the web store's legacy statuses
 * (`closed`, `connecting`) and the raw orchestration ones they map from (`idle` and
 * `stopped` → closed, `starting` → connecting); no session reads as disconnected.
 */
export function resolveSessionPhase(status: string | null | undefined): ChatComposerSessionPhase {
  if (!status || status === "closed" || status === "idle" || status === "stopped") {
    return "disconnected";
  }
  if (status === "connecting" || status === "starting") return "connecting";
  if (status === "running") return "running";
  return "ready";
}

/**
 * The thread composer's placeholder, from the most specific pending interaction down to
 * the session phase: an approval, a pending question (free-form or with options), a plan
 * awaiting feedback, a subagent thread, a live turn, then a disconnected session.
 */
export function resolveChatComposerPlaceholder(input: {
  readonly approvalPending: boolean;
  /** The active pending question, if any; `freeform` when it offers no options. */
  readonly pendingQuestion: { readonly freeform: boolean } | null;
  readonly planFollowUp: boolean;
  readonly subagent: boolean;
  readonly phase: ChatComposerSessionPhase;
}): string {
  if (input.approvalPending) return "Resolve this approval request to continue";
  if (input.pendingQuestion) {
    return input.pendingQuestion.freeform
      ? "Type your answer to continue"
      : "Type your own answer, or leave this blank to use the selected option";
  }
  if (input.planFollowUp) {
    return "Add feedback to refine the plan, or leave this blank to implement it";
  }
  if (input.subagent) return "Message this subagent while it works";
  if (input.phase === "running") return "Ask for follow-up changes";
  if (input.phase === "disconnected") return "Ask for follow-up changes or attach images";
  return DEFAULT_CHAT_COMPOSER_PLACEHOLDER;
}

const COMPOSER_EDITOR_HORIZONTAL_CHROME_PX = 68;
const COMPOSER_EDITOR_LINE_HEIGHT_PX = 19.5;

export function resolveEmptyComposerEditorMinHeightPx(input: {
  readonly availableWidthPx: number | null | undefined;
  readonly chatFontSizePx: number;
  readonly placeholder?: string;
}): number {
  const placeholder = input.placeholder ?? DEFAULT_CHAT_COMPOSER_PLACEHOLDER;
  const availableWidthPx =
    Number.isFinite(input.availableWidthPx) && (input.availableWidthPx ?? 0) > 0
      ? input.availableWidthPx!
      : 736;
  const textWidthPx = Math.max(1, availableWidthPx - COMPOSER_EDITOR_HORIZONTAL_CHROME_PX);
  const estimatedCharacterWidthPx = Math.max(1, input.chatFontSizePx * 0.5);
  const lineCount = Math.min(
    6,
    Math.max(2, Math.ceil((placeholder.length * estimatedCharacterWidthPx) / textWidthPx)),
  );
  return lineCount * COMPOSER_EDITOR_LINE_HEIGHT_PX;
}
