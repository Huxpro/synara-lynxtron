import { useLynxSystemStateAnnouncement } from "../platform/system-state-announcement.lynx";

import "./composer-lifecycle-status-elements.css";

export function ComposerLifecycleStatusElement(props: {
  readonly announcement: string;
  readonly intent: "status" | "alert";
}) {
  useLynxSystemStateAnnouncement(props);
  return (
    <text
      className="ComposerLifecycleStatusLynx"
      accessibility-element={true}
      accessibility-label={props.announcement}
      accessibility-trait={props.intent === "status" ? "updating" : "text"}
    >
      {props.announcement}
    </text>
  );
}
