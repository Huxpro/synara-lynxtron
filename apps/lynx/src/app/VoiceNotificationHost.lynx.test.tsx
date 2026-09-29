import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";
import { NotificationDismissIcon } from "./NotificationDismissIcon.lynx";

describe("Lynx voice notification presentation", () => {
  it("matches the shared Web toast close strength", () => {
    render(<NotificationDismissIcon />);
    expect(elementTree.root?.querySelector("svg")?.getAttribute("content")).toContain(
      'stroke="rgba(13, 13, 13, 0.65)"',
    );
  });

  it("uses the app notification stack instead of composer error copy", () => {
    const composerSource = readFileSync(
      new URL("../components/composer/Composer.lynx.tsx", import.meta.url),
      "utf8",
    );
    // Voice lives in the hook the composer and the Kanban task dialog share.
    const voiceSource = readFileSync(
      new URL("../components/composer/useNativeComposerVoice.lynx.ts", import.meta.url),
      "utf8",
    );
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(voiceSource).toContain("resolveVoiceTranscriptionFailure(error");
    expect(voiceSource).toContain('transcriptionFailedTitle: "Couldn\'t transcribe voice note"');
    expect(voiceSource).toContain("actionLabel: failure.actionLabel");
    expect(voiceSource).toContain("onAction: refreshStatuses");
    expect(voiceSource).toContain("providerRef.current === requestProvider");
    expect(voiceSource).toContain("isVoiceRecorderActionArmed({");
    expect(voiceSource).toContain("resolveVoiceRecordingStartGuard({");
    expect(voiceSource).toContain("pendingUserInputCount: input.pendingUserInputCount,");
    expect(composerSource).toContain("useNativeComposerVoice({");
    expect(composerSource).toContain("pendingUserInputCount,");
    expect(voiceSource).toContain("if (voiceState.canStartVoiceNotes || !isRecording) return;");
    expect(voiceSource).toContain('title: "Could not start recording"');
    expect(voiceSource).toContain('title: "No audio was captured."');
    expect(composerSource).not.toContain(
      "sanitizedMessage.startsWith('Provider adapter request failed')",
    );
    expect(routerSource).toContain("<VoiceNotificationHost />");
    expect(routerSource).toContain(
      "pendingUserInputCount={currentThread?.pendingUserInputs.length ?? 0}",
    );
    const notificationHost = readFileSync(
      new URL("./VoiceNotificationHost.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(notificationHost).toContain("<CircleAlertIcon");
    expect(notificationHost).toContain("notification.description");
    expect(notificationHost).toContain("notification.actionLabel");
    expect(notificationHost).toContain("<NotificationDismissIcon />");
    expect(styles).toMatch(
      /\.VoiceNotificationToast\s*\{[^}]*min-height:\s*54px;[^}]*border:\s*1px solid var\(--color-border\);[^}]*border-radius:\s*12px;/s,
    );
  });
});
