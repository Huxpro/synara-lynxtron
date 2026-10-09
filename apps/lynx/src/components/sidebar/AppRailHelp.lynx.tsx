// FILE: AppRailHelp.lynx.tsx
// Purpose: The rail's Help menu (upstream renders `<SidebarHelpMenu inRail />` in the
//   rail's bottom slot) with the feedback dialog it opens.

import { useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "@lynx-js/react";

import { SYNARA_DOCS_URL } from "@synara-web/components/SidebarHelpMenu.logic";
import { settingsRouteLocation } from "../../app/settingsRoute.logic";
import { useSidebarSnapshot } from "../../app/sidebarSnapshot.lynx";
import { platformWindow } from "../../platform/window";
import { FeedbackDialogLynx, resolveNativeFeedbackContext } from "./FeedbackDialog.lynx";
import { SidebarHelpMenu } from "./SidebarHelpMenu.lynx";

const THREAD_PATH_PATTERN = /^\/thread\/([^/]+)$/;

export function AppRailHelp() {
  const router = useRouter();
  const activeThreadId = useRouterState({
    select: (state) => THREAD_PATH_PATTERN.exec(state.location.pathname)?.[1] ?? null,
  });
  const { data } = useSidebarSnapshot();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const activeThread = data?.threads.find((thread) => thread.id === activeThreadId);
  return (
    <>
      <SidebarHelpMenu
        inRail
        onOpenShortcuts={() => void router.navigate({ to: settingsRouteLocation("shortcuts") })}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenDocs={() => {
          "background only";
          void platformWindow.openExternal(SYNARA_DOCS_URL);
        }}
      />
      <FeedbackDialogLynx
        activeThreadId={activeThreadId}
        open={feedbackOpen}
        fallbackContext={resolveNativeFeedbackContext(
          activeThread,
          data?.projects.find((project) => project.id === activeThread?.projectId)?.kind,
        )}
        onOpenChange={setFeedbackOpen}
      />
    </>
  );
}
