import { useState } from "@lynx-js/react";

import {
  FILE_COMMENT_TEXT_MAX_CHARS,
  formatFileCommentRange,
  normalizeFileCommentText,
} from "@synara-web/lib/fileComments";
import { SynaraLogo } from "~/components/SynaraLogo";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea.lynx";

export function ExplorerFileCommentEditor(props: {
  readonly lineNumber: number;
  readonly onCancel: () => void;
  readonly onSubmit: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  const normalized = normalizeFileCommentText(value);
  const canSubmit = normalized.length > 0 && normalized.length <= FILE_COMMENT_TEXT_MAX_CHARS;

  return (
    <view className="ExplorerDockCommentEditor">
      <view className="ExplorerDockCommentHeader">
        <view className="ExplorerDockCommentIdentity">
          <view className="ExplorerDockCommentBadge">
            <SynaraLogo className="ExplorerDockCommentBadgeMark" aria-label="Synara" />
          </view>
          <text className="ExplorerDockCommentTitle">Local comment</text>
        </view>
        <text className="ExplorerDockCommentTarget">
          Comment on{" "}
          {formatFileCommentRange({
            startLine: props.lineNumber,
            endLine: props.lineNumber,
          })}
        </text>
      </view>
      <Textarea
        className="ExplorerDockCommentInput"
        aria-label={`Comment on line ${props.lineNumber}`}
        nativeInput
        placeholder="Request change"
        maxLength={FILE_COMMENT_TEXT_MAX_CHARS}
        maxLines={4}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <view className="ExplorerDockCommentActions">
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() => {
            if (canSubmit) props.onSubmit(normalized);
          }}
        >
          Comment
        </Button>
      </view>
    </view>
  );
}
