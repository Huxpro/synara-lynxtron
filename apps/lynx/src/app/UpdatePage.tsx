import { useEffect, useState } from "@lynx-js/react";

import { LynxBrandMarks } from "../components/brand/LynxBrandMarks.lynx";
import { Button } from "../components/ui/button";
import type { UpdateCheckResult } from "../platform/updater";

export type UpdatePageState =
  | { readonly kind: "idle" }
  | { readonly kind: "checking" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "result"; readonly value: UpdateCheckResult };

export async function runUpdateCheckState(
  checkForUpdate: () => Promise<UpdateCheckResult>,
): Promise<UpdatePageState> {
  try {
    return { kind: "result", value: await checkForUpdate() };
  } catch (error) {
    return {
      kind: "error",
      message: error instanceof Error ? error.message : "Unable to check for updates.",
    };
  }
}

async function runUpdateCheck(): Promise<UpdateCheckResult> {
  "background only";
  const { checkForUpdate } = await import(/* webpackMode: "eager" */ "../platform/updater");
  return checkForUpdate();
}

async function openDownloadPage(): Promise<void> {
  "background only";
  const { openUpdateDownloadPage } = await import(/* webpackMode: "eager" */ "../platform/updater");
  await openUpdateDownloadPage();
}

export function UpdatePage() {
  const [state, setState] = useState<UpdatePageState>({ kind: "idle" });
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function check() {
    "background only";
    setState({ kind: "checking" });
    void runUpdateCheckState(runUpdateCheck).then(setState);
  }

  function openDownload() {
    "background only";
    setDownloadError(null);
    void openDownloadPage().catch((error) => {
      setDownloadError(error instanceof Error ? error.message : "Unable to open download page.");
    });
  }

  useEffect(() => {
    "background only";
    check();
  }, []);

  const result = state.kind === "result" ? state.value : null;
  return (
    <view className="UpdatePage">
      <view className="UpdateCard">
        <view className="UpdateMark">
          <text className="UpdateMarkText">S</text>
        </view>
        <view className="UpdateEdition">
          <LynxBrandMarks className="UpdateEditionMarks" size={14} />
          <text className="FeatureEyebrow">LYNXTRON EDITION</text>
        </view>
        <text className="UpdateTitle">Synara updates</text>
        <text className="UpdateDescription">
          This lightweight shell checks the official GitHub release metadata. Installation stays in
          your control.
        </text>

        {result ? (
          <view className="UpdateVersionPanel">
            <view className="UpdateVersionRow">
              <text className="UpdateVersionLabel">Installed</text>
              <text className="UpdateVersionValue">v{result.currentVersion}</text>
            </view>
            <view className="UpdateVersionRow">
              <text className="UpdateVersionLabel">Latest release</text>
              <text className="UpdateVersionValue">
                {result.latestVersion ? `v${result.latestVersion}` : "Unavailable"}
              </text>
            </view>
          </view>
        ) : null}

        {state.kind === "error" ? (
          <text className="UpdateStatus UpdateStatus--error">
            Could not check releases · {state.message}
          </text>
        ) : result?.error ? (
          <text className="UpdateStatus UpdateStatus--error">
            Could not check releases · {result.error}
          </text>
        ) : result?.updateAvailable ? (
          <text className="UpdateStatus">A newer release is available.</text>
        ) : result?.latestVersion ? (
          <text className="UpdateStatus">You are up to date.</text>
        ) : (
          <text className="UpdateStatus">
            No download starts automatically and no installer is run.
          </text>
        )}
        {downloadError ? (
          <text className="UpdateStatus UpdateStatus--error">
            Could not open download page · {downloadError}
          </text>
        ) : null}

        <view className="UpdateActions">
          <Button disabled={state.kind === "checking"} onClick={check}>
            {state.kind === "checking" ? "Checking…" : "Check for updates"}
          </Button>
          <Button variant="outline" onClick={openDownload}>
            Open download page
          </Button>
        </view>
      </view>
    </view>
  );
}
