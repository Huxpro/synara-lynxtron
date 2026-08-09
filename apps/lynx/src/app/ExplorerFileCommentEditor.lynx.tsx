import { useState } from '@lynx-js/react';

import {
  FILE_COMMENT_TEXT_MAX_CHARS,
  formatFileCommentRange,
  normalizeFileCommentText,
} from '@synara-web/lib/fileComments';
import { Button } from '../components/ui/button';

export function ExplorerFileCommentEditor(props: {
  readonly lineNumber: number;
  readonly onCancel: () => void;
  readonly onSubmit: (text: string) => void;
}) {
  const [value, setValue] = useState('');
  const normalized = normalizeFileCommentText(value);
  const canSubmit =
    normalized.length > 0 &&
    normalized.length <= FILE_COMMENT_TEXT_MAX_CHARS;

  return (
    <view className="ExplorerDockCommentEditor">
      <view className="ExplorerDockCommentHeader">
        <view className="ExplorerDockCommentIdentity">
          <view className="ExplorerDockCommentBadge">
            <text className="ExplorerDockCommentBadgeMark">S</text>
          </view>
          <text className="ExplorerDockCommentTitle">Local comment</text>
        </view>
        <text className="ExplorerDockCommentTarget">
          Comment on{' '}
          {formatFileCommentRange({
            startLine: props.lineNumber,
            endLine: props.lineNumber,
          })}
        </text>
      </view>
      <textarea
        className="ExplorerDockCommentInput"
        accessibility-element
        accessibility-label={`Comment on line ${props.lineNumber}`}
        focusable
        placeholder="Request change"
        maxlength={FILE_COMMENT_TEXT_MAX_CHARS}
        maxlines={4}
        show-soft-input-on-focus
        bindinput={(event) => {
          'background only';
          setValue(event.detail.value);
        }}
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
