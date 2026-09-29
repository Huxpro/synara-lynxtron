import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").filter(Boolean).at(-1) ?? path;
}

export function ExplorerFileTab(props: {
  readonly path: string;
  readonly onClose: () => void;
  readonly visualState?: "default" | "hover" | "focus" | "pressed";
}) {
  return (
    <EditorSurfaceTab
      active
      className="ExplorerDockFileTab"
      closeLabel={`Close ${fileName(props.path)}`}
      icon={<FileEntryIcon pathValue={props.path} />}
      label={fileName(props.path)}
      labelClassName="ExplorerDockTitle"
      onClose={props.onClose}
      visualState={props.visualState}
    />
  );
}
