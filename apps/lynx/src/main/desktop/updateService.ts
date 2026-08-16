import { app, shell } from '@lynx-js/lynxtron';
import { compareVersions } from './update.logic';
import { openUpdateDownload } from './updateHandoff.logic';

const RELEASE_OWNER = 'Emanuele-web04';
const RELEASE_REPO = 'synara';
const RELEASES_PAGE = `https://github.com/${RELEASE_OWNER}/${RELEASE_REPO}/releases/latest`;
const RELEASE_API = `https://api.github.com/repos/${RELEASE_OWNER}/${RELEASE_REPO}/releases/latest`;

export interface UpdateCheckResult {
  readonly currentVersion: string;
  readonly latestVersion: string | null;
  readonly updateAvailable: boolean;
  readonly releaseName: string | null;
  readonly publishedAt: string | null;
  readonly downloadPage: string;
  readonly error: string | null;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  const currentVersion = app.getVersion();
  try {
    const response = await fetch(RELEASE_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `Synara-Lynx/${currentVersion}`,
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      throw new Error(`GitHub release check returned HTTP ${response.status}`);
    }
    const release = (await response.json()) as {
      readonly tag_name?: unknown;
      readonly name?: unknown;
      readonly published_at?: unknown;
      readonly draft?: unknown;
    };
    const latestVersion =
      typeof release.tag_name === 'string' ? release.tag_name.replace(/^v/i, '') : null;
    if (!latestVersion || release.draft === true) {
      throw new Error('Latest GitHub release response was incomplete');
    }
    return {
      currentVersion,
      latestVersion,
      updateAvailable: compareVersions(latestVersion, currentVersion) > 0,
      releaseName: typeof release.name === 'string' ? release.name : null,
      publishedAt:
        typeof release.published_at === 'string' ? release.published_at : null,
      downloadPage: RELEASES_PAGE,
      error: null,
    };
  } catch (error) {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseName: null,
      publishedAt: null,
      downloadPage: RELEASES_PAGE,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function handleUpdater(method: string): Promise<unknown> {
  switch (method) {
    case 'updaterCheck':
      return JSON.stringify(await checkForUpdate());
    case 'updaterOpenDownload':
      await openUpdateDownload({
        capturePath:
          process.env.SYNARA_UPDATE_OPEN_EXTERNAL_CAPTURE?.trim() || null,
        openExternal: (url) => shell.openExternal(url),
        url: RELEASES_PAGE,
      });
      return JSON.stringify({ opened: true, url: RELEASES_PAGE });
    default:
      return JSON.stringify({ error: `unknown updater method ${method}` });
  }
}
