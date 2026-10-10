import { useEffect } from "@lynx-js/react";
import { ComposerColumnFrameSurface } from "@synara-web/components/chat/ComposerColumnFrameSurface";
import { ChatSurfaceHeaderFrame } from "@synara-web/components/chat/ChatSurfaceHeaderFrame";
import { ChatSurfaceHeaderIdentity } from "@synara-web/components/chat/ChatSurfaceHeaderIdentity";
import { PanelStateMessage } from "@synara-web/components/chat/PanelStateMessage";

import { Composer } from "../components/composer/Composer.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { XIcon } from "../lib/icons.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { Transcript } from "./Transcript";
import { useThreadPageData } from "./threadPageStore.lynx";
import "./embedded-sidechat-pane.css";

export function EmbeddedSidechatPane(props: {
  readonly chatFontSizePx: number;
  readonly threadId: string;
  readonly timestampFormat: "locale" | "12-hour" | "24-hour";
  readonly viewportHeight: number;
  readonly viewportWidth: number;
  readonly onTitleChange?: (title: string) => void;
  readonly onClose: () => void;
}) {
  // The store's view of the Side thread, as the thread page reads its own.
  // Upstream's session sync leases it while it is the dock's active pane
  // (`rightDockState.lynx.ts` mirrors the Lynx dock into upstream's dock store),
  // so streamed text, approvals and a rename arrive as store changes.
  const read = useThreadPageData(props.threadId, { retain: false });
  const summary = read.data?.summary;
  useEffect(() => {
    if (summary?.title) props.onTitleChange?.(summary.title);
  }, [props.onTitleChange, summary?.title]);
  if (read.isPending) {
    return <PanelStateMessage fill="flex">Loading Side…</PanelStateMessage>;
  }
  if (read.error || !summary) {
    return (
      <PanelStateMessage fill="flex" intent="alert">
        Unable to load Side.
      </PanelStateMessage>
    );
  }
  const rows = read.data?.data ?? [];
  const close = useLynxInteractiveState({
    baseClassName: "EmbeddedSidechatPaneClose",
    accessibleLabel: "Close selected Side",
    onActivate: props.onClose,
  });
  return (
    <view className="EmbeddedSidechatPane">
      <ChatSurfaceHeaderFrame className="EmbeddedSidechatPaneHeader">
        <ChatSurfaceHeaderIdentity
          highlighted
          icon={<OpenAIProviderIcon provider={summary.provider} />}
          iconTitle={summary.provider ?? "Provider"}
          title={summary.title}
          suffix={
            <view className={close.className} {...close.eventProps}>
              <XIcon size={12} />
            </view>
          }
        />
      </ChatSurfaceHeaderFrame>
      <view className="EmbeddedSidechatPaneTranscript">
        <view className="ThreadTranscriptColumn">
          <Transcript
            activeTurnId={summary.activeTurnId}
            chatFontSizePx={props.chatFontSizePx}
            interactionMode={summary.interactionMode === "plan" ? "plan" : "default"}
            modelSelection={summary.modelSelection}
            pinnedMessageIds={new Set(summary.pinnedMessages.map((pin) => pin.messageId))}
            rows={rows}
            runtimeMode={summary.runtimeMode}
            sessionStatus={summary.sessionStatus}
            threadId={props.threadId}
            timestampFormat={props.timestampFormat}
            viewportHeight={props.viewportHeight}
            viewportWidth={props.viewportWidth}
            workspaceRoot={summary.workspaceRoot}
          />
        </view>
      </view>
      <view className="EmbeddedSidechatPaneComposer">
        <ComposerColumnFrameSurface>
          <Composer
            activities={summary.activities}
            activeTurnId={summary.activeTurnId}
            chatFontSizePx={props.chatFontSizePx}
            interactionMode={summary.interactionMode === "plan" ? "plan" : "default"}
            modelSelection={summary.modelSelection}
            boundProvider={summary.boundProvider}
            runtimeMode={summary.runtimeMode}
            sessionStatus={summary.sessionStatus}
            threadId={props.threadId}
            workspaceRoot={summary.workspaceRoot}
          />
        </ComposerColumnFrameSurface>
      </view>
    </view>
  );
}
