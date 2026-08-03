export type BehaviorSettingKey =
  | "enableAssistantStreaming"
  | "diffWordWrap"
  | "confirmThreadDelete"
  | "confirmThreadArchive"
  | "confirmTerminalTabClose";

export type BehaviorSettingsValues = Readonly<Record<BehaviorSettingKey, boolean>>;

export const DEFAULT_BEHAVIOR_SETTINGS_VALUES: BehaviorSettingsValues = {
  enableAssistantStreaming: true,
  diffWordWrap: false,
  confirmThreadDelete: true,
  confirmThreadArchive: false,
  confirmTerminalTabClose: true,
};

export function behaviorSettingsValuesEqual(
  left: BehaviorSettingsValues,
  right: BehaviorSettingsValues,
): boolean {
  return (Object.keys(DEFAULT_BEHAVIOR_SETTINGS_VALUES) as BehaviorSettingKey[]).every(
    (key) => left[key] === right[key],
  );
}
