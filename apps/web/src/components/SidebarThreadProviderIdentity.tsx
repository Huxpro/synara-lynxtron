import { isGenericChatThreadTitle } from "@synara/shared/chatThreads";

import {
  SidebarThreadProviderIdentityContainerElement,
  SidebarThreadProviderIdentityIconElement,
} from "~/components/SidebarThreadProviderIdentityElements";

export function SidebarThreadProviderIdentity({
  provider,
  handoffSourceProvider,
}: {
  readonly provider: string | null | undefined;
  readonly handoffSourceProvider?: string | null | undefined;
}) {
  if (!provider) return null;
  const hasHandoff = Boolean(handoffSourceProvider);
  return (
    <SidebarThreadProviderIdentityContainerElement handoff={hasHandoff}>
      {handoffSourceProvider ? (
        <>
          <SidebarThreadProviderIdentityIconElement
            provider={handoffSourceProvider}
            placement="source"
          />
          <SidebarThreadProviderIdentityIconElement provider={provider} placement="target" />
        </>
      ) : (
        <SidebarThreadProviderIdentityIconElement provider={provider} placement="single" />
      )}
    </SidebarThreadProviderIdentityContainerElement>
  );
}

export function shouldShowSidebarThreadProviderIdentity(title: string): boolean {
  return !isGenericChatThreadTitle(title);
}
