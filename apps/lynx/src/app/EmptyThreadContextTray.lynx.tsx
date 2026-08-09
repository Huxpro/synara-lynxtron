import temporaryThreadSvg from '@synara-central-icons/bubble-annotation-5.svg?raw';

import { useTheme } from '../adapters/useTheme.lynx';
import { Button } from '../components/ui/button';
import {
  DeviceLaptopIcon,
  FolderIcon,
  GitBranchIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

import './empty-thread-context-tray.css';

export function EmptyThreadContextTray(props: {
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly onTemporaryChange: () => void;
  readonly projectName: string;
  readonly temporary: boolean;
}) {
  const { svgColors } = useTheme();

  return (
    <view className="EmptyThreadContextTray">
      <view className="EmptyThreadContextIdentity">
        <FolderIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">{props.projectName}</text>
      </view>
      <view className="EmptyThreadContextStatus">
        <DeviceLaptopIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">
          {props.envMode === 'local' ? 'Local' : 'Worktree'}
        </text>
      </view>
      <view className="EmptyThreadContextStatus">
        <GitBranchIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">{props.branch ?? 'main'}</text>
      </view>
      <view className="EmptyThreadContextSpacer" />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Temporary chat"
        buttonProps={{
          'aria-pressed': props.temporary,
          'accessibility-state': { selected: props.temporary },
        }}
        className={`EmptyThreadTemporaryButton${
          props.temporary ? ' EmptyThreadTemporaryButton--active' : ''
        }`}
        onClick={props.onTemporaryChange}
      >
        <svg
          className="EmptyThreadTemporaryIcon"
          content={colorizeLynxSvg(
            temporaryThreadSvg,
            props.temporary
              ? svgColors.accentForeground
              : svgColors.mutedForeground
          )}
        />
        <text className="EmptyThreadTemporaryLabel">Temporary</text>
      </Button>
    </view>
  );
}
