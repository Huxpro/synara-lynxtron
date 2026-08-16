import { useEffect, useState } from '@lynx-js/react';

import { Button } from '../components/ui/button.lynx';
import { openPathInEditor } from '../data/synaraClient.lynx';
import { resolveExplorerPdfOpenTarget } from './explorerPdf.logic';
import { buildPdfPagePreviewUrl } from './localPreview.logic';

function fileName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() || path;
}

export function ExplorerPdfFallback(props: {
  readonly path: string;
  readonly metadataError: boolean;
  readonly metadataPending: boolean;
  readonly pageCount: number;
  readonly previewError: boolean;
  readonly previewPending: boolean;
  readonly previewUrl: string | null;
  readonly workspaceRoot: string;
}) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const openTarget = resolveExplorerPdfOpenTarget({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.path,
  });
  const pageCount = props.pageCount;
  const pageUrl = props.previewUrl
    ? buildPdfPagePreviewUrl({
        previewUrl: props.previewUrl,
        page,
      })
    : null;
  useEffect(() => {
    setPage(1);
  }, [props.path, props.workspaceRoot]);

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
    <view
      className={`ExplorerDockPdf${
        pageCount > 1 ? ' ExplorerDockPdf--multi-page' : ''
      }`}
    >
      <view className="ExplorerDockPdfToolbar">
        <view className="ExplorerDockPdfIdentity">
          <text className="ExplorerDockPdfTitle">{fileName(props.path)}</text>
          <text className="ExplorerDockPdfBadge">PDF</text>
        </view>
        <view className="ExplorerDockPdfControls">
          <Button
            className="ExplorerDockPdfPrevious"
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            aria-label="Previous PDF page"
            onClick={() => {
              'background only';
              setPage((current) => Math.max(1, current - 1));
            }}
          >
            <text className="ExplorerDockPdfCompactNav">‹</text>
            <text className="ExplorerDockPdfNavLabel">Previous</text>
          </Button>
          <text className="ExplorerDockPdfPage">
            {pageCount > 0 ? `${page} / ${pageCount}` : '— / —'}
          </text>
          <Button
            className="ExplorerDockPdfNext"
            variant="ghost"
            size="sm"
            disabled={pageCount === 0 || page >= pageCount}
            aria-label="Next PDF page"
            onClick={() => {
              'background only';
              setPage((current) => Math.min(pageCount, current + 1));
            }}
          >
            <text className="ExplorerDockPdfCompactNav">›</text>
            <text className="ExplorerDockPdfNavLabel">Next</text>
          </Button>
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
            <text className="ExplorerDockPdfCompactOpen">↗</text>
            <text className="ExplorerDockPdfOpenLabel">
              {opening ? 'Opening…' : 'Open'}
            </text>
          </Button>
        </view>
      </view>
      <view className="ExplorerDockPdfPageFrame">
        {props.previewPending || props.metadataPending ? (
          <text className="ExplorerDockPdfStatus">Rendering PDF…</text>
        ) : props.previewError ||
          !props.previewUrl ||
          props.metadataError ||
          !pageUrl ? (
          <view className="ExplorerDockPdfError">
            <text className="ExplorerDockPdfStatus ExplorerDockState--error">
              Could not render this PDF.
            </text>
          </view>
        ) : (
          <image
            className="ExplorerDockPdfPageImage"
            src={pageUrl}
            mode="aspectFit"
            accessibility-element={true}
            accessibility-label={`${fileName(props.path)}, page ${page} of ${pageCount}`}
          />
        )}
      </view>
      {openError ? (
        <text className="ExplorerDockPdfStatus ExplorerDockState--error">
          {openError}
        </text>
      ) : null}
    </view>
  );
}
