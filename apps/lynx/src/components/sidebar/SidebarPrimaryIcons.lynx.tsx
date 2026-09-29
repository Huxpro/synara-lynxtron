import clockSvg from "@synara-central-icons/clock.svg?raw";
import kanbanSvg from "@synara-central-icons/columns-3-wide.svg?raw";
import newThreadSvg from "@synara-central-icons/compose-pencil.svg?raw";
import newWorkspaceSvg from "@synara-central-icons/console.svg?raw";
import searchSvg from "@synara-central-icons/magnifying-glass.svg?raw";

import type { SidebarPrimarySurfaceIcons } from "@synara-web/components/SidebarPrimarySurfaceNavigation";
import { useTheme } from "../../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";

function createSidebarPrimaryIcon(content: string) {
  return function SidebarPrimaryIcon(props: { readonly className?: string }) {
    const { activeTheme } = useTheme();
    return (
      <svg className={props.className} content={colorizeLynxSvg(content, activeTheme.theme.ink)} />
    );
  };
}

export const LYNX_SIDEBAR_PRIMARY_ICONS: SidebarPrimarySurfaceIcons = {
  automations: createSidebarPrimaryIcon(clockSvg),
  kanban: createSidebarPrimaryIcon(kanbanSvg),
  newThread: createSidebarPrimaryIcon(newThreadSvg),
  newWorkspace: createSidebarPrimaryIcon(newWorkspaceSvg),
  search: createSidebarPrimaryIcon(searchSvg),
};
