import { useState } from '@lynx-js/react';

import { FileEntryIcon } from '../components/FileEntryIcon.lynx';
import { Button } from '../components/ui/button.lynx';
import { openPathInEditor } from '../data/synaraClient.lynx';
import { resolveExplorerPdfOpenTarget } from './explorerPdf.logic';

function fileName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() || path;
}

export function ExplorerPdfFallback(props: {
  readonly path: string;
  readonly previewError: boolean;
  readonly previewPending: boolean;
  readonly previewUrl: string | null;
  readonly workspaceRoot: string;
}) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const openTarget = resolveExplorerPdfOpenTarget({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.path,
  });

  async function openInDefaultApp() {
    'background only';
    if (!openTarget || opening) return;
    setOpening(true);
    setOpenError(null);
    try {
      await openPathInEditor({
        cwd: openTarget,
        editor: 'system-default',
      });
    } catch (error) {
      setOpenError(
        error instanceof Error
          ? error.message
          : 'Could not open this PDF in the default app.'
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <view className="ExplorerDockPdf">
      <view className="ExplorerDockPdfIcon">
        <FileEntryIcon pathValue={props.path} />
      </view>
      <view className="ExplorerDockPdfCopy">
        <view className="ExplorerDockPdfTitleRow">
          <text className="ExplorerDockPdfTitle">{fileName(props.path)}</text>
          <text className="ExplorerDockPdfBadge">PDF</text>
        </view>
        <text className="ExplorerDockPdfDescription">
          PDF preview is not available in the native client yet.
        </text>
        <text className="ExplorerDockPdfHint">
          Open it in your default PDF app to view pages, search, and select text.
        </text>
      </view>
      {props.previewPending ? (
        <text className="ExplorerDockPdfStatus">Preparing file…</text>
      ) : props.previewError || !props.previewUrl ? (
        <text className="ExplorerDockPdfStatus ExplorerDockState--error">
          Could not prepare this PDF.
        </text>
      ) : null}
      <Button
        className="ExplorerDockPdfOpen"
        variant="secondary"
        size="sm"
        disabled={!props.previewUrl || !openTarget || opening}
        aria-label={`Open ${fileName(props.path)} in default app`}
        onClick={() => {
          'background only';
          void openInDefaultApp();
        }}
      >
        {opening ? 'Opening…' : 'Open in default app'}
      </Button>
      {openError ? (
        <text className="ExplorerDockPdfStatus ExplorerDockState--error">
          {openError}
        </text>
      ) : null}
    </view>
  );
}
