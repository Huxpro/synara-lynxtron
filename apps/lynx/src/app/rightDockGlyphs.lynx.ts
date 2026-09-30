import type { RightDockPaneKind } from "@synara/shared/rightDock";
import chatBubbleSvg from "@synara-central-icons/chat-bubble-7.svg?raw";
import commitsSvg from "@synara-central-icons/commits.svg?raw";
import consoleSvg from "@synara-central-icons/console.svg?raw";
import differenceSvg from "@synara-central-icons/difference-modified.svg?raw";
import foldersSvg from "@synara-central-icons/folders.svg?raw";
import globeSvg from "@synara-central-icons/globe.svg?raw";
import phoneSvg from "@synara-central-icons/phone.svg?raw";

/** Electron's RIGHT_DOCK_PANE_META glyphs (Central icons), shared by dock tabs and launcher. */
export const RIGHT_DOCK_PANE_GLYPHS: Partial<Record<RightDockPaneKind, string>> = {
  browser: globeSvg,
  device: phoneSvg,
  diff: differenceSvg,
  explorer: foldersSvg,
  git: commitsSvg,
  sidechat: chatBubbleSvg,
  terminal: consoleSvg,
};
