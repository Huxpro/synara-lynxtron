// This file mostly exists because we want dev mode to say "Synara (Dev)" instead of "electron"

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { resolveSynaraDesktopFlavor, synaraDesktopIdentity } from "@synara/shared/desktopIdentity";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const isDevelopment = Boolean(process.env.VITE_DEV_SERVER_URL);
const desktopFlavor = resolveSynaraDesktopFlavor({
  isDevelopment,
  requestedFlavor: process.env.SYNARA_DESKTOP_FLAVOR,
});
const desktopIdentity = synaraDesktopIdentity(desktopFlavor);
const APP_DISPLAY_NAME = desktopIdentity.displayName;
const APP_BUNDLE_ID = desktopIdentity.bundleId;
const LAUNCHER_VERSION = 2;
const MICROPHONE_USAGE_DESCRIPTION =
  "Synara needs microphone access so you can record voice notes and transcribe them into the chat composer.";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const desktopDir = resolve(__dirname, "..");

function setPlistString(plistPath, key, value) {
  const replaceResult = spawnSync("plutil", ["-replace", key, "-string", value, plistPath], {
    encoding: "utf8",
  });
  if (replaceResult.status === 0) {
    return;
  }

  const insertResult = spawnSync("plutil", ["-insert", key, "-string", value, plistPath], {
    encoding: "utf8",
  });
  if (insertResult.status === 0) {
    return;
  }

  const details = [replaceResult.stderr, insertResult.stderr].filter(Boolean).join("\n");
  throw new Error(`Failed to update plist key "${key}" at ${plistPath}: ${details}`.trim());
}

function setPlistBoolean(plistPath, key, value) {
  const result = spawnSync("plutil", ["-replace", key, "-bool", String(value), plistPath], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to update plist key "${key}" at ${plistPath}: ${result.stderr}`.trim());
  }
}

function patchMainBundleInfoPlist(appBundlePath, iconPath, bundleId, background) {
  const infoPlistPath = join(appBundlePath, "Contents", "Info.plist");
  setPlistString(infoPlistPath, "CFBundleDisplayName", APP_DISPLAY_NAME);
  setPlistString(infoPlistPath, "CFBundleName", APP_DISPLAY_NAME);
  setPlistString(infoPlistPath, "CFBundleIdentifier", bundleId);
  if (background) {
    // An agent (UI element) app never activates or shows in the Dock, so
    // automated launches cannot pull focus from the user's foreground app.
    setPlistBoolean(infoPlistPath, "LSUIElement", true);
  }
  setPlistString(infoPlistPath, "CFBundleIconFile", "icon.icns");
  setPlistString(infoPlistPath, "NSMicrophoneUsageDescription", MICROPHONE_USAGE_DESCRIPTION);

  const resourcesDir = join(appBundlePath, "Contents", "Resources");
  copyFileSync(iconPath, join(resourcesDir, "icon.icns"));
  copyFileSync(iconPath, join(resourcesDir, "electron.icns"));
}

// Chromium derives helper IPC names from the main bundle id, so helper ids must
// extend the same id as the main bundle.
function patchHelperBundleInfoPlists(appBundlePath, bundleId) {
  const frameworksDir = join(appBundlePath, "Contents", "Frameworks");
  if (!existsSync(frameworksDir)) {
    return;
  }

  for (const entry of readdirSync(frameworksDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.endsWith(".app")) {
      continue;
    }
    if (!entry.name.startsWith("Electron Helper")) {
      continue;
    }

    const helperPlistPath = join(frameworksDir, entry.name, "Contents", "Info.plist");
    if (!existsSync(helperPlistPath)) {
      continue;
    }

    const suffix = entry.name.replace("Electron Helper", "").replace(".app", "").trim();
    const helperName = suffix
      ? `${APP_DISPLAY_NAME} Helper ${suffix}`
      : `${APP_DISPLAY_NAME} Helper`;
    const helperIdSuffix = suffix.replace(/[()]/g, "").trim().toLowerCase().replace(/\s+/g, "-");
    const helperBundleId = helperIdSuffix
      ? `${bundleId}.helper.${helperIdSuffix}`
      : `${bundleId}.helper`;

    setPlistString(helperPlistPath, "CFBundleDisplayName", helperName);
    setPlistString(helperPlistPath, "CFBundleName", helperName);
    setPlistString(helperPlistPath, "CFBundleIdentifier", helperBundleId);
  }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function buildMacLauncher(electronBinaryPath, background) {
  const sourceAppBundlePath = resolve(electronBinaryPath, "../../..");
  const runtimeDir = join(desktopDir, ".electron-runtime");
  const bundleName = background ? `${APP_DISPLAY_NAME} (Background)` : APP_DISPLAY_NAME;
  const bundleId = background ? `${APP_BUNDLE_ID}.background` : APP_BUNDLE_ID;
  const targetAppBundlePath = join(runtimeDir, `${bundleName}.app`);
  const targetBinaryPath = join(targetAppBundlePath, "Contents", "MacOS", "Electron");
  const iconPath = join(desktopDir, "resources", "icon.icns");
  const metadataPath = join(runtimeDir, background ? "metadata-background.json" : "metadata.json");

  mkdirSync(runtimeDir, { recursive: true });

  const expectedMetadata = {
    launcherVersion: LAUNCHER_VERSION,
    sourceAppBundlePath,
    sourceAppMtimeMs: statSync(sourceAppBundlePath).mtimeMs,
    iconMtimeMs: statSync(iconPath).mtimeMs,
  };

  const currentMetadata = readJson(metadataPath);
  if (
    existsSync(targetBinaryPath) &&
    currentMetadata &&
    JSON.stringify(currentMetadata) === JSON.stringify(expectedMetadata)
  ) {
    return targetBinaryPath;
  }

  rmSync(targetAppBundlePath, { recursive: true, force: true });
  // ditto keeps the framework's relative symlinks; Node's cpSync rewrites them
  // to absolute links into the source bundle, which breaks helper startup.
  const copy = spawnSync("ditto", [sourceAppBundlePath, targetAppBundlePath], {
    encoding: "utf8",
  });
  if (copy.status !== 0) {
    throw new Error(`Failed to copy the Electron app bundle: ${copy.stderr.trim()}`);
  }
  patchMainBundleInfoPlist(targetAppBundlePath, iconPath, bundleId, background);
  patchHelperBundleInfoPlists(targetAppBundlePath, bundleId);
  writeFileSync(metadataPath, `${JSON.stringify(expectedMetadata, null, 2)}\n`);

  return targetBinaryPath;
}

// `background` builds a separate agent-app bundle for automated launches
// (comparison harness) so they never take focus from the user.
export function resolveElectronPath({ background = false } = {}) {
  const require = createRequire(import.meta.url);
  const electronBinaryPath = require("electron");

  if (process.platform !== "darwin") {
    return electronBinaryPath;
  }

  return buildMacLauncher(electronBinaryPath, background);
}
