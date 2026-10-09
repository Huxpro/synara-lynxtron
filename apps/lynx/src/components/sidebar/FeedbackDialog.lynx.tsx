import { createElement, useEffect, useState } from "@lynx-js/react";
import type { ThreadId } from "@synara/contracts";
import { ensureNativeApi } from "~/nativeApi";
import {
  buildFeedbackSubmission,
  FEEDBACK_CATEGORIES,
  type FeedbackCategory,
  type FeedbackThreadContext,
} from "@synara-web/feedback";

import type { ProjectSummary, ThreadSummary } from "../../app/queries";
import { Button } from "../ui/button.lynx";
import { Dialog, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from "../ui/dialog.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";
import "./feedback-dialog.css";

/** Feedback context from the sidebar snapshot's view of the active thread and project. */
export function resolveNativeFeedbackContext(
  thread:
    | Pick<
        ThreadSummary,
        | "provider"
        | "sessionStatus"
        | "latestTurnState"
        | "messageCount"
        | "hasPendingApprovals"
        | "hasPendingUserInput"
      >
    | null
    | undefined,
  projectKind: ProjectSummary["kind"] | null | undefined,
): FeedbackThreadContext {
  return {
    provider: thread?.provider ?? null,
    model: null,
    projectKind: projectKind ?? null,
    environmentMode: null,
    runtimeMode: null,
    interactionMode: null,
    sessionStatus: thread?.sessionStatus ?? null,
    latestTurnState: thread?.latestTurnState ?? null,
    messageCount: thread?.messageCount ?? 0,
    activityCount: 0,
    hasPendingApproval: thread?.hasPendingApprovals === true,
    hasPendingUserInput: thread?.hasPendingUserInput === true,
    hasThreadError: false,
  };
}

interface NativeFeedbackInputEvent {
  readonly detail: { readonly value: string };
}

function FeedbackCategoryChip(props: {
  readonly category: (typeof FEEDBACK_CATEGORIES)[number];
  readonly disabled: boolean;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName:
      "FeedbackCategoryChip" + (props.selected ? " FeedbackCategoryChip--selected" : ""),
    accessibleLabel: props.category.label + " feedback",
    disabled: props.disabled,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      accessibility-role="button"
      accessibility-state={{ selected: props.selected }}
      {...interaction.eventProps}
    >
      <text className="FeedbackCategoryChipMark">{props.selected ? "−" : "+"}</text>
      <text className="FeedbackCategoryChipLabel">{props.category.label}</text>
    </view>
  );
}

export function FeedbackDialogLynx(props: {
  readonly activeThreadId?: string | null;
  readonly fallbackContext: FeedbackThreadContext;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [context, setContext] = useState(props.fallbackContext);
  const canSubmit = details.trim().length > 0 && !isSending;

  useEffect(() => {
    "background only";
    setContext(props.fallbackContext);
    if (!props.open || !props.activeThreadId) return;
    let cancelled = false;
    void ensureNativeApi()
      .orchestration.getThreadDetailSnapshot({ threadId: props.activeThreadId as ThreadId })
      .then((snapshot) => {
        if (cancelled || !snapshot?.thread) return;
        const thread = snapshot.thread;
        setContext({
          provider: thread.modelSelection.provider,
          model: thread.modelSelection.model,
          projectKind: props.fallbackContext.projectKind,
          environmentMode: thread.envMode ?? null,
          runtimeMode: thread.runtimeMode,
          interactionMode: thread.interactionMode,
          sessionStatus: thread.session?.status ?? null,
          latestTurnState: thread.latestTurn?.state ?? null,
          messageCount: thread.messages.length,
          activityCount: thread.activities.length,
          hasPendingApproval: thread.hasPendingApprovals === true,
          hasPendingUserInput: thread.hasPendingUserInput === true,
          hasThreadError: Boolean(thread.session?.lastError),
        });
      })
      .catch(() => {
        // The summary-derived fallback remains privacy-safe and useful offline.
      });
    return () => {
      cancelled = true;
    };
  }, [props.activeThreadId, props.fallbackContext, props.open]);

  const handleOpenChange = (open: boolean) => {
    "background only";
    if (isSending) return;
    props.onOpenChange(open);
    if (!open) {
      setCategory(null);
      setDetails("");
      setError(null);
    }
  };

  const submit = async () => {
    "background only";
    if (!canSubmit) return;
    setIsSending(true);
    setError(null);
    try {
      const { bridgeCall } = await import(/* webpackMode: "eager" */ "../../platform/bridge");
      const viewport = await bridgeCall<{
        readonly width: number;
        readonly height: number;
      }>("windowGetViewport");
      await bridgeCall("feedbackSubmit", {
        submission: buildFeedbackSubmission({
          category,
          details,
          context,
          viewport,
        }),
      });
      setIsSending(false);
      setCategory(null);
      setDetails("");
      setError(null);
      props.onOpenChange(false);
    } catch (submissionError) {
      setIsSending(false);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "An unexpected delivery error occurred.",
      );
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogPopup className="FeedbackDialogLynx" showCloseButton={!isSending}>
        <DialogHeader className="FeedbackDialogHeader">
          <DialogTitle className="FeedbackDialogTitle">Share feedback</DialogTitle>
        </DialogHeader>
        <DialogPanel className="FeedbackDialogPanel">
          <view
            className="FeedbackCategoryList"
            accessibility-element
            accessibility-label="Feedback category"
          >
            {FEEDBACK_CATEGORIES.map((option) => (
              <FeedbackCategoryChip
                key={option.value}
                category={option}
                disabled={isSending}
                selected={category === option.value}
                onSelect={() =>
                  setCategory((current) => (current === option.value ? null : option.value))
                }
              />
            ))}
          </view>
          {createElement("textarea", {
            className: "FeedbackDetailsInput",
            "accessibility-element": true,
            "accessibility-label": "Feedback details",
            "default-value": details,
            disabled: isSending,
            focusable: !isSending,
            maxlength: 5000,
            maxlines: 8,
            placeholder: "Share details (required)",
            "send-composing-input": true,
            bindinput: (event: NativeFeedbackInputEvent) => {
              setDetails(event.detail.value);
              setError(null);
            },
          })}
          <text className="FeedbackPrivacyNote">
            Diagnostics include app version, OS, provider/model, modes, and session state — never
            prompts, messages, paths, or logs.
          </text>
          {error ? (
            <text className="FeedbackDialogError" accessibility-element accessibility-role="alert">
              {error}
            </text>
          ) : null}
          <Button
            className="FeedbackSubmitButton"
            disabled={!canSubmit}
            onClick={() => void submit()}
          >
            {isSending ? "Sending…" : "Submit"}
          </Button>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
