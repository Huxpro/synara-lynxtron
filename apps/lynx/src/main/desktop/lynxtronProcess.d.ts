// The Lynxtron runtime sets `process.resourcesPath` (like Electron), but
// @lynx-js/lynxtron ships no Node `Process` augmentation for it.
declare namespace NodeJS {
  interface Process {
    readonly resourcesPath: string;
  }
}
