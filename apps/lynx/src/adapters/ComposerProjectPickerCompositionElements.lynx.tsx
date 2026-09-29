import folderSvg from "@synara-central-icons/folder-2.svg?raw";
import type { SpaceIconName } from "@synara/contracts";
import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef, type ReactNode } from "@lynx-js/react";

import {
  BackpackIcon,
  BookIcon,
  BriefcaseIcon,
  BlocksIcon,
  BrainIcon,
  CameraIcon,
  ChartIcon,
  CheckIcon,
  CloudIcon,
  CodeIcon,
  DeviceLaptopIcon,
  FlaskIcon,
  FolderIcon,
  GameControllerIcon,
  GlobeIcon,
  HammerIcon,
  HeartIcon,
  HomeIcon,
  LightBulbIcon,
  PaletteIcon,
  PlusIcon,
  RefreshCwIcon,
  RocketIcon,
  SchoolIcon,
  StarIcon,
  TargetIcon,
  TreeIcon,
  XIcon,
} from "../lib/icons.lynx";
import { Input } from "../components/ui/input.lynx";
import { MenuItem, Menu, MenuPopupBase, MenuTrigger } from "../components/ui/menu.lynx";
import { useLynxInteractiveState } from "../components/ui/interactive-state.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";

function ComposerProjectPickerTriggerElement(props: {
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly className?: string;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="ComposerProjectPickerTriggerContentLynx">
      <svg
        className="ComposerProjectPickerTriggerIconLynx"
        content={colorizeLynxSvg(folderSvg, semanticIconColor("secondary"))}
      />
      <view className="ComposerProjectPickerTriggerCopyLynx">
        <text className="ComposerProjectPickerTriggerLabelLynx">{props.primaryLabel}</text>
        {props.secondaryLabel ? (
          <text className="ComposerProjectPickerTriggerSecondaryLynx">{props.secondaryLabel}</text>
        ) : null}
      </view>
    </view>
  );
}

export function ComposerProjectPickerFrameElement(props: {
  readonly children?: ReactNode;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly align: "start" | "center" | "end";
  readonly side: "top" | "bottom";
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly triggerClassName?: string;
  readonly triggerLabel: string;
  readonly triggerTestId?: string;
}) {
  return (
    <Menu open={props.open} onOpenChange={props.onOpenChange}>
      <MenuTrigger
        className={`LandingComposerProjectTrigger ComposerProjectPickerTriggerLynx${
          props.open ? " ComposerProjectPickerTriggerLynx--open" : ""
        }`}
        ariaLabel={props.triggerLabel}
      >
        <ComposerProjectPickerTriggerElement
          primaryLabel={props.primaryLabel}
          secondaryLabel={props.secondaryLabel}
          className={props.triggerClassName}
        />
      </MenuTrigger>
      <MenuPopupBase
        className="ComposerProjectPickerPopupLynx"
        side={props.side}
        align={props.align}
        sideOffset={3}
      >
        {props.children}
      </MenuPopupBase>
    </Menu>
  );
}

export function ComposerProjectPickerPanelElement(props: {
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly placeholder: string;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    "background only";
    const input = inputRef.current;
    if (!input) return;
    void input
      .focus()
      .then(() => input.setSelectionRange(0, props.query.length))
      .catch(() => undefined);
  }, []);
  return (
    <view className="ComposerProjectPickerPanelLynx">
      <view className="ComposerProjectPickerSearchLynx">
        <Input
          ref={inputRef}
          type="search"
          size="sm"
          value={props.query}
          placeholder={props.placeholder}
          aria-label={props.placeholder}
          onChange={(event) => props.onQueryChange(event.target.value)}
        />
      </view>
      <scroll-view className="ComposerProjectPickerListLynx" scroll-orientation="vertical">
        {props.children}
      </scroll-view>
      {props.footer ? (
        <view className="ComposerProjectPickerFooterLynx">{props.footer}</view>
      ) : null}
    </view>
  );
}

export function ComposerProjectPickerGroupElement(props: {
  readonly children?: ReactNode;
  readonly separatorBefore: boolean;
}) {
  return (
    <view className="ComposerProjectPickerGroupLynx">
      {props.separatorBefore ? <view className="ComposerProjectPickerSeparatorLynx" /> : null}
      {props.children}
    </view>
  );
}

export function ComposerProjectPickerGroupLabelElement(props: {
  readonly children?: ReactNode;
  readonly icon: SpaceIconName | "black-hole";
}) {
  const { svgColors } = useTheme();
  return (
    <view className="ComposerProjectPickerGroupLabelLynx">
      <LynxSpaceIcon
        className="ComposerProjectPickerSpaceIconLynx"
        color={svgColors.mutedForeground}
        icon={props.icon}
        size={12}
      />
      <text className="ComposerProjectPickerGroupLabelTextLynx">{props.children}</text>
    </view>
  );
}

export function LynxSpaceIcon(props: {
  readonly className?: string;
  readonly color?: string;
  readonly icon: SpaceIconName | "black-hole";
  readonly size?: number;
}) {
  const icons = {
    "black-hole": BlocksIcon,
    bag: BriefcaseIcon,
    home: HomeIcon,
    "code-brackets": CodeIcon,
    rocket: RocketIcon,
    "light-bulb": LightBulbIcon,
    "color-palette": PaletteIcon,
    book: BookIcon,
    lab: FlaskIcon,
    heart: HeartIcon,
    star: StarIcon,
    globe: GlobeIcon,
    cloud: CloudIcon,
    hammer: HammerIcon,
    "chart-2": ChartIcon,
    gamecontroller: GameControllerIcon,
    "camera-1": CameraIcon,
    target: TargetIcon,
    tree: TreeIcon,
    school: SchoolIcon,
    backpack: BackpackIcon,
  } as const;
  const Icon = icons[props.icon] ?? FolderIcon;
  return <Icon className={props.className} color={props.color} size={props.size ?? 12} />;
}

export function ComposerProjectPickerOptionElement(props: {
  readonly primaryLabel: string;
  readonly secondaryLabel: string | null;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  const { svgColors } = useTheme();
  return (
    <MenuItem
      className={`ComposerProjectPickerOptionLynx${
        props.selected ? " ComposerProjectPickerOptionLynx--selected" : ""
      }`}
      onClick={props.onSelect}
    >
      <view className="ComposerProjectPickerOptionContentLynx">
        <FolderIcon
          className="ComposerProjectPickerOptionIconLynx"
          color={svgColors.mutedForeground}
          size={14}
        />
        <view className="ComposerProjectPickerOptionCopyLynx">
          <text className="ComposerProjectPickerOptionTitleLynx">{props.primaryLabel}</text>
          {props.secondaryLabel ? (
            <text className="ComposerProjectPickerOptionSecondaryLynx">{props.secondaryLabel}</text>
          ) : null}
        </view>
        <view className="ComposerProjectPickerCheckLynx">
          {props.selected ? <CheckIcon size={12} /> : null}
        </view>
      </view>
    </MenuItem>
  );
}

export function ComposerProjectPickerEmptyElement(props: { readonly children?: ReactNode }) {
  return (
    <view className="ComposerProjectPickerEmptyLynx">
      <text className="ComposerProjectPickerEmptyTextLynx">{props.children}</text>
    </view>
  );
}

export function ComposerProjectPickerFooterElement(props: {
  readonly children?: ReactNode;
  readonly errorMessage: string | null;
}) {
  return (
    <>
      {props.children}
      {props.errorMessage ? (
        <text className="ComposerProjectPickerErrorLynx">{props.errorMessage}</text>
      ) : null}
    </>
  );
}

export function ComposerProjectPickerActionElement(props: {
  readonly children?: ReactNode;
  readonly kind: "add" | "reset" | "retry";
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "ComposerProjectPickerActionLynx",
    accessibleLabel: typeof props.children === "string" ? props.children : undefined,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  const Icon = props.kind === "add" ? PlusIcon : props.kind === "reset" ? XIcon : RefreshCwIcon;
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <Icon
        className="ComposerProjectPickerActionIconLynx"
        color={svgColors.mutedForeground}
        size={14}
      />
      <text className="ComposerProjectPickerActionTextLynx">{props.children}</text>
    </view>
  );
}
