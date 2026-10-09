// FILE: data/hostSyntaxHighlight.lynx.ts
// Purpose: Syntax highlighting by the Lynxtron host process (Shiki runs there,
//   not in the renderer). Lynx-only: the Web app highlights in the page and the
//   Synara server has no such request, so there is no facade method for it.
// Layer: L1 platform port (Lynx); a host request, never forwarded to the server.

import {
  NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG,
  type NativeSyntaxHighlightThemes,
} from "../main/syntaxHighlightingContract.logic";
import { nativeRpcRequest } from "./nativeRpcBridge";

export function highlightExplorerCode(input: {
  readonly code: string;
  readonly path: string;
}): Promise<NativeSyntaxHighlightThemes | null> {
  "background only";
  return nativeRpcRequest<NativeSyntaxHighlightThemes | null>(
    NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG,
    input,
  );
}
