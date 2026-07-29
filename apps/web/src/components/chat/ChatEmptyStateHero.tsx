// FILE: ChatEmptyStateHero.tsx
// Purpose: Render the centered empty-state hero for blank transcripts.
// Layer: Chat presentation
// Depends on: the caller-supplied project display name.

import {
  ChatEmptyStateHeroFrameElement,
  ChatEmptyStateHeroHeadingElement,
  ChatEmptyStateHeroLogoElement,
  ChatEmptyStateHeroProjectElement,
  ChatEmptyStateHeroTextFrameElement,
} from "~/components/chat/ChatEmptyStateHeroElements";

export const ChatEmptyStateHero = function ChatEmptyStateHero({
  projectName,
}: {
  projectName: string | undefined;
}) {
  return (
    <ChatEmptyStateHeroFrameElement>
      <ChatEmptyStateHeroLogoElement />
      <ChatEmptyStateHeroTextFrameElement>
        <ChatEmptyStateHeroHeadingElement>Let's build</ChatEmptyStateHeroHeadingElement>
        {projectName ? (
          <ChatEmptyStateHeroProjectElement>{projectName}</ChatEmptyStateHeroProjectElement>
        ) : null}
      </ChatEmptyStateHeroTextFrameElement>
    </ChatEmptyStateHeroFrameElement>
  );
};
