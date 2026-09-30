import arrowUpRightSvg from "@synara-central-icons/arrow-up-right.svg?raw";
import macbookSvg from "@synara-central-icons/macbook-air.svg?raw";
import type { ThreadEnvironmentMode } from "@synara/contracts";
import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";

import { ComposerPrimaryActionComposition } from "@synara-web/components/chat/ComposerInputComposition";
import type { TranscriptAssistantSelection } from "@synara-web/components/chat/chatSelectionActions";

import { ComposerAssistantSelectionsAttachmentElement } from "../adapters/ComposerReferenceAttachmentsCompositionElements.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { scheduleLynxInputFocus } from "../components/ui/focus.lynx";
import { Input, type InputRef } from "../components/ui/input.lynx";
import { useLynxInteractiveState } from "../components/ui/interactive-state.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { CheckIcon, ChevronDownIcon, GitBranchIcon, XIcon } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import type { TranscriptSelectionAnchor } from "./Transcript";
import { resolveSelectionChatComposerPosition } from "./selectionChat.logic";
import "./selection-new-chat-composer.css";

const COMPOSER_WIDTH_PX = 320;
const SELECTION_CHAT_MAX_LINES = 8;
const SELECTION_CHAT_LINE_HEIGHT_PX = 21.125;

function resolveSelectionChatEditorHeight(prompt: string): number {
  const lines = Math.min(SELECTION_CHAT_MAX_LINES, Math.max(1, prompt.split("\n").length));
  return Math.ceil(lines * SELECTION_CHAT_LINE_HEIGHT_PX);
}

function HeaderButton(props: {
  readonly label: string;
  readonly className: string;
  readonly disabled: boolean;
  readonly onActivate: () => void;
  readonly children: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `${props.className}${props.disabled ? " SelectionChatButton--disabled" : ""}`,
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label={props.label} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

/** Electron's ComposerEnvironmentPicker for a new chat: Local project or a new worktree. */
function SelectionChatEnvironmentPicker(props: {
  readonly envMode: ThreadEnvironmentMode;
  readonly canUseWorktree: boolean;
  readonly disabled: boolean;
  readonly onEnvModeChange: (envMode: ThreadEnvironmentMode) => void;
}) {
  const { svgColors, semanticIconColor } = useTheme();
  const muted = semanticIconColor("secondary");
  const local = props.envMode === "local";
  return (
    <Menu>
      <MenuTrigger
        className="SelectionChatEnvTrigger"
        ariaLabel={local ? "Local" : "Worktree"}
        disabled={props.disabled}
      >
        <view className="SelectionChatEnvTriggerContent">
          {local ? (
            <svg
              className="SelectionChatEnvGlyph"
              content={colorizeLynxSvg(macbookSvg, svgColors.foreground)}
            />
          ) : (
            <GitBranchIcon
              className="SelectionChatEnvGlyph"
              color={svgColors.foreground}
              size={14}
            />
          )}
          <text className="SelectionChatEnvLabel">{local ? "Local" : "Worktree"}</text>
          <ChevronDownIcon className="SelectionChatEnvChevron" color={muted} size={12} />
        </view>
      </MenuTrigger>
      <MenuPopup
        className="LxComposerPickerMenuPopup SelectionChatEnvMenu"
        align="start"
        side="top"
        sideOffset={6}
      >
        <MenuGroup>
          <MenuGroupLabel>Work in</MenuGroupLabel>
          <MenuItem
            onClick={local ? undefined : () => props.onEnvModeChange("local")}
            trailing={local ? <CheckIcon className="LxMenuIndicatorIcon" /> : undefined}
          >
            <view className="SelectionChatEnvItem">
              <svg className="SelectionChatEnvGlyph" content={colorizeLynxSvg(macbookSvg, muted)} />
              <text className="SelectionChatEnvItemLabel">Local project</text>
            </view>
          </MenuItem>
          {props.canUseWorktree && local ? (
            <MenuItem onClick={() => props.onEnvModeChange("worktree")}>
              <view className="SelectionChatEnvItem">
                <GitBranchIcon className="SelectionChatEnvGlyph" color={muted} size={14} />
                <text className="SelectionChatEnvItemLabel">New worktree</text>
              </view>
            </MenuItem>
          ) : null}
          {!local ? (
            <MenuItem trailing={<CheckIcon className="LxMenuIndicatorIcon" />}>
              <view className="SelectionChatEnvItem">
                <GitBranchIcon className="SelectionChatEnvGlyph" color={muted} size={14} />
                <text className="SelectionChatEnvItemLabel">Worktree</text>
              </view>
            </MenuItem>
          ) : null}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

/**
 * Electron's SelectionNewChatComposer: a floating composer that keeps the transcript quote
 * while the user writes the first message of a new chat. It opens where the selection
 * toolbar stood and closes on an outside press or Escape unless a submit is in flight.
 */
export function SelectionNewChatComposer(props: {
  readonly selection: TranscriptAssistantSelection;
  readonly anchor: TranscriptSelectionAnchor;
  readonly defaultEnvMode: ThreadEnvironmentMode;
  readonly canUseWorktree: boolean;
  readonly onSubmit: (
    prompt: string,
    envMode: ThreadEnvironmentMode,
    intent: "send" | "compose",
  ) => Promise<void>;
  readonly onClose: () => void;
}) {
  const { svgColors } = useTheme();
  // The full-window layer measures the viewport the composer is clamped into.
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [envMode, setEnvMode] = useState<ThreadEnvironmentMode>(
    props.canUseWorktree ? props.defaultEnvMode : "local",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [height, setHeight] = useState(101);
  const submittingRef = useRef(false);
  const inputRef = useRef<InputRef>(null);
  const position = viewport
    ? resolveSelectionChatComposerPosition({
        anchor: props.anchor,
        size: { width: COMPOSER_WIDTH_PX, height },
        viewport,
      })
    : { left: props.anchor.left, top: props.anchor.top };

  useEffect(() => {
    "background only";
    return scheduleLynxInputFocus(inputRef, [0, 60]);
  }, []);

  const close = () => {
    "background only";
    if (!submittingRef.current) props.onClose();
  };
  const submit = async (intent: "send" | "compose") => {
    "background only";
    if (submittingRef.current || (intent === "send" && !prompt.trim())) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await props.onSubmit(prompt, envMode, intent);
      submittingRef.current = false;
      props.onClose();
    } catch (cause) {
      submittingRef.current = false;
      setError(cause instanceof Error ? cause.message : "Could not start the chat. Try again.");
      setBusy(false);
    }
  };

  return (
    <view
      className="SelectionChatLayer"
      bindlayoutchange={(event: {
        readonly detail?: { readonly width?: number; readonly height?: number };
      }) => {
        const width = event.detail?.width;
        const layerHeight = event.detail?.height;
        if (typeof width === "number" && typeof layerHeight === "number" && width > 0) {
          setViewport((current) =>
            current?.width === width && current.height === layerHeight
              ? current
              : { width, height: layerHeight },
          );
        }
      }}
    >
      <view className="SelectionChatBackdrop" catchtap={close} />
      <view
        className="SelectionChatComposer"
        role="dialog"
        aria-label="New chat from selection"
        accessibility-label="New chat from selection"
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
        bindlayoutchange={(event: { readonly detail?: { readonly height?: number } }) => {
          const next = event.detail?.height;
          if (typeof next === "number" && next > 0 && next !== height) setHeight(next);
        }}
      >
        <view className="SelectionChatEditor">
          <view className="SelectionChatHeader">
            <ComposerAssistantSelectionsAttachmentElement
              selections={[{ id: props.selection.assistantMessageId }]}
            />
            <view className="SelectionChatHeaderActions">
              <HeaderButton
                label="Open in chat"
                className="SelectionChatButton SelectionChatOpenButton"
                disabled={busy}
                onActivate={() => void submit("compose")}
              >
                <text className="SelectionChatOpenLabel">Open in chat</text>
                <svg
                  className="SelectionChatOpenGlyph"
                  content={colorizeLynxSvg(arrowUpRightSvg, svgColors.mutedForeground)}
                />
              </HeaderButton>
              <HeaderButton
                label="Close new chat composer"
                className="SelectionChatButton SelectionChatCloseButton"
                disabled={busy}
                onActivate={close}
              >
                <XIcon
                  className="SelectionChatCloseGlyph"
                  color={svgColors.mutedForeground}
                  size={14}
                />
              </HeaderButton>
            </view>
          </view>
          <Input
            ref={inputRef}
            nativeInput
            unstyled
            multiline
            maxLines={SELECTION_CHAT_MAX_LINES}
            className="SelectionChatInput"
            // The native field reserves every allowed line; grow it with the text instead, as
            // Electron's editor does, from one line up to the cap.
            style={{ height: `${resolveSelectionChatEditorHeight(prompt)}px` }}
            aria-label="Message for new chat"
            placeholder="Ask about this selection…"
            disabled={busy}
            // Uncontrolled: the field owns its text and reports each edit.
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              "background only";
              if (event.key === "Escape") {
                event.preventDefault?.();
                event.stopPropagation?.();
                close();
                return;
              }
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault?.();
              void submit("send");
            }}
          />
        </view>
        {error ? (
          <text className="SelectionChatError" accessibility-trait="text">
            {error}
          </text>
        ) : null}
        <view className="SelectionChatFooter">
          <SelectionChatEnvironmentPicker
            envMode={envMode}
            canUseWorktree={props.canUseWorktree}
            disabled={busy}
            onEnvModeChange={setEnvMode}
          />
          <view className="SelectionChatSend">
            <ComposerPrimaryActionComposition
              accessibleLabel="Send to new chat"
              mode={busy ? "sending" : "send"}
              disabled={busy || !prompt.trim()}
              onActivate={() => void submit("send")}
            />
          </view>
        </view>
      </view>
    </view>
  );
}
