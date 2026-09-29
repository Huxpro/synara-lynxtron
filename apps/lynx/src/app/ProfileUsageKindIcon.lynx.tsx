import agentSvg from "@synara-central-icons/agent.svg?raw";
import buildingBlocksSvg from "@synara-central-icons/building-blocks.svg?raw";

import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";

export function ProfileUsageKindIcon(props: { readonly kind: "agent" | "skill" }) {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="SettingsProfilePluginGlyph"
      content={colorizeLynxSvg(
        props.kind === "agent" ? agentSvg : buildingBlocksSvg,
        semanticIconColor("secondary"),
      )}
    />
  );
}
