// Element attributes the Lynx runtimes accept but @lynx-js/types (4.1.0) does
// not declare. Keep every entry justified by a runtime; never add an attribute
// here just to silence a type error. Note that `<text maxlines>` is NOT such a
// case: `<text>` only honors `text-maxline` (maxlines is `<textarea>`-only).

import type { StandardProps } from "@lynx-js/types";

type LynxAccessibilityTrait = NonNullable<StandardProps["accessibility-traits"]>;

declare module "@lynx-js/types" {
  interface StandardProps {
    /**
     * The spelling the Lynx docs and engine use
     * (https://lynxjs.org/guide/inclusion/accessibility); the shipped typings
     * only declare the plural `accessibility-traits`.
     */
    "accessibility-trait"?: LynxAccessibilityTrait;

    /**
     * Web-only semantics. Lynx for Web renders elements as DOM custom elements
     * and forwards attributes verbatim, so the browser honors ARIA roles/states
     * and tab order; Lynxtron native ignores them.
     */
    role?: string;
    tabindex?: number | string;
    [ariaAttribute: `aria-${string}`]: string | number | boolean | undefined;

    /**
     * Synara annotations, NOT Lynx attributes: no Lynx runtime reads them
     * (Web renders them as inert DOM attributes). Shared primitives carry them
     * as the intended native state/role; the effective semantics come from
     * `accessibility-trait`/`accessibility-value` and the `aria-*` twins.
     */
    "accessibility-role"?: string;
    "accessibility-state"?: {
      readonly checked?: boolean;
      readonly disabled?: boolean;
      readonly expanded?: boolean;
      readonly selected?: boolean;
    };
  }
}
