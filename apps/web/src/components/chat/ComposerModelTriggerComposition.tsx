import {
  ComposerModelTriggerChevronElement,
  ComposerModelTriggerFastBadgeElement,
  ComposerModelTriggerFrameElement,
  ComposerModelTriggerModelLabelElement,
  ComposerModelTriggerProviderIconElement,
  ComposerModelTriggerStatusIconElement,
  ComposerModelTriggerStatusLabelElement,
} from "~/components/chat/ComposerModelTriggerCompositionElements";

export function ComposerModelTriggerComposition(props: {
  readonly provider: string;
  readonly modelLabel: string;
  readonly statusLabel: string | null;
  readonly showFastBadge: boolean;
  readonly hideModelLabel: boolean;
  readonly hideStatusLabel: boolean;
}) {
  return (
    <ComposerModelTriggerFrameElement>
      <ComposerModelTriggerProviderIconElement provider={props.provider} />
      <ComposerModelTriggerModelLabelElement
        hidden={props.hideModelLabel}
        modelLabel={props.modelLabel}
      />
      {props.showFastBadge ? <ComposerModelTriggerFastBadgeElement /> : null}
      {props.statusLabel ? (
        props.hideStatusLabel ? (
          <ComposerModelTriggerStatusIconElement accessibleLabel={props.statusLabel} />
        ) : (
          <ComposerModelTriggerStatusLabelElement>
            {props.statusLabel}
          </ComposerModelTriggerStatusLabelElement>
        )
      ) : null}
      <ComposerModelTriggerChevronElement />
    </ComposerModelTriggerFrameElement>
  );
}
