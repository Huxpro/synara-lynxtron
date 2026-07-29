import type { CSSProperties, ReactNode } from "react";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarThreadSubagentConnectorElement({
  indentPx,
  accentColor,
}: {
  readonly indentPx: number;
  readonly accentColor: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-3.5 w-[18px] shrink-0 items-center"
      style={{ marginLeft: `${indentPx}px` }}
    >
      <span className="absolute left-1.5 top-0 bottom-0 w-px rounded-full bg-border/35" />
      <span className="absolute left-1.5 top-1/2 h-px w-2.5 -translate-y-1/2 bg-border/35" />
      <span
        className="absolute left-1.5 top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
    </span>
  );
}

export function SidebarThreadSubagentCopyElement({ children }: ChildrenProps) {
  return <span className="min-w-0 truncate">{children}</span>;
}

export function SidebarThreadSubagentPrimaryElement({
  accentColor,
  children,
}: ChildrenProps & { readonly accentColor: string }) {
  return (
    <span className="font-medium" style={{ color: accentColor } satisfies CSSProperties}>
      {children}
    </span>
  );
}

export function SidebarThreadSubagentSupportingElement({
  className,
  children,
}: ChildrenProps & { readonly className?: string | undefined }) {
  return <span className={className}>{children}</span>;
}
