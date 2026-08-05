import {
  DEFAULT_SERVER_SETTINGS_VIEW,
  type ProviderKind,
  type ServerSettingsPatch,
  type ServerSettingsView,
} from '@synara/contracts';

export type ProviderTextFieldId =
  | 'codexBinaryPath'
  | 'codexHomePath'
  | 'claudeBinaryPath'
  | 'cursorBinaryPath'
  | 'cursorApiEndpoint'
  | 'antigravityBinaryPath'
  | 'grokBinaryPath'
  | 'droidBinaryPath'
  | 'kiloBinaryPath'
  | 'kiloServerUrl'
  | 'kiloServerPassword'
  | 'openCodeBinaryPath'
  | 'openCodeServerUrl'
  | 'openCodeServerPassword'
  | 'piBinaryPath'
  | 'piAgentDir';

export type ProviderToolField =
  | {
      readonly kind: 'text' | 'password';
      readonly id: ProviderTextFieldId;
      readonly label: string;
      readonly placeholder: string;
      readonly description: string;
    }
  | {
      readonly kind: 'boolean';
      readonly id: 'openCodeExperimentalWebSockets';
      readonly label: string;
      readonly description: string;
    };

export type ProviderToolConfig = {
  readonly provider: ProviderKind;
  readonly docs: ReadonlyArray<{
    readonly label: string;
    readonly href: string;
  }>;
  readonly fields: readonly ProviderToolField[];
};

function providerFieldRawValue(
  settings: ServerSettingsView,
  id: ProviderTextFieldId
): string {
  switch (id) {
    case 'codexBinaryPath':
      return settings.providers.codex.binaryPath;
    case 'codexHomePath':
      return settings.providers.codex.homePath;
    case 'claudeBinaryPath':
      return settings.providers.claudeAgent.binaryPath;
    case 'cursorBinaryPath':
      return settings.providers.cursor.binaryPath;
    case 'cursorApiEndpoint':
      return settings.providers.cursor.apiEndpoint;
    case 'antigravityBinaryPath':
      return settings.providers.antigravity.binaryPath;
    case 'grokBinaryPath':
      return settings.providers.grok.binaryPath;
    case 'droidBinaryPath':
      return settings.providers.droid.binaryPath;
    case 'kiloBinaryPath':
      return settings.providers.kilo.binaryPath;
    case 'kiloServerUrl':
      return settings.providers.kilo.serverUrl;
    case 'kiloServerPassword':
      return '';
    case 'openCodeBinaryPath':
      return settings.providers.opencode.binaryPath;
    case 'openCodeServerUrl':
      return settings.providers.opencode.serverUrl;
    case 'openCodeServerPassword':
      return '';
    case 'piBinaryPath':
      return settings.providers.pi.binaryPath;
    case 'piAgentDir':
      return settings.providers.pi.agentDir;
  }
}

export function providerFieldValue(
  settings: ServerSettingsView,
  id: ProviderTextFieldId
): string {
  const defaultValue = providerFieldRawValue(DEFAULT_SERVER_SETTINGS_VIEW, id);
  const value = providerFieldRawValue(settings, id);
  return id.endsWith('BinaryPath') && value === defaultValue ? '' : value;
}

export function providerFieldPatch(
  id: ProviderTextFieldId,
  value: string
): ServerSettingsPatch {
  switch (id) {
    case 'codexBinaryPath':
      return { providers: { codex: { binaryPath: value } } };
    case 'codexHomePath':
      return { providers: { codex: { homePath: value } } };
    case 'claudeBinaryPath':
      return { providers: { claudeAgent: { binaryPath: value } } };
    case 'cursorBinaryPath':
      return { providers: { cursor: { binaryPath: value } } };
    case 'cursorApiEndpoint':
      return { providers: { cursor: { apiEndpoint: value } } };
    case 'antigravityBinaryPath':
      return { providers: { antigravity: { binaryPath: value } } };
    case 'grokBinaryPath':
      return { providers: { grok: { binaryPath: value } } };
    case 'droidBinaryPath':
      return { providers: { droid: { binaryPath: value } } };
    case 'kiloBinaryPath':
      return { providers: { kilo: { binaryPath: value } } };
    case 'kiloServerUrl':
      return { providers: { kilo: { serverUrl: value } } };
    case 'kiloServerPassword':
      return { providers: { kilo: { serverPassword: value } } };
    case 'openCodeBinaryPath':
      return { providers: { opencode: { binaryPath: value } } };
    case 'openCodeServerUrl':
      return { providers: { opencode: { serverUrl: value } } };
    case 'openCodeServerPassword':
      return { providers: { opencode: { serverPassword: value } } };
    case 'piBinaryPath':
      return { providers: { pi: { binaryPath: value } } };
    case 'piAgentDir':
      return { providers: { pi: { agentDir: value } } };
  }
}

export function providerToolResetPatch(): ServerSettingsPatch {
  return {
    providers: {
      codex: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.codex.binaryPath,
        homePath: DEFAULT_SERVER_SETTINGS_VIEW.providers.codex.homePath,
      },
      claudeAgent: {
        binaryPath:
          DEFAULT_SERVER_SETTINGS_VIEW.providers.claudeAgent.binaryPath,
      },
      cursor: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.cursor.binaryPath,
        apiEndpoint:
          DEFAULT_SERVER_SETTINGS_VIEW.providers.cursor.apiEndpoint,
      },
      antigravity: {
        binaryPath:
          DEFAULT_SERVER_SETTINGS_VIEW.providers.antigravity.binaryPath,
      },
      grok: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.grok.binaryPath,
      },
      droid: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.droid.binaryPath,
      },
      kilo: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.kilo.binaryPath,
        serverUrl: DEFAULT_SERVER_SETTINGS_VIEW.providers.kilo.serverUrl,
        serverPassword: '',
      },
      opencode: {
        binaryPath:
          DEFAULT_SERVER_SETTINGS_VIEW.providers.opencode.binaryPath,
        serverUrl: DEFAULT_SERVER_SETTINGS_VIEW.providers.opencode.serverUrl,
        serverPassword: '',
        experimentalWebSockets:
          DEFAULT_SERVER_SETTINGS_VIEW.providers.opencode
            .experimentalWebSockets,
      },
      pi: {
        binaryPath: DEFAULT_SERVER_SETTINGS_VIEW.providers.pi.binaryPath,
        agentDir: DEFAULT_SERVER_SETTINGS_VIEW.providers.pi.agentDir,
      },
    },
  };
}

export function isProviderToolDirty(
  config: ProviderToolConfig,
  settings: ServerSettingsView
): boolean {
  return config.fields.some((field) => {
    if (field.kind === 'boolean') {
      return (
        settings.providers.opencode.experimentalWebSockets !==
        DEFAULT_SERVER_SETTINGS_VIEW.providers.opencode.experimentalWebSockets
      );
    }
    if (field.kind === 'password') {
      return field.id === 'kiloServerPassword'
        ? settings.providers.kilo.serverPasswordConfigured
        : settings.providers.opencode.serverPasswordConfigured;
    }
    return providerFieldValue(settings, field.id) !== '';
  });
}
