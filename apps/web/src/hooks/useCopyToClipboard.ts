import * as React from "react";

import { toastManager } from "../components/ui/toast";
import { copyTextToClipboard } from "../platform/clipboard";

export { copyTextToClipboard };

export function useCopyToClipboard<TContext = void>({
  timeout = 2000,
  onCopy,
  onError,
}: {
  timeout?: number;
  onCopy?: (ctx: TContext) => void;
  onError?: (error: Error, ctx: TContext) => void;
} = {}): { copyToClipboard: (value: string, ctx: TContext) => void; isCopied: boolean } {
  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCopyRef = React.useRef(onCopy);
  const onErrorRef = React.useRef(onError);
  const timeoutRef = React.useRef(timeout);

  // Mirrored in an effect (not during render) so the hook stays eligible for
  // React Compiler; copyToClipboard only runs from post-commit user events.
  React.useEffect(() => {
    onCopyRef.current = onCopy;
    onErrorRef.current = onError;
    timeoutRef.current = timeout;
  }, [onCopy, onError, timeout]);

  // Manual memoization kept: this file does not compile under React Compiler (see compile-report).
  const copyToClipboard = React.useCallback((value: string, ctx: TContext): void => {
    void copyTextToClipboard(value).then(
      () => {
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }
        setIsCopied(true);

        onCopyRef.current?.(ctx);

        if (timeoutRef.current !== 0) {
          timeoutIdRef.current = setTimeout(() => {
            setIsCopied(false);
            timeoutIdRef.current = null;
          }, timeoutRef.current);
        }
      },
      (error) => {
        if (onErrorRef.current) {
          onErrorRef.current(error, ctx);
        } else {
          console.error(error);
        }
      },
    );
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return (): void => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return { copyToClipboard, isCopied };
}

/**
 * Copy a filesystem path and surface the shared success/error toast. Single source
 * of truth for the "Path copied" affordance used by the sidebar and the kanban board.
 */
export function useCopyPathToClipboard(): (path: string) => void {
  const { copyToClipboard } = useCopyToClipboard<{ path: string }>({
    onCopy: (ctx) =>
      toastManager.add({ type: "success", title: "Path copied", description: ctx.path }),
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Failed to copy path",
        description: error instanceof Error ? error.message : "An error occurred.",
      }),
  });
  return (path: string) => copyToClipboard(path, { path });
}

/** Copy a thread id and surface the shared "Thread ID copied" toast. */
export function useCopyThreadIdToClipboard(): (threadId: string) => void {
  const { copyToClipboard } = useCopyToClipboard<{ threadId: string }>({
    onCopy: (ctx) =>
      toastManager.add({ type: "success", title: "Thread ID copied", description: ctx.threadId }),
    onError: (error) =>
      toastManager.add({
        type: "error",
        title: "Failed to copy thread ID",
        description: error instanceof Error ? error.message : "An error occurred.",
      }),
  });
  return (threadId: string) => copyToClipboard(threadId, { threadId });
}
