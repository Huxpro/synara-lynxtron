import { EDITORS, type EditorId } from "@synara/contracts";

export const LAST_EDITOR_STORAGE_KEY = "synara:last-editor";

export interface EnvironmentEditorOption {
  readonly label: string;
  readonly value: EditorId;
}

export function environmentEditorOptions(
  availableEditors: readonly EditorId[],
): readonly EnvironmentEditorOption[] {
  const available = new Set(availableEditors);
  return EDITORS.filter((editor) => available.has(editor.id)).map((editor) => ({
    label: editor.label,
    value: editor.id,
  }));
}

export function resolveEnvironmentEditor(
  options: readonly EnvironmentEditorOption[],
  storedEditor: string | null,
): EditorId | null {
  return (
    options.find((option) => option.value === storedEditor)?.value ?? options[0]?.value ?? null
  );
}
