// FILE: platform/dialogs.ts (Lynx impl)
// Purpose: L1 dialogs port for the Lynx target, contract-aligned with
//   synara/apps/web/src/platform/dialogs.ts (DialogsPort = NativeApi['dialogs']).
//   Maps to Lynxtron dialog over the bridge: showMessageBox (Cancel/Confirm)
//   for confirm, showOpenDialog(openDirectory) for pickFolder, showSaveDialog
//   for saveFile.
// Layer: L1 platform port (lynx implementation)

import 'background-only';

import { bridgeCall } from './bridge';

export interface SaveFileInput {
  defaultFilename: string;
  contents: string;
  filters?: ReadonlyArray<{ name: string; extensions: ReadonlyArray<string> }>;
}

export interface PickedFile {
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
  readonly token: string;
}

export interface PickFilesResult {
  readonly errors: ReadonlyArray<string>;
  readonly files: ReadonlyArray<PickedFile>;
}

export interface DialogsPort {
  pickFolder: () => Promise<string | null>;
  pickFiles: () => Promise<PickFilesResult>;
  saveFile?: (input: SaveFileInput) => Promise<string | null>;
  confirm: (message: string) => Promise<boolean>;
}

export const dialogs: DialogsPort = {
  pickFolder: async () => {
    const res = await bridgeCall<{ path: string | null }>('dialogsPickFolder');
    return res.path ?? null;
  },
  pickFiles: async () => {
    const res = await bridgeCall<PickFilesResult>('dialogsPickFiles');
    return {
      files: Array.isArray(res.files) ? res.files : [],
      errors: Array.isArray(res.errors) ? res.errors : [],
    };
  },
  saveFile: async (input) => {
    const res = await bridgeCall<{ path: string | null }>('dialogsSaveFile', {
      defaultFilename: input.defaultFilename,
      contents: input.contents,
      filters: input.filters,
    });
    return res.path ?? null;
  },
  confirm: async (message) => {
    const res = await bridgeCall<{ confirmed: boolean }>('dialogsConfirm', { message });
    return res.confirmed === true;
  },
};

/** Wiring self-check (not part of the port contract). */
export async function pingDialogs(): Promise<Record<string, boolean>> {
  const res = await bridgeCall<{ apis: Record<string, boolean> }>('dialogsPing');
  return res.apis ?? {};
}
