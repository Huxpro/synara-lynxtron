import { useEffect, useState } from '@lynx-js/react';

import { Button } from '../components/ui/button';
import type { UpdateCheckResult } from '../platform/updater';

async function runUpdateCheck(): Promise<UpdateCheckResult> {
  'background only';
  const { checkForUpdate } = await import(
    /* webpackMode: "eager" */ '../platform/updater'
  );
  return checkForUpdate();
}

async function openDownloadPage(): Promise<void> {
  'background only';
  const { openUpdateDownloadPage } = await import(
    /* webpackMode: "eager" */ '../platform/updater'
  );
  await openUpdateDownloadPage();
}

export function UpdatePage() {
  const [state, setState] = useState<
    | { readonly kind: 'idle' }
    | { readonly kind: 'checking' }
    | { readonly kind: 'result'; readonly value: UpdateCheckResult }
  >({ kind: 'idle' });

  function check() {
    'background only';
    setState({ kind: 'checking' });
    void runUpdateCheck().then((value) => setState({ kind: 'result', value }));
  }

  useEffect(() => {
    'background only';
    check();
  }, []);

  const result = state.kind === 'result' ? state.value : null;
  return (
    <view className="UpdatePage">
      <view className="UpdateCard">
        <view className="UpdateMark">
          <text className="UpdateMarkText">S</text>
        </view>
        <text className="FeatureEyebrow">LYNXTRON EDITION</text>
        <text className="UpdateTitle">Synara updates</text>
        <text className="UpdateDescription">
          This lightweight shell checks the official GitHub release metadata. Installation
          stays in your control.
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
                {result.latestVersion ? `v${result.latestVersion}` : 'Unavailable'}
              </text>
            </view>
          </view>
        ) : null}

        {result?.error ? (
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

        <view className="UpdateActions">
          <Button disabled={state.kind === 'checking'} onClick={check}>
            {state.kind === 'checking' ? 'Checking…' : 'Check for updates'}
          </Button>
          <Button variant="outline" onClick={() => void openDownloadPage()}>
            Open download page
          </Button>
        </view>
      </view>
    </view>
  );
}
