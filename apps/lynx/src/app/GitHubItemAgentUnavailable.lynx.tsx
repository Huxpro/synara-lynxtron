// FILE: GitHubItemAgentUnavailable.lynx.tsx
// Purpose: Where upstream's Code review detail offers "Send to agent" and the Ask side chat
//   (GitHubItemAgentActions, GitHubItemFloatingComposer, GitHubInboxSidechatDock), the
//   Native app shows the same two actions disabled and says why. Their backing (thread
//   start with an item context card, the route's side chat dock) is not ported.

import { Button } from "../components/ui/button";

export const GITHUB_ITEM_AGENT_UNAVAILABLE_COPY =
  "Send to agent and Ask are not available in the Native app yet.";

export function GitHubItemAgentUnavailable(props: { readonly noun: "pull request" | "issue" }) {
  return (
    <view className="GitHubInboxAgentRow">
      <Button size="sm" variant="outline" disabled aria-label="Send to agent">
        Send to agent
      </Button>
      <Button size="sm" variant="outline" disabled aria-label={`Ask about this ${props.noun}`}>
        Ask
      </Button>
      <text className="GitHubInboxAgentNote">{GITHUB_ITEM_AGENT_UNAVAILABLE_COPY}</text>
    </view>
  );
}
