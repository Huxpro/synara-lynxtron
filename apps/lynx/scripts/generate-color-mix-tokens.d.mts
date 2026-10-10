// Types for generate-color-mix-tokens.mjs (build-time script, consumed by typed tests).

import type { ColorMixBuildInput, ColorMixBuildResult } from "./color-mix.logic.mjs";

export const COLOR_MIX_OUTPUT: string;
export const COLOR_MIX_RUNTIME_OUTPUT: string;
export const COLOR_MIX_SHARED_TOKENS: string;
export function colorMixRuntimeText(result: ColorMixBuildResult, root?: string): string;
export function collectColorMixInputs(root?: string): ColorMixBuildInput & {
  readonly themePath: string;
};
