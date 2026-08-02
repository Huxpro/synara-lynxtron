import type { ReactNode } from "react";

import {
  ComposerTraitFastModeToggleElement,
  ComposerTraitRadioGroupElement,
  ComposerTraitRadioItemElement,
  ComposerTraitSectionElement,
} from "~/components/chat/ComposerTraitRadioSectionCompositionElements";

export interface ComposerTraitRadioOption {
  readonly value: string;
  readonly label: string;
  readonly isDefault?: boolean;
  readonly description?: string | null;
}

export function ComposerTraitRadioSectionComposition(props: {
  readonly label: string;
  readonly fastModeControl?: {
    readonly enabled: boolean;
    readonly onToggle: () => void;
  };
  readonly note?: ReactNode;
  readonly value: string;
  readonly options: ReadonlyArray<ComposerTraitRadioOption>;
  readonly disabled?: boolean;
  readonly onValueChange: (value: string) => void;
  readonly onSelectionComplete?: () => void;
}) {
  return (
    <ComposerTraitSectionElement
      label={props.label}
      labelTrailing={
        props.fastModeControl ? (
          <ComposerTraitFastModeToggleElement
            enabled={props.fastModeControl.enabled}
            onToggle={props.fastModeControl.onToggle}
          />
        ) : undefined
      }
      note={props.note}
    >
      <ComposerTraitRadioGroupElement value={props.value}>
        {props.options.map((option) => (
          <ComposerTraitRadioItemElement
            key={option.value}
            active={props.value === option.value}
            description={option.description}
            disabled={props.disabled ?? false}
            isDefault={option.isDefault ?? false}
            label={option.label}
            value={option.value}
            onSelect={() => props.onValueChange(option.value)}
            onSelectionComplete={props.onSelectionComplete}
          />
        ))}
      </ComposerTraitRadioGroupElement>
    </ComposerTraitSectionElement>
  );
}
