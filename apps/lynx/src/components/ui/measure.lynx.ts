export interface LynxElementRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Window rectangles of the elements with these ids, in order; `null` for one
 * that is not mounted. Lynx has no synchronous layout read on the background
 * thread: the answer arrives a frame later.
 */
export function measureLynxElementsById(
  ids: readonly string[],
): Promise<(LynxElementRect | null)[]> {
  "background only";
  return Promise.all(
    ids.map(
      (id) =>
        new Promise<LynxElementRect | null>((resolve) => {
          if (!id.trim()) {
            resolve(null);
            return;
          }
          try {
            lynx
              .createSelectorQuery()
              .select(`#${id}`)
              .invoke({
                method: "boundingClientRect",
                success: (rect: Partial<LynxElementRect> | null | undefined) => {
                  resolve(
                    typeof rect?.left === "number" &&
                      typeof rect.top === "number" &&
                      typeof rect.width === "number" &&
                      typeof rect.height === "number"
                      ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
                      : null,
                  );
                },
                fail: () => resolve(null),
              })
              .exec();
          } catch {
            resolve(null);
          }
        }),
    ),
  );
}
