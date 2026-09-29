import type { ReactNode } from "@lynx-js/react";
import { SidebarProjectSummary } from "@synara-web/components/SidebarProjectSummary";
import { SidebarThreadRowPresentation } from "@synara-web/components/SidebarThreadRowPresentation";
import { ArchiveIcon, FolderIcon, PlusIcon } from "../lib/icons.lynx";
import pinSvg from "@synara-central-icons/pin.svg?raw";
import pinFilledSvg from "@synara-central-icons-fill/pin.svg?raw";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import {
  ProjectPinAction,
  SidebarHoverAction,
  SidebarNavigationRow,
} from "../components/sidebar/Sidebar.lynx";

export type SidebarRowSpecimenState =
  | "default"
  | "hover"
  | "focus"
  | "pressed"
  | "active"
  | "active-hover"
  | "pinned";
const stateClass = (state: SidebarRowSpecimenState) =>
  state === "active-hover"
    ? " ui-hover"
    : state === "hover" || state === "pressed" || state === "focus"
      ? ` ui-${state}`
      : "";

function Actions(props: { readonly children: ReactNode }) {
  return <>{props.children}</>;
}

export function SidebarProjectRowSpecimen(props: {
  readonly state: SidebarRowSpecimenState;
  readonly variant?: "default" | "pinned" | "running";
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => void;
}) {
  const { svgColors } = useTheme();
  const pinned = props.variant === "pinned" || props.state === "pinned";
  const running = props.variant === "running";
  return (
    <view className="ComponentsLabSidebarRowStory">
      <SidebarNavigationRow
        className={`AppSidebarProjectHeader${stateClass(props.state)}`}
        label="Synara"
        onActivate={() => {}}
        onContextMenu={props.onContextMenu}
        actions={
          <Actions>
            <SidebarHoverAction label="New thread" onActivate={() => {}}>
              <PlusIcon
                className="AppSidebarHoverActionIcon"
                color={svgColors.iconSecondary}
                size={13}
              />
            </SidebarHoverAction>
            <SidebarHoverAction label="Archive project" onActivate={() => {}}>
              <ArchiveIcon
                className="AppSidebarHoverActionIcon"
                color={svgColors.iconSecondary}
                size={13}
              />
            </SidebarHoverAction>
          </Actions>
        }
      >
        <ProjectPinAction pinned={pinned} projectName="project" onActivate={() => {}} />
        <SidebarProjectSummary
          leading={<FolderIcon size={16} />}
          leadingClassName={pinned ? "AppSidebarProjectFolder--hidden" : undefined}
          name="Synara"
        />
        {running ? <view className="AppSidebarProjectRunDot" /> : null}
      </SidebarNavigationRow>
    </view>
  );
}

export function SidebarThreadRowSpecimen(props: {
  readonly state: SidebarRowSpecimenState;
  readonly variant?: "active" | "default" | "pinned";
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => void;
}) {
  const { svgColors } = useTheme();
  const active =
    props.variant === "active" || props.state === "active" || props.state === "active-hover";
  const pinned = props.variant === "pinned" || props.state === "pinned";
  return (
    <view className="ComponentsLabSidebarRowStory">
      <SidebarNavigationRow
        className={`AppSidebarThread${active ? " AppSidebarThread--active" : ""}${stateClass(props.state)}`}
        label="Component fidelity"
        onActivate={() => {}}
        onContextMenu={props.onContextMenu}
        actions={
          <Actions>
            <SidebarHoverAction
              label={pinned ? "Unpin thread" : "Pin thread"}
              onActivate={() => {}}
            >
              <svg
                className="AppSidebarHoverActionIcon"
                content={colorizeLynxSvg(pinned ? pinFilledSvg : pinSvg, svgColors.iconSecondary)}
              />
            </SidebarHoverAction>
            <SidebarHoverAction label="Archive thread" onActivate={() => {}}>
              <ArchiveIcon
                className="AppSidebarHoverActionIcon"
                color={svgColors.iconSecondary}
                size={13}
              />
            </SidebarHoverAction>
          </Actions>
        }
      >
        <SidebarThreadRowPresentation active={active} title="Component fidelity" />
      </SidebarNavigationRow>
    </view>
  );
}
