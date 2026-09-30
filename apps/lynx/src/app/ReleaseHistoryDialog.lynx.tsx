import { useState } from "@lynx-js/react";
import { WHATS_NEW_ENTRIES } from "@synara-web/whatsNew/entries";
import { sortEntriesByVersionDesc, type WhatsNewEntry } from "@synara-web/whatsNew/logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../components/ui/dialog";
import { ChevronRightIcon } from "../lib/icons.lynx";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";

import "./release-history-dialog.css";

function ReleaseHistoryEntry(props: {
  readonly entry: WhatsNewEntry;
  readonly divided: boolean;
  readonly open: boolean;
  readonly onToggle: () => void;
}) {
  const featuresPresent = useLynxDisclosurePresence(props.open);
  const featureLabel = `${props.entry.features.length} ${
    props.entry.features.length === 1 ? "update" : "updates"
  }`;
  const interaction = useLynxInteractiveState({
    baseClassName: "SettingsAdvancedReleaseTrigger",
    accessibleLabel: `Version ${props.entry.version}, ${props.entry.date}`,
    accessibilityValue: props.open ? "Expanded" : "Collapsed",
    onActivate: props.onToggle,
  });
  return (
    <view
      className={`SettingsAdvancedReleaseEntry${
        props.divided ? " SettingsAdvancedReleaseEntry--divided" : ""
      }`}
    >
      <view
        className={interaction.className}
        aria-expanded={props.open}
        {...interaction.eventProps}
      >
        <ChevronRightIcon
          className={disclosureChevronClassName(props.open, "SettingsAdvancedReleaseChevron")}
          size={14}
          color="var(--muted-foreground)"
        />
        <view className="SettingsAdvancedReleaseIdentity">
          <text className="SettingsAdvancedReleaseDate">{props.entry.date}</text>
          <text className="SettingsAdvancedReleaseVersion">Version {props.entry.version}</text>
          <text className="SettingsAdvancedReleaseCount">({featureLabel})</text>
        </view>
      </view>
      {featuresPresent ? (
        <view
          className={disclosureContentClassName(props.open, "SettingsAdvancedReleaseFeatures")}
          aria-hidden={!props.open}
        >
          {props.entry.features.map((feature) => (
            <view key={feature.id} className="SettingsAdvancedReleaseFeature">
              <view className="SettingsAdvancedReleaseFeatureCopy">
                <text className="SettingsAdvancedReleaseFeatureTitle">{feature.title}</text>
                <text className="SettingsAdvancedReleaseFeatureDescription">
                  {feature.description}
                </text>
              </view>
              {feature.details ? (
                <text className="SettingsAdvancedReleaseFeatureDetails">{feature.details}</text>
              ) : null}
            </view>
          ))}
        </view>
      ) : null}
    </view>
  );
}

/**
 * Every curated release, newest first, with one version expanded. Settings > Advanced and
 * the sidebar Help menu both open it (Electron's ReleaseHistoryDialog). Callers remount it
 * with a new `key` to expand a different version.
 */
export function ReleaseHistoryDialogLynx(props: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultExpandedVersion: string | null;
}) {
  const [expandedRelease, setExpandedRelease] = useState<string | null>(
    props.defaultExpandedVersion,
  );
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPopup className="SettingsAdvancedReleaseDialog">
        <view className="SettingsAdvancedReleaseHeader">
          <DialogTitle>Release history</DialogTitle>
          <DialogDescription>Every curated release, newest first.</DialogDescription>
        </view>
        <DialogPanel className="SettingsAdvancedReleasePanel">
          <view className="SettingsAdvancedReleaseList">
            {sortEntriesByVersionDesc(WHATS_NEW_ENTRIES).map((entry, index, entries) => (
              <ReleaseHistoryEntry
                key={entry.version}
                entry={entry}
                divided={index < entries.length - 1}
                open={expandedRelease === entry.version}
                onToggle={() =>
                  setExpandedRelease((current) =>
                    current === entry.version ? null : entry.version,
                  )
                }
              />
            ))}
          </view>
        </DialogPanel>
        <DialogFooter>
          <Button
            size="sm"
            className="SettingsAdvancedReleaseClose"
            onClick={() => props.onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
