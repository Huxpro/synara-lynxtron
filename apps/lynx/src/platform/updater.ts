import "background-only";

import { bridgeCall } from "./bridge";

export interface UpdateCheckResult {
  readonly currentVersion: string;
  readonly latestVersion: string | null;
  readonly updateAvailable: boolean;
  readonly releaseName: string | null;
  readonly publishedAt: string | null;
  readonly downloadPage: string;
  readonly error: string | null;
}

export function checkForUpdate(): Promise<UpdateCheckResult> {
  return bridgeCall("updaterCheck");
}

export async function openUpdateDownloadPage(): Promise<boolean> {
  const result = await bridgeCall<{ readonly opened: boolean }>("updaterOpenDownload");
  return result.opened;
}
