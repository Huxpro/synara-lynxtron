import temporaryThreadSvg from '@synara-central-icons/bubble-annotation-5.svg?raw';
import type { ReactNode } from '@lynx-js/react';

import { useTheme } from '../adapters/useTheme.lynx';
import { Button } from '../components/ui/button';
import { Menu, MenuItem, MenuPopup, MenuTrigger } from '../components/ui/menu.lynx';
import {
  DeviceLaptopIcon,
  FolderIcon,
  GitBranchIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';

import './empty-thread-context-tray.css';

export function EmptyThreadContextTray(props: {
  readonly branch: string | null;
  readonly className?: string;
  readonly envMode: 'local' | 'worktree';
  readonly onEnvModeChange?: (envMode: 'local' | 'worktree') => void;
  readonly onTemporaryChange: () => void;
  readonly projectControl?: ReactNode;
  readonly projectName: string;
  readonly temporary: boolean;
}) {
  const { semanticIconColor, svgColors } = useTheme();

  return (
    <view className={`EmptyThreadContextTray${props.className ? ` ${props.className}` : ''}`}>
      {props.projectControl ?? (
        <view className="EmptyThreadContextIdentity">
          <FolderIcon className="EmptyThreadContextIcon" size={14} />
          <text className="EmptyThreadContextLabel">{props.projectName}</text>
        </view>
      )}
      {props.onEnvModeChange ? (
        <Menu>
          <MenuTrigger ariaLabel={props.envMode === 'local' ? 'Local' : 'Worktree'}>
            <view className="EmptyThreadContextStatus EmptyThreadContextStatus--interactive">
              <DeviceLaptopIcon className="EmptyThreadContextIcon" size={14} />
              <text className="EmptyThreadContextLabel">
                {props.envMode === 'local' ? 'Local' : 'Worktree'}
              </text>
            </view>
          </MenuTrigger>
          <MenuPopup align="start" side="top">
            <MenuItem onClick={() => props.onEnvModeChange?.('local')}>
              <DeviceLaptopIcon size={14} />
              <text>Local</text>
            </MenuItem>
            <MenuItem onClick={() => props.onEnvModeChange?.('worktree')}>
              <GitBranchIcon size={14} />
              <text>Worktree</text>
            </MenuItem>
          </MenuPopup>
        </Menu>
      ) : (
        <view className="EmptyThreadContextStatus">
          <DeviceLaptopIcon className="EmptyThreadContextIcon" size={14} />
          <text className="EmptyThreadContextLabel">
            {props.envMode === 'local' ? 'Local' : 'Worktree'}
          </text>
        </view>
      )}
      {props.branch ? (
        <view className="EmptyThreadContextStatus">
          <GitBranchIcon className="EmptyThreadContextIcon" size={14} />
          <text className="EmptyThreadContextLabel">{props.branch}</text>
        </view>
      ) : null}
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
              : semanticIconColor('secondary')
          )}
        />
        <text className="EmptyThreadTemporaryLabel">Temporary</text>
      </Button>
    </view>
  );
}
