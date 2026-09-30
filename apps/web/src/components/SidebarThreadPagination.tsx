import { SidebarChatsPaginationElement } from "~/components/SidebarChatsSectionElements";

export function SidebarThreadPagination(props: {
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
  readonly variant?: "section" | "nested" | undefined;
  readonly onShowMore?: (() => void) | undefined;
  readonly onShowLess?: (() => void) | undefined;
}) {
  return (
    <SidebarChatsPaginationElement
      canShowMore={props.canShowMore}
      canShowLess={props.canShowLess}
      variant={props.variant ?? "section"}
      onShowMore={props.onShowMore}
      onShowLess={props.onShowLess}
    />
  );
}
