import type { PullRequestCommentInput, PullRequestDetail } from "@synara/contracts";
import { pullRequestCommentMutationOptions } from "@synara-web/lib/pullRequestReactQuery";
import { createElement, useRef, useState } from "@lynx-js/react";
import githubSvg from "@synara-central-icons/github.svg?raw";
import sendArrowSvg from "@synara-central-icons/arrow-up.svg?raw";

import { queryClient } from "../app/queries";
import { Button } from "../components/ui/button";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";

const MAX_COMMENT_LENGTH = 65_536;

type CommentKeyEvent = {
  readonly key: string;
  readonly shiftKey?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

type NativeCommentInputEvent = {
  readonly detail: {
    readonly value: string;
    readonly isComposing: boolean;
  };
};

function NativeCommentTextarea(props: {
  readonly revision: number;
  readonly pending: boolean;
  readonly value: string;
  readonly onInput: (event: NativeCommentInputEvent) => void;
  readonly onKeyDown: (event: CommentKeyEvent) => void;
}) {
  return createElement("textarea", {
    key: props.revision,
    className: "SharedPrCommentComposerInput",
    "accessibility-element": true,
    "accessibility-label": "Leave a comment",
    focusable: !props.pending,
    readonly: props.pending,
    "default-value": props.value,
    placeholder: "Leave a comment",
    maxlength: MAX_COMMENT_LENGTH,
    maxlines: 6,
    "enable-scroll-bar": true,
    "send-composing-input": true,
    bindinput: props.onInput,
    catchkeydown: props.onKeyDown,
  });
}

export function PullRequestCommentComposer(props: {
  /** The item commented on: a pull request, or an issue with its own `postComment`. */
  readonly detail: Pick<PullRequestDetail, "projectId" | "repository" | "number">;
  /** Defaults to upstream's pull request comment mutation, which refreshes its caches. */
  readonly postComment?: (input: PullRequestCommentInput) => Promise<unknown>;
}) {
  const [body, setBody] = useState("");
  const [editorRevision, setEditorRevision] = useState(0);
  const [submissionState, setSubmissionState] = useState<
    | { readonly kind: "idle" }
    | { readonly kind: "pending" }
    | { readonly kind: "error"; readonly message: string }
  >({ kind: "idle" });
  const bodyRef = useRef("");
  const isComposingRef = useRef(false);
  const submittingRef = useRef(false);
  const { activeTheme, semanticIconColor } = useTheme();
  const postComment =
    props.postComment ??
    ((input: PullRequestCommentInput) =>
      queryClient
        .getMutationCache()
        .build(queryClient, pullRequestCommentMutationOptions(queryClient))
        .execute(input));
  const normalizedBody = body.trim();
  const canSubmit =
    normalizedBody.length > 0 &&
    normalizedBody.length <= MAX_COMMENT_LENGTH &&
    submissionState.kind !== "pending";

  const submit = () => {
    "background only";
    const commentBody = bodyRef.current.trim();
    if (
      commentBody.length === 0 ||
      commentBody.length > MAX_COMMENT_LENGTH ||
      submittingRef.current
    ) {
      return;
    }
    submittingRef.current = true;
    setSubmissionState({ kind: "pending" });
    postComment({
      projectId: props.detail.projectId,
      repository: props.detail.repository,
      number: props.detail.number,
      body: commentBody,
    })
      .then(() => {
        bodyRef.current = "";
        setBody("");
        setEditorRevision((revision) => revision + 1);
        setSubmissionState({ kind: "idle" });
      })
      .catch((error: unknown) => {
        setSubmissionState({
          kind: "error",
          message: error instanceof Error ? error.message : "GitHub CLI comment failed.",
        });
      })
      .finally(() => {
        submittingRef.current = false;
      });
  };

  const handleKeyDown = (event: CommentKeyEvent) => {
    "background only";
    if (event.key !== "Enter" || event.shiftKey === true || isComposingRef.current) {
      return;
    }
    event.preventDefault?.();
    event.stopPropagation?.();
    submit();
  };

  const errorMessage = submissionState.kind === "error" ? submissionState.message : null;

  return (
    <view className="SharedPrCommentComposer">
      <view className="SharedPrCommentComposerControl">
        <view
          className="SharedPrCommentComposerAccount"
          accessibility-element={true}
          accessibility-label="Commenting as your GitHub account"
        >
          <svg
            className="SharedPrCommentComposerAccountIcon"
            content={colorizeLynxSvg(githubSvg, semanticIconColor("secondary"))}
          />
        </view>
        <NativeCommentTextarea
          revision={editorRevision}
          pending={submissionState.kind === "pending"}
          value={body}
          onInput={(event) => {
            "background only";
            bodyRef.current = event.detail.value;
            isComposingRef.current = event.detail.isComposing;
            setBody(event.detail.value);
            if (submissionState.kind === "error") {
              setSubmissionState({ kind: "idle" });
            }
          }}
          onKeyDown={handleKeyDown}
        />
        <Button
          className="SharedPrCommentComposerSubmit"
          size="icon-sm"
          shape="capsule"
          disabled={!canSubmit}
          aria-label="Post comment"
          accessibility-label="Post comment"
          onClick={submit}
        >
          <svg
            className="SharedPrCommentComposerSubmitIcon"
            content={colorizeLynxSvg(sendArrowSvg, activeTheme.theme.surface)}
          />
        </Button>
      </view>
      {errorMessage ? (
        <view
          className="SharedPrCommentComposerError"
          accessibility-element={true}
          accessibility-role="alert"
          accessibility-label={`Could not post comment. ${errorMessage}`}
        >
          <text className="SharedPrCommentComposerErrorTitle">Could not post comment</text>
          <text className="SharedPrCommentComposerErrorDescription">{errorMessage}</text>
        </view>
      ) : null}
    </view>
  );
}
