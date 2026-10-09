// P0-S5: CEF <webview> fallback-path spike.
// Stage A: load a sidecar-hosted page (proves the element renders on Lynxtron mac arm64).
// Stage B: navigate to the synara web dev instance via 302 (proves the real app loads).

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from '@lynx-js/react';

export function WebviewTest(props: { port: number; report: (line: string) => void }) {
  const { port, report } = props;
  const [src, setSrc] = useState(`http://127.0.0.1:${port}/page`);
  const [status, setStatus] = useState('stage A: loading sidecar page…');
  const [showWebview, setShowWebview] = useState(false);
  const stageRef = useRef<'A' | 'B'>('A');
  const navigatedRef = useRef(false);

  const say = (phase: string, obj: any) => {
    const line = `[P0-S5] ${phase} ${JSON.stringify(obj)}`;
    console.log(line);
    report(line);
  };

  // Staged insertion: header renders first (proves UI alive), webview inserted
  // at +1.5s so error ordering is observable in watch-mode console.
  useEffect(() => {
    say('stage', { step: 'header-rendered' });
    const t = setTimeout(() => {
      say('stage', { step: 'insert-webview' });
      setShowWebview(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const onLoad = (e: any) => {
    const url = String(e?.detail?.url ?? src);
    say('load', { stage: stageRef.current, url });
    if (stageRef.current === 'A') {
      stageRef.current = 'B';
      setStatus('stage A loaded OK → stage B: synara web…');
      // give the renderer a moment, then navigate to synara via 302
      setTimeout(() => {
        navigatedRef.current = true;
        setSrc(`http://127.0.0.1:${port}/synara`);
      }, 800);
    } else {
      setStatus('stage B loaded: ' + url);
    }
  };

  const onError = (e: any) => {
    say('error', { stage: stageRef.current, detail: e?.detail ?? null });
    setStatus('error: ' + JSON.stringify(e?.detail ?? {}));
  };

  const onLocationChange = (e: any) => {
    say('locationchange', { stage: stageRef.current, url: e?.detail?.url ?? null });
  };

  return (
    <view className="TWrap">
      <view className="THeader">
        <text className="TTitle">P0-S5 webview smoke</text>
        <text className="TStatus">{status}</text>
      </view>
      {showWebview ? (
        <webview
          className="WebviewFill"
          src={src}
          bindload={onLoad}
          binderror={onError}
          bindlocationchange={onLocationChange}
        />
      ) : (
        <view className="WebviewFill" />
      )}
    </view>
  );
}
