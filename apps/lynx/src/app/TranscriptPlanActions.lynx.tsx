import { useEffect, useRef, useState } from "@lynx-js/react";
import {
  buildProposedPlanMarkdownFilename,
  normalizePlanMarkdownForExport,
} from "@synara-web/proposedPlan";
import { createPlanCardActions } from "../generated/transcriptCardActions.generated";
import { clipboard } from "../platform/clipboard";
import { toastManager } from "../components/ui/toast.lynx";
import { IconButton } from "../components/ui/icon-button.lynx";
import { ArrowDownIcon, ArrowUpIcon, CopyIcon } from "../lib/icons.lynx";

export function TranscriptPlanActions(props: {
  readonly planMarkdown: string;
  readonly workspaceRoot: string | null;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    "background only";
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);
  const actions = createPlanCardActions({
    filename: buildProposedPlanMarkdownFilename(props.planMarkdown),
    markdown: normalizePlanMarkdownForExport(props.planMarkdown),
    workspaceRoot: props.workspaceRoot ?? undefined,
    setIsDownloading,
    setIsExporting,
    copyToClipboard: (value) => {
      "background only";
      void clipboard
        .writeText(value)
        .then(() => {
          setCopied(true);
          if (timer.current !== null) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            timer.current = null;
            setCopied(false);
          }, 2000);
          toastManager.add({ type: "success", title: "Plan copied as markdown" });
        })
        .catch((error: unknown) =>
          toastManager.add({
            type: "error",
            title: "Could not copy plan",
            description: error instanceof Error ? error.message : String(error),
          }),
        );
    },
  });
  return (
    <view className="TranscriptPlanActions">
      <IconButton
        label="Download to .plan folder"
        size="icon-xs"
        variant="outline"
        disabled={isDownloading}
        onClick={actions.handleDownload}
      >
        <ArrowDownIcon size={14} />
      </IconButton>
      <IconButton
        label="Export markdown file"
        size="icon-xs"
        variant="outline"
        disabled={isExporting}
        onClick={actions.handleExport}
      >
        <ArrowUpIcon size={14} />
      </IconButton>
      <IconButton
        label={copied ? "Copied" : "Copy as markdown"}
        size="icon-xs"
        variant="outline"
        onClick={actions.handleCopy}
      >
        <CopyIcon size={14} />
      </IconButton>
    </view>
  );
}
