import { useEffect } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { ComposerColumnFrameSurface } from "@synara-web/components/chat/ComposerColumnFrameSurface";
import { ChatSurfaceHeaderFrame } from "@synara-web/components/chat/ChatSurfaceHeaderFrame";
import { ChatSurfaceHeaderIdentity } from "@synara-web/components/chat/ChatSurfaceHeaderIdentity";
import { PanelStateMessage } from "@synara-web/components/chat/PanelStateMessage";

import { Composer } from "../components/composer/Composer.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { XIcon } from "../lib/icons.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { Transcript } from "./Transcript";
import { fetchThreadHeaderSummary, fetchThreadTranscriptRows, queryClient } from "./queries";
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
  const query = useQuery({
    queryKey: ["thread-detail", props.threadId],
    queryFn: async () => {
      "background only";
      const [rows, summary] = await Promise.all([
        fetchThreadTranscriptRows(props.threadId),
        fetchThreadHeaderSummary(props.threadId),
      ]);
      return { data: rows, summary };
    },
    refetchInterval: 500,
    retry: false,
  });
  const summary = query.data?.summary;
  useEffect(() => {
    if (summary?.title) props.onTitleChange?.(summary.title);
  }, [props.onTitleChange, summary?.title]);
  if (query.isPending) {
    return <PanelStateMessage fill="flex">Loading Side…</PanelStateMessage>;
  }
  if (query.isError || !summary) {
    return (
      <PanelStateMessage fill="flex" intent="alert">
        Unable to load Side.
      </PanelStateMessage>
    );
  }
  const rows = query.data?.data ?? [];
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
            lockedProvider={summary.lockedProvider}
            runtimeMode={summary.runtimeMode}
            sessionStatus={summary.sessionStatus}
            threadId={props.threadId}
            workspaceRoot={summary.workspaceRoot}
            onSendSucceeded={() =>
              queryClient.invalidateQueries({
                queryKey: ["thread-detail", props.threadId],
              })
            }
          />
        </ComposerColumnFrameSurface>
      </view>
    </view>
  );
}
