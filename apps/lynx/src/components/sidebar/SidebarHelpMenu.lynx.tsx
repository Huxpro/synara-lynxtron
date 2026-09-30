import bookSvg from "@synara-central-icons/book-simple.svg?raw";
import feedbackSvg from "@synara-central-icons/bubble-text.svg?raw";
import helpSvg from "@synara-central-icons/circle-questionmark.svg?raw";
import giftSvg from "@synara-central-icons/gift-2.svg?raw";
import keyboardSvg from "@synara-central-icons/keyboard.svg?raw";
import { useState } from "@lynx-js/react";

import {
  helpMenuReleaseTitle,
  resolveHelpMenuReleaseEntries,
} from "@synara-web/components/SidebarHelpMenu.logic";

import { ReleaseHistoryDialogLynx } from "../../app/ReleaseHistoryDialog.lynx";
import { useTheme } from "../../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from "../ui/menu.lynx";
import "./sidebar-help-menu.css";

function HelpMenuIcon(props: { readonly content: string }) {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="SidebarHelpMenuIcon"
      content={colorizeLynxSvg(props.content, semanticIconColor("secondary"))}
    />
  );
}

function HelpMenuIconItem(props: {
  readonly icon: string;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <MenuItem className="SidebarHelpMenuItem" onClick={props.onClick}>
      <view className="SidebarHelpMenuRow">
        <HelpMenuIcon content={props.icon} />
        <text className="SidebarHelpMenuText">{props.label}</text>
      </view>
    </MenuItem>
  );
}

/**
 * Rendered only while the menu is open: the release list sorts with `toSorted`, which the
 * main-thread engine lacks, so it must never run during the first-screen render.
 */
function HelpMenuContent(props: {
  readonly onOpenRelease: (version: string | null) => void;
  readonly onOpenShortcuts: () => void;
  readonly onOpenFeedback: () => void;
  readonly onOpenDocs: () => void;
}) {
  return (
    <>
      <MenuGroup>
        <MenuGroupLabel className="SidebarHelpMenuLabel">What’s new</MenuGroupLabel>
        {resolveHelpMenuReleaseEntries().map((entry) => (
          <MenuItem
            key={entry.version}
            className="SidebarHelpMenuItem"
            onClick={() => props.onOpenRelease(entry.version)}
          >
            <view className="SidebarHelpMenuRow">
              <text className="SidebarHelpMenuText SidebarHelpMenuText--release">
                {helpMenuReleaseTitle(entry)}
              </text>
              <text className="SidebarHelpMenuDate">{entry.date}</text>
            </view>
          </MenuItem>
        ))}
        <HelpMenuIconItem
          icon={giftSvg}
          label="Full changelog"
          onClick={() => props.onOpenRelease(null)}
        />
      </MenuGroup>
      <MenuSeparator className="SidebarHelpMenuSeparator" />
      <MenuGroup>
        <HelpMenuIconItem icon={keyboardSvg} label="Keybindings" onClick={props.onOpenShortcuts} />
        <HelpMenuIconItem icon={feedbackSvg} label="Send feedback" onClick={props.onOpenFeedback} />
        <HelpMenuIconItem icon={bookSvg} label="Docs" onClick={props.onOpenDocs} />
      </MenuGroup>
    </>
  );
}

/** Electron's footer Help menu: recent releases, the changelog, and help destinations. */
export function SidebarHelpMenu(props: {
  readonly onOpenShortcuts: () => void;
  readonly onOpenFeedback: () => void;
  readonly onOpenDocs: () => void;
}) {
  const { semanticIconColor } = useTheme();
  // `openCount` keys the dialog so each open expands the version that was picked.
  const [releaseHistory, setReleaseHistory] = useState<{
    readonly open: boolean;
    readonly version: string | null;
    readonly openCount: number;
  }>({ open: false, version: null, openCount: 0 });
  return (
    <>
      <Menu autoHighlightFirst={false}>
        <MenuTrigger ariaLabel="Help" className="SidebarHelpTrigger">
          <svg
            className="SidebarHelpTriggerGlyph"
            content={colorizeLynxSvg(helpSvg, semanticIconColor("secondary"))}
          />
        </MenuTrigger>
        <MenuPopup
          align="start"
          side="top"
          sideOffset={4}
          className="LxComposerPickerMenuPopup SidebarHelpMenu"
        >
          <HelpMenuContent
            onOpenRelease={(version) =>
              setReleaseHistory((previous) => ({
                open: true,
                version,
                openCount: previous.openCount + 1,
              }))
            }
            onOpenShortcuts={props.onOpenShortcuts}
            onOpenFeedback={props.onOpenFeedback}
            onOpenDocs={props.onOpenDocs}
          />
        </MenuPopup>
      </Menu>
      <ReleaseHistoryDialogLynx
        key={releaseHistory.openCount}
        open={releaseHistory.open}
        onOpenChange={(open) => setReleaseHistory((previous) => ({ ...previous, open }))}
        defaultExpandedVersion={releaseHistory.version}
      />
    </>
  );
}
