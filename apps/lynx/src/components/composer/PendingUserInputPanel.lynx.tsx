import type { ProviderUserInputAnswers } from '@synara/contracts';
import type { PendingUserInput } from '@synara-web/session-logic';
import {
  buildPendingUserInputAnswers,
  derivePendingUserInputProgress,
  setPendingUserInputCustomAnswer,
  togglePendingUserInputOptionSelection,
  type PendingUserInputDraftAnswer,
} from '@synara-web/pendingUserInput';
import { useState } from '@lynx-js/react';

import { Button } from '../ui/button.lynx';
import { Input } from '../ui/input.lynx';
import { ComposerChoiceRow } from './ComposerChoiceRow.lynx';
import './pending-user-input-panel.css';

export function PendingUserInputPanel(props: {
  readonly prompt: PendingUserInput;
  readonly pendingCount: number;
  readonly responding: boolean;
  readonly onRespond: (
    answers: ProviderUserInputAnswers,
    lifecycleGeneration?: string
  ) => void;
}) {
  const [answers, setAnswers] = useState<
    Record<string, PendingUserInputDraftAnswer>
  >({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const progress = derivePendingUserInputProgress(
    props.prompt.questions,
    answers,
    questionIndex
  );
  const question = progress.activeQuestion;
  if (!question) return null;

  const submitAnswers = (
    nextAnswers: Record<string, PendingUserInputDraftAnswer>
  ) => {
    'background only';
    const resolved = buildPendingUserInputAnswers(
      props.prompt.questions,
      nextAnswers
    );
    if (!resolved) return false;
    props.onRespond(resolved, props.prompt.lifecycleGeneration);
    return true;
  };
  const selectOption = (optionLabel: string) => {
    'background only';
    const nextAnswer = togglePendingUserInputOptionSelection(
      question,
      answers[question.id],
      optionLabel
    );
    const nextAnswers = {
      ...answers,
      [question.id]: nextAnswer,
    };
    setAnswers(nextAnswers);
    if (question.multiSelect) return;
    if (progress.isLastQuestion) {
      submitAnswers(nextAnswers);
      return;
    }
    setQuestionIndex(progress.questionIndex + 1);
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
        {props.prompt.questions.length > 1 ? (
          <text className="PendingUserInputProgressLynx">
            {progress.questionIndex + 1}/{props.prompt.questions.length}
          </text>
        ) : props.pendingCount > 1 ? (
          <text className="PendingUserInputProgressLynx">
            1/{props.pendingCount}
          </text>
        ) : null}
      </view>
      {question.multiSelect ? (
        <text className="PendingUserInputHintLynx">Select one or more.</text>
      ) : null}
      {question.options.length > 0 ? (
        <view className="PendingUserInputOptionsLynx">
          {question.options.map((option, index) => {
            const selected = progress.selectedOptionLabels.includes(
              option.label
            );
            return (
              <ComposerChoiceRow
                key={`${question.id}:${option.label}`}
                shortcut={index + 1}
                label={option.label}
                description={option.description}
                selected={selected}
                disabled={props.responding}
                onSelect={() => selectOption(option.label)}
              />
            );
          })}
        </view>
      ) : null}
      <Input
        nativeInput
        className="PendingUserInputCustomLynx"
        accessibility-label="Type your own answer"
        placeholder="Type your own answer"
        disabled={props.responding}
        value={progress.customAnswer}
        onInput={(value) => {
          'background only';
          setAnswers((current) => ({
            ...current,
            [question.id]: setPendingUserInputCustomAnswer(
              current[question.id],
              value
            ),
          }));
        }}
      />
      <view className="PendingUserInputFooterLynx">
        <Button
          variant="ghost"
          size="sm"
          disabled={props.responding}
          onClick={() =>
            props.onRespond({}, props.prompt.lifecycleGeneration)
          }
        >
          Cancel
        </Button>
        {progress.questionIndex > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={props.responding}
            onClick={() => setQuestionIndex(progress.questionIndex - 1)}
          >
            Previous
          </Button>
        ) : null}
        {!progress.isLastQuestion ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={props.responding || !progress.canAdvance}
            onClick={() => setQuestionIndex(progress.questionIndex + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled={props.responding || !progress.isComplete}
            onClick={() => submitAnswers(answers)}
          >
            Submit answers
          </Button>
        )}
      </view>
    </scroll-view>
  );
}
