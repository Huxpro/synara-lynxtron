import temporaryThreadSvg from '@synara-central-icons/bubble-annotation-5.svg?raw';
import { useEffect, useRef, useState } from '@lynx-js/react';

import { useTheme } from '../adapters/useTheme.lynx';
import { Button } from '../components/ui/button';
import {
  DeviceLaptopIcon,
  FolderIcon,
  GitBranchIcon,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { dispatchSynaraCommand } from '../data/synaraClient.lynx';
import { queryClient } from './queries';

import './empty-thread-context-tray.css';

function contextCommandId(kind: string): string {
  'background only';
  return `lynx-empty-thread-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function EmptyThreadContextTray(props: {
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly projectName: string;
  readonly threadId: string;
}) {
  const [temporary, setTemporary] = useState(false);
  const temporaryRef = useRef(false);
  const { svgColors } = useTheme();
  temporaryRef.current = temporary;

  useEffect(() => {
    return () => {
      if (!temporaryRef.current) return;
      void dispatchSynaraCommand({
        type: 'thread.delete',
        commandId: contextCommandId('delete') as never,
        threadId: props.threadId as never,
      }).finally(() => {
        void queryClient.invalidateQueries({ queryKey: ['threads'] });
        void queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] });
      });
    };
  }, [props.threadId]);

  return (
    <view className="EmptyThreadContextTray">
      <view className="EmptyThreadContextIdentity">
        <FolderIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">{props.projectName}</text>
      </view>
      <view
        className="EmptyThreadContextStatus"
        aria-disabled="true"
        accessibility-state={{ disabled: true }}
      >
        <DeviceLaptopIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">
          {props.envMode === 'local' ? 'Local' : 'Worktree'}
        </text>
      </view>
      <view
        className="EmptyThreadContextStatus"
        aria-disabled="true"
        accessibility-state={{ disabled: true }}
      >
        <GitBranchIcon className="EmptyThreadContextIcon" size={14} />
        <text className="EmptyThreadContextLabel">{props.branch ?? 'main'}</text>
      </view>
      <view className="EmptyThreadContextSpacer" />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Temporary chat"
        buttonProps={{
          'aria-pressed': temporary,
          'accessibility-state': { selected: temporary },
        }}
        className={`EmptyThreadTemporaryButton${
          temporary ? ' EmptyThreadTemporaryButton--active' : ''
        }`}
        onClick={() => setTemporary((current) => !current)}
      >
        <svg
          className="EmptyThreadTemporaryIcon"
          content={colorizeLynxSvg(
            temporaryThreadSvg,
            temporary ? svgColors.accentForeground : svgColors.mutedForeground
          )}
        />
        <text className="EmptyThreadTemporaryLabel">Temporary</text>
      </Button>
    </view>
  );
}
