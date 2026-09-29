import { useEffect, useRef } from "react";

import {
  ComposerCommandMenuComposition,
  type ComposerCommandMenuCompositionProps,
} from "./ComposerCommandMenuComposition";

export { groupCommandItems, type ComposerCommandItem } from "./ComposerCommandMenuComposition";

type ComposerCommandMenuProps = Omit<ComposerCommandMenuCompositionProps, "onItemRef">;

export function ComposerCommandMenu(props: ComposerCommandMenuProps) {
  const itemRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!props.activeItemId) {
      return;
    }
    itemRefs.current[props.activeItemId]?.scrollIntoView({ block: "nearest" });
  }, [props.activeItemId]);

  return (
    <ComposerCommandMenuComposition
      {...props}
      onItemRef={(itemId, node) => {
        itemRefs.current[itemId] = node as HTMLElement | null;
      }}
    />
  );
}
