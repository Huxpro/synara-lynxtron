import { useEffect, useState } from "@lynx-js/react";
import {
  formatZoomPercent,
  nextZoomScale,
  PDF_ZOOM_PRESETS,
  previousZoomScale,
  resolvePdfScale,
  type PdfViewportSize,
  type PdfZoomMode,
} from "@synara/shared/pdfZoom";

import { Button } from "../components/ui/button.lynx";
import { Badge } from "../components/ui/badge.lynx";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  MinusIcon,
  PlusIcon,
} from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { openPathInEditor } from "../data/synaraClient.lynx";
import { resolveExplorerPdfOpenTarget } from "./explorerPdf.logic";
import { clampExplorerPdfPage } from "./explorerPdfPage.logic";
import { buildPdfPagePreviewUrl } from "./localPreview.logic";
import { ExplorerPdfPageImage } from "./ExplorerPdfPageImage.lynx";

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() || path;
}

export function ExplorerPdfFallback(props: {
  readonly path: string;
  readonly metadataError: boolean;
  readonly metadataPending: boolean;
  readonly pageCount: number;
  readonly pageHeight: number;
  readonly pageWidth: number;
  readonly previewError: boolean;
  readonly previewPending: boolean;
  readonly previewUrl: string | null;
  readonly workspaceRoot: string;
  readonly initialZoomMode?: PdfZoomMode;
  readonly zoomMenuDefaultOpen?: boolean;
  readonly pagePreviewUrlBuilder?: (input: {
    readonly page: number;
    readonly width: number;
  }) => string;
}) {
  const { semanticIconColor } = useTheme();
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageDraft, setPageDraft] = useState("1");
  const [viewport, setViewport] = useState<PdfViewportSize | null>(null);
  const [zoomMode, setZoomMode] = useState<PdfZoomMode>(
    props.initialZoomMode ?? { type: "fit-width" },
  );
  const openTarget = resolveExplorerPdfOpenTarget({
    workspaceRoot: props.workspaceRoot,
    relativePath: props.path,
  });
  const pageCount = props.pageCount;
  const intrinsicSize =
    props.pageWidth > 0 && props.pageHeight > 0
      ? { width: props.pageWidth, height: props.pageHeight }
      : null;
  const scale = resolvePdfScale(zoomMode, intrinsicSize, viewport);
  const displayWidth = Math.max(1, Math.round(props.pageWidth * scale));
  const displayHeight = Math.max(1, Math.round(props.pageHeight * scale));
  const rasterWidth = Math.min(1600, Math.max(320, displayWidth));
  const zoomSelection =
    zoomMode.type === "custom" ? String(Math.round(scale * 100)) : zoomMode.type;
  const pageUrl = props.pagePreviewUrlBuilder
    ? props.pagePreviewUrlBuilder({ page, width: rasterWidth })
    : props.previewUrl
      ? buildPdfPagePreviewUrl({
          previewUrl: props.previewUrl,
          page,
          width: rasterWidth,
        })
      : null;
  useEffect(() => {
    setPage(1);
    setPageDraft("1");
    setZoomMode(props.initialZoomMode ?? { type: "fit-width" });
  }, [props.path, props.workspaceRoot]);
  const navigateToPage = (nextPage: number) => {
    const clamped = Math.min(Math.max(Math.round(nextPage), 1), Math.max(pageCount, 1));
    setPage(clamped);
    setPageDraft(String(clamped));
  };
  const commitPageDraft = (value?: string) => {
    navigateToPage(
      clampExplorerPdfPage({
        currentPage: page,
        pageCount,
        value: value ?? pageDraft,
      }),
    );
  };

  async function openInDefaultApp() {
    "background only";
    if (!openTarget || opening) return;
    setOpening(true);
    setOpenError(null);
    try {
      await openPathInEditor({
        cwd: openTarget,
        editor: "system-default",
      });
    } catch (error) {
      setOpenError(
        error instanceof Error ? error.message : "Could not open this PDF in the default app.",
      );
    } finally {
      setOpening(false);
    }
  }

  return (
    <view className={`ExplorerDockPdf${pageCount > 1 ? " ExplorerDockPdf--multi-page" : ""}`}>
      <view className="ExplorerDockPdfToolbar">
        <view className="ExplorerDockPdfIdentity">
          <text className="ExplorerDockPdfTitle">{fileName(props.path)}</text>
          <Badge className="ExplorerDockPdfBadge" size="sm" variant="outline">
            PDF
          </Badge>
        </view>
        <view className="ExplorerDockPdfControls">
          <Button
            className="ExplorerDockPdfPrevious"
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            aria-label="Previous PDF page"
            onClick={() => {
              "background only";
              navigateToPage(page - 1);
            }}
          >
            <ChevronLeftIcon
              className="ExplorerDockPdfToolbarIcon"
              color={semanticIconColor("secondary")}
              size={16}
            />
            <text className="ExplorerDockPdfNavLabel">Previous</text>
          </Button>
          <view className="ExplorerDockPdfPage">
            <view className="ExplorerDockPdfPageInputSlot">
              <textarea
                key={page}
                className="ExplorerDockPdfPageInput"
                aria-label="Current PDF page"
                accessibility-element={true}
                accessibility-label="Current PDF page"
                focusable={true}
                default-value={String(page)}
                maxlength={String(Math.max(pageCount, 1)).length}
                maxlines={1}
                confirm-type="done"
                bindinput={(event) => setPageDraft(event.detail.value.replace(/[^0-9]/g, ""))}
                bindconfirm={(event) => commitPageDraft(event.detail?.value)}
                bindblur={(event) => commitPageDraft(event.detail?.value)}
              />
              <text className="ExplorerDockPdfPageInputValue">{pageDraft || page}</text>
            </view>
            <text className="ExplorerDockPdfPageTotal">
              {pageCount > 0 ? `/ ${pageCount}` : "/ —"}
            </text>
          </view>
          <Button
            className="ExplorerDockPdfNext"
            variant="ghost"
            size="sm"
            disabled={pageCount === 0 || page >= pageCount}
            aria-label="Next PDF page"
            onClick={() => {
              "background only";
              navigateToPage(page + 1);
            }}
          >
            <ChevronRightIcon
              className="ExplorerDockPdfToolbarIcon"
              color={semanticIconColor("secondary")}
              size={16}
            />
            <text className="ExplorerDockPdfNavLabel">Next</text>
          </Button>
          <view className="ExplorerDockPdfZoomControls">
            <Button
              className="ExplorerDockPdfZoomStep"
              variant="ghost"
              size="sm"
              aria-label="Zoom out"
              onClick={() => {
                "background only";
                setZoomMode({ type: "custom", scale: previousZoomScale(scale) });
              }}
            >
              <MinusIcon
                className="ExplorerDockPdfToolbarIcon"
                color={semanticIconColor("secondary")}
                size={16}
              />
            </Button>
            <Menu defaultOpen={props.zoomMenuDefaultOpen}>
              <MenuTrigger
                ariaLabel={`PDF zoom ${formatZoomPercent(scale)}`}
                className="ExplorerDockPdfZoomMenuTrigger"
              >
                <text className="ExplorerDockPdfZoomPercent">{formatZoomPercent(scale)}</text>
                <ChevronDownIcon size={12} color="var(--muted-foreground)" />
              </MenuTrigger>
              <MenuPopup align="end" side="bottom" className="ExplorerDockPdfZoomPopup">
                <MenuRadioGroup
                  value={zoomSelection}
                  onValueChange={(value) => {
                    "background only";
                    if (value === "fit-width" || value === "fit-page") {
                      setZoomMode({ type: value });
                      return;
                    }
                    const percent = Number(value);
                    if (Number.isFinite(percent)) {
                      setZoomMode({ type: "custom", scale: percent / 100 });
                    }
                  }}
                >
                  <MenuRadioItem value="fit-width">Fit width</MenuRadioItem>
                  <MenuRadioItem value="fit-page">Fit page</MenuRadioItem>
                  <MenuSeparator />
                  {PDF_ZOOM_PRESETS.map((preset) => {
                    const percent = String(Math.round(preset * 100));
                    return (
                      <MenuRadioItem key={percent} value={percent}>
                        {percent}%
                      </MenuRadioItem>
                    );
                  })}
                </MenuRadioGroup>
              </MenuPopup>
            </Menu>
            <Button
              className="ExplorerDockPdfZoomStep"
              variant="ghost"
              size="sm"
              aria-label="Zoom in"
              onClick={() => {
                "background only";
                setZoomMode({ type: "custom", scale: nextZoomScale(scale) });
              }}
            >
              <PlusIcon
                className="ExplorerDockPdfToolbarIcon"
                color={semanticIconColor("secondary")}
                size={16}
              />
            </Button>
          </view>
          <Button
            className="ExplorerDockPdfOpen"
            variant="secondary"
            size="sm"
            disabled={!props.previewUrl || !openTarget || opening}
            aria-label={`Open ${fileName(props.path)} in default app`}
            onClick={() => {
              "background only";
              void openInDefaultApp();
            }}
          >
            <ExternalLinkIcon
              className="ExplorerDockPdfCompactOpen"
              color={semanticIconColor("secondary")}
              size={14}
            />
            <text className="ExplorerDockPdfOpenLabel">{opening ? "Opening…" : "Open"}</text>
          </Button>
        </view>
      </view>
      <view
        className="ExplorerDockPdfPageFrame"
        bindlayoutchange={(event: {
          readonly detail?: { readonly height?: number; readonly width?: number };
          readonly params?: { readonly height?: number; readonly width?: number };
        }) => {
          "background only";
          const detail = event.detail ?? event.params ?? {};
          if (
            typeof detail.width === "number" &&
            detail.width > 0 &&
            typeof detail.height === "number" &&
            detail.height > 0
          ) {
            setViewport({ width: detail.width, height: detail.height });
          }
        }}
      >
        {props.previewPending || props.metadataPending ? (
          <text className="ExplorerDockPdfStatus">Rendering PDF…</text>
        ) : props.previewError || !props.previewUrl || props.metadataError || !pageUrl ? (
          <view className="ExplorerDockPdfError">
            <text className="ExplorerDockPdfStatus ExplorerDockState--error">
              Could not render this PDF.
            </text>
          </view>
        ) : (
          <scroll-view className="ExplorerDockPdfVerticalScroll" scroll-orientation="vertical">
            <scroll-view
              className="ExplorerDockPdfHorizontalScroll"
              scroll-orientation="horizontal"
              style={{
                height: `${Math.max(displayHeight + 24, viewport?.height ?? 0)}px`,
              }}
            >
              <view
                className="ExplorerDockPdfPageCanvas"
                style={{
                  width: `${Math.max(displayWidth + 24, viewport?.width ?? 0)}px`,
                  height: `${Math.max(displayHeight + 24, viewport?.height ?? 0)}px`,
                }}
              >
                <ExplorerPdfPageImage
                  key={pageUrl}
                  pageUrl={pageUrl}
                  width={displayWidth}
                  height={displayHeight}
                  accessibilityLabel={`${fileName(props.path)}, page ${page} of ${pageCount}, ${formatZoomPercent(scale)} zoom`}
                />
              </view>
            </scroll-view>
          </scroll-view>
        )}
      </view>
      {openError ? (
        <text className="ExplorerDockPdfStatus ExplorerDockState--error">{openError}</text>
      ) : null}
    </view>
  );
}
