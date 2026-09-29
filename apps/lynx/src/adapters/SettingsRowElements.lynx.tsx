import type { ReactNode } from "react";

import { SettingsHeadingElement } from "./SettingsHeadingElement.lynx";
import "./settings-row-elements.css";

type ElementProps = {
  readonly className?: string;
  readonly children?: ReactNode;
};

function classes(platformClassName: string, className?: string) {
  return className ? `${platformClassName} ${className}` : platformClassName;
}

export function SettingsRowRootElement({
  id,
  className: _className,
  children,
}: ElementProps & { readonly id?: string }) {
  const isFirstRow =
    id === "setting-assistant-output" ||
    id === "setting-delete-confirmation" ||
    id === "setting-activity-toasts";
  return (
    <view id={id} className={`SharedSettingsRow${isFirstRow ? " SharedSettingsRow--first" : ""}`}>
      {children}
    </view>
  );
}

export function SettingsRowLayoutElement({
  className: _className,
  children,
  onClick,
}: ElementProps & { readonly onClick?: () => void }) {
  return (
    <view className="SharedSettingsRowLayout" bindtap={onClick}>
      {children}
    </view>
  );
}

export function SettingsRowViewElement({ className, children }: ElementProps) {
  const roleClassName = className?.includes("space-y-0.5")
    ? "SharedSettingsRowCopy"
    : className?.includes("min-h-5")
      ? "SharedSettingsRowTitleLine"
      : className?.includes("text-[11px]")
        ? "SharedSettingsRowStatus"
        : className?.includes("sm:justify-end")
          ? "SharedSettingsRowControl"
          : "SharedSettingsRowView";
  return (
    <view
      className={
        roleClassName === "SharedSettingsRowView"
          ? classes(roleClassName, className)
          : roleClassName
      }
    >
      {roleClassName === "SharedSettingsRowStatus" ? (
        <text className="SharedSettingsRowStatusText">{children}</text>
      ) : (
        children
      )}
    </view>
  );
}

export function SettingsRowTitleElement({ className, children }: ElementProps) {
  return (
    <SettingsHeadingElement className={classes("SharedSettingsRowTitle", className)}>
      {children}
    </SettingsHeadingElement>
  );
}

export function SettingsRowDescriptionElement({ className, children }: ElementProps) {
  return <text className={classes("SharedSettingsRowDescription", className)}>{children}</text>;
}

export function SettingsRowInlineElement({ className: _className, children }: ElementProps) {
  return <view className="SharedSettingsRowInline">{children}</view>;
}
