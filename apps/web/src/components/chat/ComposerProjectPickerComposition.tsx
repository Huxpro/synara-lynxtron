import {
  ComposerProjectPickerActionElement,
  ComposerProjectPickerEmptyElement,
  ComposerProjectPickerFooterElement,
  ComposerProjectPickerFrameElement,
  ComposerProjectPickerGroupElement,
  ComposerProjectPickerGroupLabelElement,
  ComposerProjectPickerOptionElement,
  ComposerProjectPickerPanelElement,
} from "~/components/chat/ComposerProjectPickerCompositionElements";
import type {
  ComposerProjectPickerModel,
  ComposerProjectPickerOption,
} from "./ComposerProjectPicker.logic";
import { buildComposerProjectPickerFooterModel } from "./ComposerProjectPicker.logic";

export function ComposerProjectPickerComposition(props: {
  readonly model: ComposerProjectPickerModel;
  readonly open: boolean;
  readonly align?: "start" | "center" | "end";
  readonly side?: "top" | "bottom";
  readonly searchPlaceholder?: string;
  readonly addActionLabel: string;
  readonly resetActionLabel: string;
  readonly retryActionLabel?: string;
  readonly resetVisible?: boolean;
  readonly addActionBusy?: boolean;
  readonly retryActionBusy?: boolean;
  readonly errorMessage?: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelectOption: (option: ComposerProjectPickerOption) => void;
  readonly onAddProject: () => void;
  readonly onReset: () => void;
  readonly onRetry?: () => void;
  readonly triggerClassName?: string;
  readonly triggerTestId?: string;
}) {
  const footerModel = buildComposerProjectPickerFooterModel({
    addActionLabel: props.addActionLabel,
    resetActionLabel: props.resetActionLabel,
    retryVisible: props.onRetry !== undefined,
    ...(props.addActionBusy === undefined ? {} : { addActionBusy: props.addActionBusy }),
    ...(props.resetVisible === undefined ? {} : { resetVisible: props.resetVisible }),
    ...(props.retryActionLabel === undefined ? {} : { retryActionLabel: props.retryActionLabel }),
    ...(props.retryActionBusy === undefined ? {} : { retryActionBusy: props.retryActionBusy }),
    ...(props.errorMessage === undefined ? {} : { errorMessage: props.errorMessage }),
  });
  const activateAction = (kind: "add" | "reset" | "retry") => {
    if (kind === "add") props.onAddProject();
    else if (kind === "reset") props.onReset();
    else props.onRetry?.();
  };
  return (
    <ComposerProjectPickerFrameElement
      open={props.open}
      onOpenChange={props.onOpenChange}
      align={props.align ?? "start"}
      side={props.side ?? "bottom"}
      primaryLabel={props.model.selectedLabel}
      secondaryLabel={props.model.selectedSecondaryLabel}
      triggerLabel={props.model.selectedLabel}
      {...(props.triggerClassName === undefined
        ? {}
        : { triggerClassName: props.triggerClassName })}
      {...(props.triggerTestId === undefined ? {} : { triggerTestId: props.triggerTestId })}
    >
      <ComposerProjectPickerPanelElement
        placeholder={props.searchPlaceholder ?? "Search projects"}
        query={props.model.query}
        onQueryChange={props.onQueryChange}
        footer={
          <ComposerProjectPickerFooterElement errorMessage={footerModel.errorMessage}>
            {footerModel.actions.map((action) => (
              <ComposerProjectPickerActionElement
                key={action.kind}
                kind={action.kind}
                disabled={action.disabled}
                onActivate={() => activateAction(action.kind)}
              >
                {action.label}
              </ComposerProjectPickerActionElement>
            ))}
          </ComposerProjectPickerFooterElement>
        }
      >
        {props.model.groups.map((group, groupIndex) => (
          <ComposerProjectPickerGroupElement key={group.id} separatorBefore={groupIndex > 0}>
            <ComposerProjectPickerGroupLabelElement icon={group.icon}>
              {group.label}
            </ComposerProjectPickerGroupLabelElement>
            {group.options.map((option) => (
              <ComposerProjectPickerOptionElement
                key={option.id}
                primaryLabel={option.primaryLabel}
                secondaryLabel={option.secondaryLabel}
                selected={option.selected}
                onSelect={() => props.onSelectOption(option)}
              />
            ))}
          </ComposerProjectPickerGroupElement>
        ))}
        {props.model.emptyText ? (
          <ComposerProjectPickerEmptyElement>
            {props.model.emptyText}
          </ComposerProjectPickerEmptyElement>
        ) : null}
      </ComposerProjectPickerPanelElement>
    </ComposerProjectPickerFrameElement>
  );
}
