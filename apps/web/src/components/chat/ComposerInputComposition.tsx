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
  readonly children?: ReactNode;
  readonly focused?: boolean;
  readonly overflowVisible?: boolean;
  readonly providerFrameClassName?: string;
  readonly providerSurfaceClassName?: string;
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
  readonly children?: ReactNode;
  readonly overflowVisible?: boolean;
}) {
  return (
    <ComposerEditorRegionElement overflowVisible={props.overflowVisible ?? false}>
      {props.children}
    </ComposerEditorRegionElement>
  );
}

export function ComposerFooterRowComposition(props: {
  readonly children?: ReactNode;
  readonly compact?: boolean;
}) {
  return (
    <ComposerFooterRowElement compact={props.compact ?? false}>
      {props.children}
    </ComposerFooterRowElement>
  );
}

export function ComposerFooterContentComposition(props: {
  readonly actions?: ReactNode;
  readonly compact?: boolean;
  readonly leading?: ReactNode;
  readonly voiceBusy?: boolean;
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
        <ComposerFooterActionsElement voiceBusy={props.voiceBusy ?? false}>
          {props.actions}
        </ComposerFooterActionsElement>
      ) : null}
    </>
  );
}

export type ComposerPrimaryActionMode = "send" | "sending" | "stop";

export function ComposerPrimaryActionComposition(props: {
  readonly accessibleLabel?: string;
  readonly disabled?: boolean;
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
