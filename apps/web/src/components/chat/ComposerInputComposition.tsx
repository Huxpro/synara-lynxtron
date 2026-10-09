// FILE: ComposerInputComposition.tsx
// Purpose: Physical shared source for composer shell/editor/footer anatomy.
// Platform Elements own host tags; this file owns wrapper nesting and region order.

import type { ReactNode } from "react";

import {
  ComposerEditorRegionElement,
  ComposerFooterActionsElement,
  ComposerFooterLeadingElement,
  ComposerFooterRowElement,
  ComposerInputShellElement,
  ComposerInputSurfaceElement,
  ComposerPrimaryActionElement,
} from "~/components/chat/ComposerInputCompositionElements";

export function ComposerInputSurfaceComposition(props: {
  readonly children?: ReactNode | undefined;
  readonly focused?: boolean | undefined;
  readonly overflowVisible?: boolean | undefined;
  readonly providerFrameClassName?: string | undefined;
  readonly providerSurfaceClassName?: string | undefined;
}) {
  return (
    <ComposerInputShellElement
      focused={props.focused ?? false}
      overflowVisible={props.overflowVisible ?? false}
      providerClassName={props.providerFrameClassName}
    >
      <ComposerInputSurfaceElement
        focused={props.focused ?? false}
        overflowVisible={props.overflowVisible ?? false}
        providerClassName={props.providerSurfaceClassName}
      >
        {props.children}
      </ComposerInputSurfaceElement>
    </ComposerInputShellElement>
  );
}

export function ComposerEditorRegionComposition(props: {
  readonly children?: ReactNode | undefined;
  readonly overflowVisible?: boolean | undefined;
}) {
  return (
    <ComposerEditorRegionElement overflowVisible={props.overflowVisible ?? false}>
      {props.children}
    </ComposerEditorRegionElement>
  );
}

export function ComposerFooterRowComposition(props: {
  readonly children?: ReactNode | undefined;
  readonly compact?: boolean | undefined;
}) {
  return (
    <ComposerFooterRowElement compact={props.compact ?? false}>
      {props.children}
    </ComposerFooterRowElement>
  );
}

export function ComposerFooterContentComposition(props: {
  readonly actions?: ReactNode | undefined;
  readonly compact?: boolean | undefined;
  readonly leading?: ReactNode | undefined;
  readonly voiceBusy?: boolean | undefined;
}) {
  const leadingVisible = props.leading !== null && props.leading !== undefined;
  const actionsVisible = props.actions !== null && props.actions !== undefined;

  return (
    <>
      {leadingVisible ? (
        <ComposerFooterLeadingElement
          compact={props.compact ?? false}
          voiceBusy={props.voiceBusy ?? false}
        >
          {props.leading}
        </ComposerFooterLeadingElement>
      ) : null}
      {actionsVisible ? (
        <ComposerFooterActionsElement
          compact={props.compact ?? false}
          voiceBusy={props.voiceBusy ?? false}
        >
          {props.actions}
        </ComposerFooterActionsElement>
      ) : null}
    </>
  );
}

export type ComposerPrimaryActionMode = "send" | "sending" | "stop";

export function ComposerPrimaryActionComposition(props: {
  readonly accessibleLabel?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly mode: ComposerPrimaryActionMode;
  readonly onActivate: () => void;
}) {
  return (
    <ComposerPrimaryActionElement
      accessibleLabel={props.accessibleLabel}
      disabled={props.disabled ?? false}
      mode={props.mode}
      onActivate={props.onActivate}
    />
  );
}
