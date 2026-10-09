// Generated reports under plan/reports are committed and the repo formatter
// (oxfmt) runs over them, so an audit's `--check` must compare against the
// formatted shape of what it would generate, and write mode must leave files
// in that shape. Otherwise `bun fmt --check` and the audit checks can never be
// green at the same time (the committed reports had been oxfmt'd after
// generation, which kept both audits "stale" on a clean tree).

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const oxfmtPath = path.resolve(scriptDir, "../../../node_modules/.bin/oxfmt");

/**
 * Returns `text` as oxfmt would format it at `filePath` (same directory, so
 * the same formatter config applies). Falls back to the raw text when oxfmt is
 * unavailable or declines the file type.
 */
export function formatGeneratedText(filePath, text) {
  if (!fs.existsSync(oxfmtPath)) return text;
  const extension = path.extname(filePath);
  const probePath = path.join(
    path.dirname(filePath),
    `${path.basename(filePath, extension)}.format-probe${extension}`,
  );
  fs.writeFileSync(probePath, text);
  try {
    const result = spawnSync(oxfmtPath, [probePath], { stdio: "ignore" });
    return result.status === 0 ? fs.readFileSync(probePath, "utf8") : text;
  } finally {
    fs.rmSync(probePath, { force: true });
  }
}

export function writeGeneratedFile(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, formatGeneratedText(filePath, text));
}

/** True when the committed file matches the formatted generated text. */
export function generatedFileIsFresh(filePath, text) {
  return (
    fs.existsSync(filePath) &&
    fs.readFileSync(filePath, "utf8") === formatGeneratedText(filePath, text)
  );
}
