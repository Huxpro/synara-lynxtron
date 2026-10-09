import type { ReactNode } from "react";

import {
  SidebarThreadTrailingGroup,
  SidebarThreadTrailingRoot,
  SidebarThreadTrailingStatus,
} from "~/components/SidebarThreadTrailingClusterElements";
import {
  SidebarThreadStatusIndicator,
  type SidebarThreadStatusPresentation,
} from "~/components/SidebarThreadStatusIndicator";
import { Kbd, KbdGroup } from "~/components/ui/kbd";

export function SidebarThreadTrailingCluster({
  className,
  fadeClassName,
  statusClassName,
  metaContent,
  shortcutParts = [],
  status,
  hoverActions,
}: {
  readonly className?: string | undefined;
  readonly fadeClassName?: string | undefined;
  readonly statusClassName?: string | undefined;
  readonly metaContent?: ReactNode | undefined;
  readonly shortcutParts?: readonly string[] | undefined;
  readonly status?: SidebarThreadStatusPresentation | null | undefined;
  readonly hoverActions?: ReactNode | undefined;
}) {
  const hasShortcut = shortcutParts.length > 0;

  return (
    <SidebarThreadTrailingRoot className={className}>
      {metaContent ? (
        <SidebarThreadTrailingGroup className={fadeClassName}>
          {metaContent}
        </SidebarThreadTrailingGroup>
      ) : null}
      {hasShortcut ? (
        <KbdGroup className={fadeClassName}>
          {shortcutParts.map((part) => (
            <Kbd key={part}>{part}</Kbd>
          ))}
        </KbdGroup>
      ) : null}
      {!hasShortcut && status ? (
        <SidebarThreadTrailingStatus className={statusClassName}>
          <SidebarThreadStatusIndicator status={status} />
        </SidebarThreadTrailingStatus>
      ) : null}
      {hoverActions}
    </SidebarThreadTrailingRoot>
  );
}
