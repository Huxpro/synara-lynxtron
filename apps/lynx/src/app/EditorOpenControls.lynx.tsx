import { EDITED_FILE_EDITOR_ORDER } from "../generated/transcriptCardActions.generated";
import { useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { serverConfigQueryOptions } from "@synara-web/lib/serverReactQuery";
import type { EditorId } from "@synara/contracts";
import { useTheme } from "../adapters/useTheme.lynx";
import { ChevronDownIcon, DeviceLaptopIcon } from "../lib/icons.lynx";
import { Button } from "../components/ui/button.lynx";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { ensureNativeApi } from "~/nativeApi";
import { fetchEditorIconUrl } from "./queries";
import { webStorage } from "../platform/storage";
import { clipboard } from "../platform/clipboard";
import {
  environmentEditorOptions,
  LAST_EDITOR_STORAGE_KEY,
  resolveEnvironmentEditor,
} from "./environmentEditor.logic";
export function EditorOpenControls(props: {
  readonly openTarget: string | null;
  readonly compact?: boolean;
  readonly relativePath?: string;
  readonly filePath?: string;
  readonly absolutePath?: string | null;
}) {
  const { svgColors } = useTheme();
  const [editorIconFailed, setEditorIconFailed] = useState(false);
  const config = useQuery(serverConfigQueryOptions());
  const editorOptions = environmentEditorOptions(config.data?.availableEditors ?? []);
  const [preferredEditor, setPreferredEditor] = useState<EditorId | null>(() =>
    resolveEnvironmentEditor(editorOptions, webStorage.getItem(LAST_EDITOR_STORAGE_KEY)),
  );
  const resolvedEditor = resolveEnvironmentEditor(
    editorOptions,
    preferredEditor ?? webStorage.getItem(LAST_EDITOR_STORAGE_KEY),
  );
  const editorIcon = useQuery({
    queryKey: ["editor-icon", resolvedEditor],
    queryFn: () => {
      "background only";
      return fetchEditorIconUrl(resolvedEditor!);
    },
    enabled: Boolean(resolvedEditor),
    staleTime: Number.POSITIVE_INFINITY,
  });
  const displayedEditorOptions = props.compact
    ? [
        ...EDITED_FILE_EDITOR_ORDER.flatMap((id) =>
          editorOptions.filter((option) => option.value === id),
        ),
        ...editorOptions.filter(
          (option) => !EDITED_FILE_EDITOR_ORDER.includes(option.value as never),
        ),
      ]
    : editorOptions;
  const copyAbsolutePath = props.absolutePath ?? props.openTarget;
  const editorIconUrl = editorIconFailed ? null : editorIcon.data;
  const openEditor = async (editor: EditorId) => {
    "background only";
    if (!props.openTarget) return;
    await ensureNativeApi().shell.openInEditor(props.openTarget, editor);
    setPreferredEditor(editor);
    webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor);
  };
  return (
    <view className={`ExplorerDockOpenGroup${props.compact ? " TranscriptFileOpenGroup" : ""}`}>
      <Button
        aria-label={
          props.compact ? `Open ${props.filePath ?? props.relativePath}` : "Open in editor"
        }
        className="ExplorerDockOpenButton"
        size="xs"
        variant={props.compact ? "ghost" : "chrome-outline"}
        disabled={!resolvedEditor || !props.openTarget}
        onClick={() => resolvedEditor && void openEditor(resolvedEditor)}
      >
        {editorIconUrl ? (
          <image
            className="ExplorerDockEditorIcon"
            src={editorIconUrl}
            mode="aspectFit"
            binderror={() => setEditorIconFailed(true)}
          />
        ) : (
          <DeviceLaptopIcon color={svgColors.foreground} size={14} />
        )}
        {!props.compact ? <text className="LxButton__text">Open</text> : null}
      </Button>
      <Menu>
        <MenuTrigger
          ariaLabel={
            props.compact
              ? `Open ${props.filePath ?? props.relativePath} options`
              : "Editor options"
          }
          className="ExplorerDockOpenMenuTrigger"
        >
          <ChevronDownIcon color={svgColors.foreground} size={14} />
        </MenuTrigger>
        <MenuPopup align="end" side="bottom" className="ExplorerDockOpenPopup">
          {editorOptions.length === 0 ? (
            <MenuItem disabled>No installed editors found</MenuItem>
          ) : (
            <MenuRadioGroup
              value={resolvedEditor ?? ""}
              onValueChange={(value) => void openEditor(value as EditorId)}
            >
              {displayedEditorOptions.map((option) => (
                <MenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          )}
          {props.relativePath ? (
            <MenuItem
              onClick={() => {
                "background only";
                void clipboard.writeText(props.relativePath!);
              }}
            >
              Copy relative path
            </MenuItem>
          ) : null}
          {props.relativePath && copyAbsolutePath ? (
            <MenuItem
              onClick={() => {
                "background only";
                void clipboard.writeText(copyAbsolutePath!);
              }}
            >
              Copy absolute path
            </MenuItem>
          ) : null}
        </MenuPopup>
      </Menu>
    </view>
  );
}
