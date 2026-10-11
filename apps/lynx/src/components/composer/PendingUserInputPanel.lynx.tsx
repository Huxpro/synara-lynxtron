import type { UserInputQuestion } from "@synara/contracts";
import { useEffect, useRef } from "@lynx-js/react";
import {
  derivePendingUserInputProgress,
  type PendingUserInputDraftAnswer,
} from "@synara-web/pendingUserInput";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "../../lib/icons.lynx";
import { Button } from "../ui/button.lynx";
import { ComposerChoiceRow } from "./ComposerChoiceRow.lynx";
import "./pending-user-input-panel.css";

// Native presentation of UserInputQuestionForm. Answers and submission ownership
// stay in upstream useChatPendingInteractions, shared with the composer editor.
export function PendingUserInputPanel(props: {
  readonly questions: ReadonlyArray<UserInputQuestion>;
  readonly submissionVersion: number;
  readonly isResponding: boolean;
  readonly answers: Record<string, PendingUserInputDraftAnswer>;
  readonly questionIndex: number;
  readonly onToggleOption: (
    questionId: string,
    label: string,
  ) => PendingUserInputDraftAnswer | null;
  readonly onAdvance: (overrides?: Record<string, PendingUserInputDraftAnswer>) => unknown;
  readonly onPrevious: () => void;
  readonly onCancel: () => void;
}) {
  const progress = derivePendingUserInputProgress(
    props.questions,
    props.answers,
    props.questionIndex,
  );
  const question = progress.activeQuestion;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advance = useRef(props.onAdvance);
  useEffect(() => {
    "background only";
    advance.current = props.onAdvance;
  }, [props.onAdvance]);
  const cancelAutoAdvance = () => {
    "background only";
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => {
    "background only";
    return cancelAutoAdvance;
  }, [question?.id, props.isResponding, props.submissionVersion]);
  if (!question) return null;
  const selectOption = (label: string) => {
    "background only";
    if (props.isResponding) return;
    const answer = props.onToggleOption(question.id, label);
    if (question.multiSelect) return;
    cancelAutoAdvance();
    timer.current = setTimeout(() => {
      timer.current = null;
      advance.current(answer ? { [question.id]: answer } : undefined);
    }, 200);
  };
  return (
    <scroll-view
      className="PendingUserInputPanelLynx ComposerDecisionPanelLynx"
      scroll-orientation="vertical"
      scroll-y
      enable-scroll-bar
    >
      <view className="PendingUserInputHeaderLynx">
        <text className="PendingUserInputTitleLynx">{question.question}</text>
        {props.questions.length > 1 ? (
          <view className="PendingUserInputNavigationLynx">
            <Button
              variant="ghost"
              size="icon-xs"
              className="PendingUserInputNavButtonLynx"
              aria-label="Previous question"
              disabled={progress.questionIndex === 0 || props.isResponding}
              onClick={props.onPrevious}
            >
              <ChevronLeftIcon size={14} />
            </Button>
            <text className="PendingUserInputProgressLynx">
              {progress.questionIndex + 1} of {props.questions.length}
            </text>
            <Button
              variant="ghost"
              size="icon-xs"
              className="PendingUserInputNavButtonLynx"
              aria-label="Next question"
              disabled={progress.isLastQuestion || !progress.canAdvance || props.isResponding}
              onClick={() => props.onAdvance()}
            >
              <ChevronRightIcon size={14} />
            </Button>
          </view>
        ) : null}
      </view>
      {question.multiSelect ? (
        <text className="PendingUserInputHintLynx">Select one or more.</text>
      ) : null}
      {question.options.length > 0 ? (
        <view className="PendingUserInputOptionsLynx">
          {question.options.map((option, index) => (
            <ComposerChoiceRow
              key={`${question.id}:${option.label}`}
              shortcut={index < 9 ? index + 1 : null}
              label={option.label}
              description={option.description}
              selected={progress.selectedOptionLabels.includes(option.label)}
              disabled={props.isResponding}
              onSelect={() => selectOption(option.label)}
              trailing={
                progress.selectedOptionLabels.includes(option.label) ? (
                  <CheckIcon size={14} color="var(--foreground)" />
                ) : null
              }
            />
          ))}
        </view>
      ) : null}
      <view className="PendingUserInputFooterLynx">
        <Button
          variant="ghost"
          size="sm"
          className="PendingUserInputCancelLynx"
          aria-label="Cancel"
          disabled={props.isResponding}
          onClick={() => {
            cancelAutoAdvance();
            props.onCancel();
          }}
        >
          Cancel
        </Button>
      </view>
    </scroll-view>
  );
}
