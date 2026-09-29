import type { ReactNode } from "@lynx-js/react";

import { Button } from "../ui/button.lynx";
import "./composer-choice-row.css";

export type ComposerChoiceTone = "neutral" | "primary" | "destructive";

export function ComposerChoiceRow(props: {
  readonly shortcut: number | null;
  readonly label: string;
  readonly description?: string | null;
  readonly selected?: boolean;
  readonly tone?: ComposerChoiceTone;
  readonly disabled?: boolean;
  readonly trailing?: ReactNode;
  readonly onSelect: () => void;
}) {
  const tone = props.tone ?? "neutral";
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={props.disabled}
      className={`ComposerChoiceRowLynx ComposerChoiceRowLynx--${tone}${
        props.selected ? " ComposerChoiceRowLynx--selected" : ""
      }`}
      aria-label={props.label}
      onClick={props.onSelect}
    >
      {props.shortcut !== null ? (
        <text className="ComposerChoiceShortcutLynx">{props.shortcut}</text>
      ) : null}
      <text className="ComposerChoiceCopyLynx">
        <text className="ComposerChoiceLabelLynx">{props.label}</text>
        {props.description && props.description !== props.label ? (
          <text className="ComposerChoiceDescriptionLynx">
            {"  "}
            {props.description}
          </text>
        ) : null}
      </text>
      {props.trailing}
    </Button>
  );
}
