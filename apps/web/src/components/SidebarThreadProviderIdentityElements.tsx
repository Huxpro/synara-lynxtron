import type { ReactNode } from "react";

import type { ProviderKind } from "@synara/contracts";

import { ProviderIcon } from "./ProviderIcon";

export function SidebarThreadProviderIdentityContainerElement({
  handoff,
  children,
}: {
  readonly handoff: boolean;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <span
      className={
        handoff
          ? "relative inline-flex h-3 w-[18px] shrink-0 items-center"
          : "relative inline-flex size-3 shrink-0 items-center justify-center"
      }
    >
      {children}
    </span>
  );
}

export function SidebarThreadProviderIdentityIconElement({
  provider,
  placement,
}: {
  readonly provider: string;
  readonly placement: "single" | "source" | "target";
}) {
  if (placement === "single") {
    return <ProviderIcon provider={provider as ProviderKind} className="size-3" />;
  }
  return (
    <span
      className={
        placement === "source"
          ? "sidebar-icon-chip absolute left-0 top-1/2 inline-flex size-3 -translate-y-1/2 items-center justify-center rounded-full"
          : "sidebar-icon-chip absolute right-0 top-1/2 z-10 inline-flex size-3 -translate-y-1/2 items-center justify-center rounded-full"
      }
    >
      <ProviderIcon provider={provider as ProviderKind} className="size-2" />
    </span>
  );
}
