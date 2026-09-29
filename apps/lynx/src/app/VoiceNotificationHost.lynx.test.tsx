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
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(composerSource).toContain("resolveVoiceTranscriptionFailure(error");
    expect(composerSource).toContain('transcriptionFailedTitle: "Couldn\'t transcribe voice note"');
    expect(composerSource).toContain("actionLabel: failure.actionLabel");
    expect(composerSource).toContain("onAction: refreshStatuses");
    expect(composerSource).toContain("voiceProviderRef.current === requestProvider");
    expect(composerSource).toContain("isVoiceRecorderActionArmed({");
    expect(composerSource).toContain("resolveVoiceRecordingStartGuard({");
    expect(composerSource).toContain("pendingUserInputCount,");
    expect(composerSource).toContain(
      "if (voiceState.canStartVoiceNotes || !isVoiceRecording) return;",
    );
    expect(composerSource).toContain('title: "Could not start recording"');
    expect(composerSource).toContain('title: "No audio was captured."');
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
