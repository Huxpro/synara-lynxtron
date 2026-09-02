import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import {
  calculateFidelityLoss,
  captureMismatchReason,
  classifyRenderedTheme,
  exponentialMovingAverage,
  groupEvidenceFilesBySourceCommit,
  isComparableImageGeometry,
  median,
  normalizeEvidenceName,
  reliabilityLossFromPoints,
  resolveEvidenceActivationIndex,
  resolveEvidenceSourceCommit,
  visualQualityBand,
  visualLossFromSamples,
  visualPairMatchesIssue,
  visualSampleSupersessionAtCommit,
  weightedComponentContributions,
  FIDELITY_LOSS_WEIGHTS,
} from './fidelity-loss.logic.mjs';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDirectory, '../../..');
const evidenceRoot = resolve(
  repoRoot,
  'shots/2026-08-04/p10-perceptual-fidelity'
);
const archivePath = resolve(evidenceRoot, 'screenshot-archive.js');
const outputJsonPath = resolve(evidenceRoot, 'fidelity-loss.json');
const outputJsPath = resolve(evidenceRoot, 'fidelity-loss.js');
const comparableClients = ['web', 'lynx', 'native'];
const visualRollingWindowSize = 24;
const emaAlpha = 0.18;
const remoteAssetCache = mkdtempSync(
  join(tmpdir(), 'synara-fidelity-assets-cache-')
);
mkdirSync(remoteAssetCache, { recursive: true });
process.on('exit', () => {
  rmSync(remoteAssetCache, { force: true, recursive: true });
});

const reliabilityLedger = [
  {
    id: 'viewport-state-fanout',
    severityPoints: 1,
    introduced: '664d8063e',
    fixed: '4ae9dedf4',
    summary: 'Viewport hydration race and duplicated resize subscriptions',
  },
  {
    id: 'titlebar-drag-controls',
    severityPoints: 3,
    introduced: 'bc846aab4',
    fixed: '3b9e343cc',
    summary: 'Focusable titlebar controls participated in the drag region',
  },
  {
    id: 'native-preview-startup',
    severityPoints: 3,
    introduced: '7165953da',
    fixed: '13561914d',
    summary: 'Explorer preview initializer crashed the Native runtime',
  },
  {
    id: 'native-diff-nested-wheel-routing',
    severityPoints: 3,
    introduced: '7edf76421',
    fixed: '0870afbbd',
    summary:
      'A global CGEvent probe was incorrectly attributed to the exact-owned Native Diff dock without a passing owned simple-scroll control',
  },
  {
    id: 'lynx-web-relay-open-state-misclassified',
    severityPoints: 3,
    introduced: 'b4df16d69',
    fixed: '023a36d57',
    summary:
      'Lynx-for-Web rejected an open feature socket because the host depended on WebSocket.OPEN',
  },
];
const productEvidenceSupersessionLedger = [
  {
    id: 'markdown-token-current-persisted-output',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-02--harness--markdown-tokens'],
    affectedStateKeys: ['persisted-tokens'],
    affectedClientPairs: ['web:lynx'],
    supersededAt: '5377f2b61',
    summary:
      'The August 2 persisted-token frame predates current shared token labels, full-pane transcript composition, and resolved Native skill accent paint.',
    resolution:
      'Committed retained evidence renders one canonical isolated user message with non-empty mention and skill projections in Electron and Lynx-for-Web on the same backend, thread, route, theme, viewport, and dock state.',
    evidence: [
      'shots/2026-09-02/markdown-tokens-current/notes.md',
      'shots/2026-09-02/markdown-tokens-current/electron-persisted-tokens.png',
      'shots/2026-09-02/markdown-tokens-current/lynx-persisted-tokens.png',
    ],
  },
  {
    id: 'markdown-token-current-menu-and-selection',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-02--harness--markdown-tokens'],
    affectedStateKeys: [
      'skill-menu',
      'mention-menu',
      'skill-selected',
      'mention-selected',
    ],
    affectedClientPairs: ['web:lynx'],
    supersededAt: '3a8158992',
    summary:
      'The August 2 composer menu and selected-token frames predate shared skill display-name projection and current rich-token presentation.',
    resolution:
      'Committed retained Electron and Lynx-for-Web evidence covers the same backend, thread, route, overlay state, viewport, and dock state for both menus and both selected-token states. Persisted-token output remains independently scored.',
    evidence: [
      'shots/2026-09-02/markdown-tokens-current/notes.md',
      'shots/2026-09-02/markdown-tokens-current/pngs.sha256',
    ],
  },
  {
    id: 'transcript-scroll-current-full-pane',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-02--harness--transcript-scroll'],
    affectedStateKeys: ['pinned', 'detached'],
    affectedClientPairs: ['web:lynx'],
    supersededAt: '3986fb12a',
    summary:
      'The August 2 transcript frames predate the shared full-pane scroll owner and the Lynx-safe scroll-to-bottom icon.',
    resolution:
      'Committed retained Electron and Lynx-for-Web evidence uses one backend, thread, route, overlay state, viewport, and dock state for both pinned and detached cells. The full-pane owner is converged and the detached control now paints the canonical arrow.',
    evidence: [
      'shots/2026-09-02/transcript-current-recapture/notes.md',
      'shots/2026-09-02/transcript-current-recapture/electron-pinned.png',
      'shots/2026-09-02/transcript-current-recapture/lynx-pinned.png',
      'shots/2026-09-02/transcript-current-recapture/electron-detached.png',
      'shots/2026-09-02/transcript-current-recapture/lynx-detached.png',
    ],
  },
  {
    id: 'p8-q2-empty-thread-current-landing',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-03--p8-q2--threads--'],
    supersededAt: '8d1506220',
    summary:
      'The P8-Q2 empty-thread landing frames record the pre-centered hero/composer and pre-context-tray product state.',
    resolution:
      'Committed retained Web, Lynx-for-Web, and exact-owned Native evidence covers the centered shared landing, project context tray, and Temporary lifecycle. All eight old Browser and Native pairs stop contributing after that product boundary.',
    evidence: [
      'shots/2026-08-06/thread-empty-current/notes.md',
      'apps/lynx/plan/LOG.md',
    ],
  },
  {
    id: 'p8-q2-settings-general-current-native-shell',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-03--p8-q2--settings--'],
    affectedClientPairs: ['lynx:native'],
    supersededAt: 'a385a479f',
    summary:
      'The P8-Q2 Settings General Native frames predate the canonical 256px Settings sidebar, shared 672px content rail, semantic typography, control geometry, and final vertical rhythm.',
    resolution:
      'Committed Settings shell, typography, material, and vertical-rhythm work plus current exact-owned General evidence supersede only the four stale Native snapshots. Browser contamination remains tracked separately.',
    evidence: [
      'apps/lynx/plan/reports/p10-typography-calibration.md',
      'apps/lynx/plan/LOG.md',
    ],
  },
  {
    id: 'p10-final-matrix-settings-general-current-native-shell',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: [
      '2026-08-04--p10-perceptual-fidelity--final-matrix--settings-general-',
    ],
    affectedClientPairs: ['lynx:native'],
    supersededAt: 'a385a479f',
    summary:
      'The P10 final-matrix Settings General Native raw and comparison frames predate the final shared Settings shell scale and vertical rhythm.',
    resolution:
      'Retained P10 typography/material evidence and the committed final Settings sidebar rhythm supersede only the eight stale Native samples; their Browser siblings remain independently scored.',
    evidence: [
      'apps/lynx/plan/reports/p10-typography-calibration.md',
      'apps/lynx/plan/LOG.md',
    ],
  },
  {
    id: 'settings-skills-current-native-row-rhythm',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-05--settings-skills-'],
    affectedClientPairs: ['lynx:native'],
    supersededAt: 'ef1706ce3',
    summary:
      'The August 5 Settings Skills Native frames predate the final wide-row copy-to-control gap and accumulated section-height correction.',
    resolution:
      'Committed current-head evidence made the 624px Shared skills section and representative row heights exact across Web and Lynx, with Native/Desktop build coverage. Only the stale Native snapshots stop contributing.',
    evidence: [
      'apps/lynx/plan/LOG.md',
      'shots/2026-08-08/settings-skills-row-gap-current/notes.md',
    ],
  },
  {
    id: 'settings-integrations-current-native-surface',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-05--settings-integrations-current'],
    affectedClientPairs: ['lynx:native'],
    supersededAt: '9962bf8a9',
    summary:
      'The initial Settings Integrations Native frame predates responsive collection handling and the complete disclosure workflow.',
    resolution:
      'Committed follow-ups completed responsive collection layout, project selection, disclosure state, input metadata, and the full empty/create workflow. Current same-backend Browser evidence measures Web-to-Lynx at 0.555%; only the stale Native snapshot stops contributing.',
    evidence: [
      'apps/lynx/plan/LOG.md',
      'apps/lynx/plan/reports/settings-fidelity-continuation-audit.md',
    ],
  },
  {
    id: 'settings-appsnap-current-native-capability',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: ['2026-08-05--settings-appsnap-current'],
    affectedClientPairs: ['lynx:native'],
    supersededAt: '6cf595b46',
    summary:
      'The initial Settings AppSnap Native frame predates restored product copy and host-backed Native capability state.',
    resolution:
      'Committed follow-ups restored AppSnap product copy and exposed Native capability state. Current exact-owned Native shows the real shortcut, capture-sound control, destination behavior, and macOS permission rows; only the stale Native snapshot stops contributing.',
    evidence: [
      'apps/lynx/plan/LOG.md',
      'apps/lynx/plan/reports/p10-completion-audit.md',
    ],
  },
  {
    id: 'automations-create-dialog-current-form',
    type: 'superseded-product-snapshot',
    affectedStoryPrefixes: [
      '2026-08-14--automations--create-dialog',
    ],
    supersededAt: 'ae6a64bf4',
    summary:
      'The 2026-08-14 Native create-dialog frames record a real historical form gap that no longer represents the current product.',
    resolution:
      'Later exact-owned Native evidence covers the complete create form, schedule and heartbeat conditional state, model discovery, and reachable runtime policy controls. The old matched pairs remain historical samples but stop contributing to current visual loss after the final reachability fix.',
    evidence: [
      'shots/2026-08-16/native-automations-detail-current/notes.md',
      'shots/2026-08-17/native-automations-create-schedule-switching/notes.md',
      'shots/2026-08-17/native-automations-create-heartbeat-switching/notes.md',
      'shots/2026-08-18/native-automations-create-policy-reachability/notes.md',
    ],
  },
];
const visualPairOverrides = new Map([
  [
    '2026-08-08--current-head-settings-general-dark-1280:web:lynx:raw',
    {
      left: 'web.png',
      right: 'lynx-after-restore-radius.png',
      reason:
        'The evidence notes designate lynx-after-restore-radius.png as the final post-fix frame; lynx.png predates the restore icon, size, and radius corrections.',
    },
  ],
  [
    '2026-08-11--current-head-landing-light-1280:web:lynx:landing',
    {
      left: 'web/landing.png',
      right: 'lynx/landing-after.png',
      reason:
        'The evidence notes designate landing-after.png as the retained post-fix Lynx frame; landing.png is the missing-banner baseline.',
    },
  ],
]);
const harnessIssueLedger = [
  {
    id: 'command-palette-empty-shell-and-results-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: ['2026-08-03--command-k--browser--states'],
    affectedStateKeys: ['empty'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'The Command Palette empty-state pair mixes Web provider-update and health overlays with no Recent rows against an unobscured Lynx-for-Web shell containing three Recent rows and a different suggested-command set.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only this exact empty-state pair is excluded; other Command Palette query and open-state comparisons remain independently scored or governed by their existing state-specific exclusions.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-empty-1280-shell-and-results-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: ['2026-08-03--command-k--browser--empty-1280'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'The separate Command Palette empty-1280 story also mixes Web provider-update and health overlays with no Recent rows against an unobscured Lynx-for-Web palette containing Recent rows.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only this exact story is excluded; no broader Command Palette prefix rule is introduced.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-message-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: ['2026-08-03--command-k--browser--message-1280'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'The matching Command Palette message query/result is captured under provider-update and health overlays in Web but an unobscured shell in Lynx-for-Web.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only this exact overlay-contaminated full-frame pair is excluded. Result-row highlight and summary fidelity still require a matched recapture.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-theme-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: ['2026-08-03--command-k--browser--theme-1280'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'The matching Command Palette theme query/actions are captured under provider-update and health overlays in Web but an unobscured shell in Lynx-for-Web.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only this exact overlay-contaminated full-frame pair is excluded. Selected-row paint and icon fidelity still require a matched recapture.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-open-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '5d296ee8',
    affectedStoryIds: [
      '2026-08-06--command-k-current',
      '2026-08-06--command-k-shadow-current',
    ],
    affectedStoryPrefix: '2026-08-06--command-k-',
    affectedStateKeys: ['open-final', 'open'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'These Command Palette pairs compare a Web frame without the palette against a Lynx-for-Web frame with the modal open; the gray backdrop makes the latter classify as mixed.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['e73701b73'],
    resolution:
      'Later exact geometry, radius, footer, material, keyboard, and Native evidence covers the open Command Palette. Only the mismatched open states are excluded; the valid open-before pair remains scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-open-before-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: ['2026-08-06--command-k-current'],
    affectedStateKeys: ['open-before'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'Both Command Palette frames are open, but Web has provider-update and error overlays plus a broader suggested-command set while Lynx-for-Web has a Codex-unavailable banner and different project/thread state.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the exact open-before mixed-provider-state pair is excluded; later matched Command Palette geometry, material, keyboard, and Native evidence remains the current authority.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'command-palette-focused-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: [
      '2026-08-06--command-k-footer-current',
      '2026-08-06--command-k-footer-text-current',
      '2026-08-06--command-k-input-current',
      '2026-08-06--command-k-kbd-current',
      '2026-08-06--command-k-label-current',
    ],
    affectedStateKeys: ['open'],
    affectedClientPairs: ['web:lynx'],
    summary:
      'These focused Command Palette stories reuse a Web shell with provider-update and error overlays plus eight suggested commands against a Lynx-for-Web shell with a Codex-unavailable banner and six suggested commands.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the four exact full-frame pairs are excluded; their focused source assertions and later matched Command Palette evidence remain valid.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'sidebar-early-browser-theme-mismatch-family',
    type: 'capture-theme-mismatch',
    detectedAt: '5d296ee8',
    affectedStoryIds: [
      '2026-08-06--sidebar-primary-focus-ring-current',
      '2026-08-06--sidebar-primary-pressed-current',
      '2026-08-06--sidebar-primary-section-rhythm-current',
      '2026-08-06--sidebar-project-add-current',
      '2026-08-06--sidebar-section-header-typography-current',
      '2026-08-06--sidebar-segmented-focus-current',
      '2026-08-06--sidebar-segmented-pressed-current',
      '2026-08-06--sidebar-segmented-thumb-current',
      '2026-08-07--current-head-paired-landing',
    ],
    affectedStoryPrefix: '2026-08-06--sidebar-',
    affectedClientPairs: ['web:lynx'],
    summary:
      'These early Sidebar browser pairs render Web dark and Lynx-for-Web light, producing 91-95% whole-frame error unrelated to the focused row, focus, pressed, typography, or segmented-control contracts.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the exact Web-to-Lynx story set is excluded; valid sibling states and later same-theme Sidebar evidence remain scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'sidebar-early-native-theme-mismatch-family',
    type: 'capture-theme-mismatch',
    detectedAt: '5d296ee8',
    affectedStoryIds: [
      '2026-08-06--sidebar-primary-section-rhythm-current',
      '2026-08-06--sidebar-primary-shortcut-current',
      '2026-08-06--sidebar-primary-shortcut-reveal-current',
      '2026-08-06--sidebar-section-header-typography-current',
      '2026-08-06--sidebar-segmented-thumb-current',
      '2026-08-07--sidebar-footer-frame-current',
      '2026-08-07--sidebar-primary-active-current',
      '2026-08-07--sidebar-primary-top-rhythm-current',
    ],
    affectedStoryPrefix: '2026-08-06--sidebar-',
    affectedClientPairs: ['lynx:native'],
    summary:
      'These early Sidebar Native pairs render Lynx-for-Web light and Native dark, producing 92-96% whole-frame error unrelated to the focused Sidebar contracts.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the exact Lynx-to-Native story set is excluded; valid browser siblings and later same-theme Native Sidebar evidence remain scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'landing-matrix-dark-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '2f12c0a9',
    affectedStoryIds: [
      '2026-08-10--landing-matrix-current--browser--landing-default-dark-1280',
      '2026-08-10--landing-matrix-current--browser--landing-default-dark-1440',
    ],
    affectedStoryPrefix:
      '2026-08-10--landing-matrix-current--browser--landing-default-dark-',
    summary:
      'The dark Web landing matrix frames contain a provider-update prompt overlay while their Lynx-for-Web siblings do not; the light siblings are matched and remain scored.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the two overlay-contaminated dark cells are excluded. The same matrix light cells and later matched dark landing evidence remain available for visual scoring.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'composer-runtime-chevron-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '4d5ab78e6',
    affectedStoryPrefix: '2026-08-08--composer-runtime-chevron-current',
    affectedClientPairs: ['web:lynx'],
    summary:
      'The Web runtime-chevron frame has no provider-health banner while Lynx-for-Web includes the 68px Codex status banner, shifting the full landing composition.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['c041b0430'],
    resolution:
      'The local 12px generated chevron geometry and Native identity evidence remain valid; only the provider-state-mismatched Web-to-Lynx frame is excluded.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'composer-model-bootstrap-interaction-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'c041b0430',
    affectedStoryPrefix:
      '2026-08-11--current-head-composer-model-picker-bootstrap-light-1280',
    summary:
      'The Web frame has already opened the OpenCode model submenu while Lynx-for-Web remains on the provider list because provider-row activation was not yet deliverable.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['023a36d57'],
    resolution:
      'Later provider-row activation evidence reaches the models panel through the product path. The old two-different-panels pair cannot measure visual parity.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'provider-banner-icon-update-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'c041b0430',
    affectedStoryPrefix:
      '2026-08-11--current-head-provider-banner-icon-light-1280',
    summary:
      'The Web provider-banner icon frame contains a Pi update prompt overlay while Lynx-for-Web does not, even though the target banner bounds and icon paint match exactly.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The exact 736x68 banner geometry and rgb(224,46,42) icon probes remain valid; the update-overlay-contaminated full-frame pair is excluded from visual MAE.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'landing-native-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '5d296ee8',
    affectedStoryPrefix: '2026-08-08--current-head-landing-light-1280',
    affectedClientPairs: ['lynx:native'],
    summary:
      'The Lynx-for-Web landing frame has no provider-health banner while the paired Native frame includes the 68px Codex status banner, shifting the complete focal composition.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['c041b0430'],
    resolution:
      'Later landing bootstrap evidence publishes provider status atomically. The local Chats geometry remains valid, but this state-mismatched full-frame Native pair cannot measure product visual parity.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'landing-dark-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '5d296ee8',
    affectedStoryPrefix: '2026-08-08--current-head-landing-dark-1280',
    summary:
      'The dark Web landing frame has no provider-health banner while Lynx-for-Web includes the 68px Codex status banner, shifting the complete landing composition.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['c041b0430'],
    resolution:
      'Later landing bootstrap evidence publishes provider status atomically; this old full-frame pair cannot measure dark landing parity.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'appearance-settings-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '9092e2c17',
    affectedStoryPrefix: '2026-08-14--appearance-settings-cell',
    summary:
      'The wide Appearance pair compares Electron with an open provider-update overlay obscuring the page heading against Lynx-for-Web without that overlay.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Exact row geometry and compact responsive behavior remain supported by the retained probes; the overlay-mismatched full-shell pair is excluded from visual MAE.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-appearance-aug05-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: [
      '2026-08-05--settings-appearance-current',
      '2026-08-05--settings-appearance-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
    summary:
      'Both August 5 Appearance Web frames contain an open provider-update overlay that is absent from Lynx-for-Web, obscuring the page heading and upper settings card.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the two overlay-contaminated Web-to-Lynx pairs are excluded; their same-page Lynx-to-Native siblings remain scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-skills-aug05-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: [
      '2026-08-05--settings-skills-current',
      '2026-08-05--settings-skills-dark-1440',
    ],
    affectedClientPairs: ['web:lynx'],
    summary:
      'Both August 5 Settings Skills Web frames contain an open provider-update overlay absent from Lynx-for-Web, obscuring the heading and portable-skills card.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the two overlay-contaminated Web-to-Lynx pairs are excluded. Their same-page Lynx-to-Native siblings remain scored, independently from the newer Plugin Library Skills evidence.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-integrations-appsnap-aug05-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryIds: [
      '2026-08-05--settings-integrations-current',
      '2026-08-05--settings-appsnap-current',
    ],
    affectedClientPairs: ['web:lynx'],
    summary:
      'The August 5 Integrations and AppSnap Web frames contain an open provider-update overlay absent from Lynx-for-Web, obscuring each page heading and upper card.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the two overlay-contaminated Browser pairs are excluded. Their stale Native snapshots are tracked separately as commit-bounded product supersessions.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'sidebar-landing-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '4d5ab78e6',
    affectedStoryIds: [
      '2026-08-08--sidebar-projects-rhythm-current',
      '2026-08-08--sidebar-chats-chevron-current',
      '2026-08-08--composer-project-folder-current',
    ],
    affectedClientPairs: ['web:lynx'],
    affectedStoryPrefix: '2026-08-08--sidebar-',
    summary:
      'The Sidebar projects-rhythm, Chats-chevron, and Composer project-folder pairs reuse a Web landing baseline without the provider banner and a Lynx frame with the 68px banner, shifting the full composition.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Their focused geometry, icon, transition, and exact-owned Native checks remain valid; only the provider-state-mismatched full-shell MAE is excluded.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'sidebar-pr-icon-provider-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '4d5ab78e6',
    affectedStoryPrefix: '2026-08-08--sidebar-pull-request-icon-current',
    summary:
      'The sidebar Pull requests icon pair compares Web without a provider-health banner against Lynx-for-Web with the 68px Codex status banner, shifting the landing composition.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['7a3d97f05'],
    resolution:
      'The local icon evidence verifies identical 15x15 geometry and canonical path, with exact-owned Native paint and console proof; the full-shell pair cannot measure icon-only MAE.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'environment-fast-loop-shell-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '2f12c0a9',
    affectedStoryIds: [
      '2026-08-09--environment-fast-loop-current',
      '2026-08-09--environment-loaded-current',
      '2026-08-09--environment-local-status-current',
    ],
    affectedStoryPrefix: '2026-08-09--environment-',
    summary:
      'The 2026-08-09 Environment full-shell pairs mix hydrated Electron sidebars and provider-update overlays with Lynx-for-Web Loading projects state; some Lynx panel frames are also still loading, and the dark-bottom captures use different themes.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The local geometry, token, and scroll assertions remain valid evidence, but none of these full-shell PNGs isolates Environment visual parity. Later hydrated-shell evidence resolves the sidebar state.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'automations-list-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'dfa1c45f9',
    affectedStoryPrefix: '2026-08-14--automations--',
    affectedStoryIds: [
      '2026-08-14--automations--list',
      '2026-08-14--automations--list-paused',
      '2026-08-14--automations--empty',
    ],
    summary:
      'The Automations list, paused-list, and empty Electron frames contain an open provider-update overlay that is absent from the matching Lynx frames.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['527f1f6fe'],
    resolution:
      'Later exact-owned Automations list/detail evidence verifies current state and interactions; these overlay-mismatched full-shell pairs remain archived but cannot measure list-only visual MAE.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'environment-row-shell-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '2f12c0a9',
    affectedStoryPrefix: '2026-08-11--environment-row-hover-current',
    summary:
      'Both Environment row pairs compare Electron with a provider-update overlay and hydrated sidebar against Lynx-for-Web still showing Loading projects with no update overlay.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['2f118bc49'],
    resolution:
      'The retained row geometry and hover-token checks remain valid, and later thread bootstrap evidence resolves sidebar hydration; the shell-mismatched screenshots cannot measure Environment-only MAE.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'viewport-settings-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '4ae9dedf4',
    affectedStoryPrefix: '2026-08-18--viewport-single-owner-update',
    summary:
      'The comparable viewport pair has an open provider-update overlay in Electron that is absent from Lynx-for-Web, obscuring the otherwise aligned Settings General surface.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The retained geometry and live-resize evidence remains valid, but this screenshot pair is excluded from visual MAE pending an overlay-matched recapture.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'empty-thread-current-theme-mismatch',
    type: 'capture-theme-mismatch',
    detectedAt: '80d4078eb',
    affectedStoryPrefix: '2026-08-10--empty-thread-',
    summary:
      'Both current empty-thread pairs rendered Electron dark and Lynx-for-Web light, producing roughly 91% color errors unrelated to the heading and null-branch context contracts.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The pairs remain historical heading and null-branch behavior evidence but are excluded from visual MAE until the same states are recaptured under one theme.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'p8-q2-settings-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix: '2026-08-03--p8-q2--settings--',
    affectedClientPairs: ['web:lynx'],
    summary:
      'All four P8-Q2 Settings Web frames contain an open provider-update overlay that is absent from their Lynx-for-Web siblings; the underlying General layouts are otherwise closely aligned.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the overlay-contaminated Web-to-Lynx pairs are excluded. Their same-theme Lynx-to-Native siblings remain scored as valid Native fidelity evidence.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'p8-q2-pull-requests-repository-warning-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix: '2026-08-03--p8-q2--pull-requests--',
    affectedClientPairs: ['web:lynx'],
    summary:
      'All four P8-Q2 Pull requests Web frames include a repository-unavailable warning absent from Lynx-for-Web, so the full-frame pairs do not share product state.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only Web-to-Lynx pairs are excluded. Search and filter capability differences require matched-state evidence, while all Lynx-to-Native siblings remain scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'p8-q2-thread-native-transcript-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix: '2026-08-03--p8-q2--thread--',
    affectedClientPairs: ['lynx:native'],
    summary:
      'All four P8-Q2 Thread Lynx-for-Web frames show the short code-block seed transcript while their Native siblings show a different long WebSocket essay transcript at a different scroll position.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Only the transcript-state-mismatched Lynx-to-Native pairs are excluded. The corresponding Web-to-Lynx pairs retain their historical same-transcript comparison.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'p10-final-matrix-thread-native-transcript-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix:
      '2026-08-04--p10-perceptual-fidelity--final-matrix--thread-default-',
    affectedClientPairs: ['lynx:native'],
    summary:
      'The P10 final-matrix Lynx-for-Web Thread frames show the short code-block seed transcript while their Native siblings show a different long WebSocket essay, extra user turns, a different scroll position, and a reconnecting badge.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'Both raw and titlebar-normalized comparison states are excluded only for Lynx-to-Native. Browser siblings and unrelated final-matrix surfaces remain independently scored.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-shortcuts-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix: '2026-08-03--settings-shortcuts--browser--',
    affectedClientPairs: ['web:lynx'],
    summary:
      'Both archived Settings Keyboard Shortcuts Web frames contain an open provider-update overlay that obscures the heading and search field while Lynx-for-Web is unobscured.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The dark-1440 and light-1280 Browser pairs are excluded as overlay-contaminated full-frame comparisons; their aligned shortcut table remains historical structure evidence.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-notifications-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '1352e45ae',
    affectedStoryPrefix: '2026-08-03--settings-notifications--browser--',
    affectedClientPairs: ['web:lynx'],
    summary:
      'Both archived Settings Notifications Web frames contain an open provider-update overlay absent from Lynx-for-Web, obscuring the heading and upper notification controls.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The two full-frame Browser pairs are excluded. Notification-test capability and status-copy differences remain a separate matched-state product question.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-general-route-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: '2f12c0a9',
    affectedStoryPrefix:
      '2026-08-10--settings-general-matrix-current--browser--settings-general-',
    summary:
      'The Settings General matrix labels do not match the rendered routes: Electron captured AppSnap while Lynx-for-Web captured General at both themes and widths.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'All four mislabeled route pairs remain archived but cannot contribute to same-state visual MAE; a matched General recapture is still required.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'automations-detail-provider-overlay-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'dfa1c45f9',
    affectedStoryPrefix: '2026-08-14--automations--detail',
    summary:
      'The Electron Automation detail frame includes an open provider-update overlay and different header-action state while the Lynx frame has no overlay, so the pair does not isolate detail-surface fidelity.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['527f1f6fe'],
    resolution:
      'Later current-head exact-owned 1280x820 detail evidence validates the same main/aside split, title, content geometry, copy, and state with zero console errors and only one-pixel Native rhythm.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'settings-release-history-rendered-theme-mismatch',
    type: 'capture-theme-mismatch',
    detectedAt: '2f12c0a9',
    affectedStoryPrefix: '2026-08-10--settings-release-history-rhythm-current',
    summary:
      'The paired Release history geometry evidence rendered Electron dark and Lynx-for-Web light; the light modal backdrop was classified as mixed, so automatic theme detection alone could not reject the pair.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: [],
    resolution:
      'The pair remains valid geometry and interaction evidence but is excluded from color MAE until a same-theme recapture replaces it.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'p9-command-menu-theme-mismatch',
    type: 'capture-theme-mismatch',
    detectedAt: '75a03632e',
    affectedStoryPrefix:
      '2026-08-03--p9-u5-composer--browser--command-menu--',
    summary:
      'Web command-menu screenshots rendered dark while Web and Lynx assertions both declared light.',
    severityPoints: 2,
    resolvedBy: ['9a75c7560', '32d83f97a'],
    resolution:
      'Current light Web/Lynx evidence converged to 98.7% parity, followed by synchronized Native certification.',
    resolutionStoryPrefixes: [
      '2026-08-04--p10-perceptual-fidelity--browser--skill-menu-filtered',
      '2026-08-04--p10-perceptual-fidelity--final-overlays--mention-menu-filtered',
      '2026-08-04--p10-perceptual-fidelity--final-overlays--skill-menu-filtered',
    ],
  },
  {
    id: 'temporary-sidebar-hydration',
    type: 'capture-product-state-mismatch',
    detectedAt: '2221865a8',
    affectedStoryPrefix: '2026-08-13--temporary-chat-current--',
    summary:
      'The Temporary on/off pairs compare a hydrated Electron shell with provider status and full sidebar against Lynx-for-Web still showing Loading projects with different header and provider state.',
    severityPoints: 1,
    excludeVisualPairs: true,
    resolvedBy: ['2f118bc49'],
    resolution:
      'Thread-route bootstrap now seeds the shared sidebar snapshot before thread-specific fetches; a fresh route rendered real project and thread rows.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'lynx-web-sidebar-row-bindtap-automation',
    type: 'interaction-harness-boundary',
    detectedAt: '2f118bc49',
    affectedStoryPrefix: '2026-08-13--temporary-chat-current--',
    summary:
      'The visible Lynx-for-Web sidebar row does not activate through agent-browser click, pointer, keyboard, or synthetic tap paths, blocking retained Temporary cleanup UI evidence.',
    severityPoints: 0,
    resolvedBy: [],
    resolution:
      'Unresolved harness-only automation boundary; it does not count as product visual or reliability loss.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'native-automations-devtool-fixed-port',
    type: 'native-certification-harness-blocker',
    detectedAt: '06cbda876',
    affectedStoryPrefix: '2026-08-14--automations--',
    summary:
      'The exact-owned Synara Lynxtron process loaded the production bundle in a background window but could not register a DevTool client while a user-owned Lynxtron occupied the fixed localhost:8901 endpoint.',
    severityPoints: 0,
    resolvedBy: ['af9db8126'],
    resolution:
      'A fresh exact-owned @synara/lynx process registered on PID-derived localhost:8902 while the unrelated localhost:8901 client remained running, then completed the Native Automation Repeats roundtrip with a clean console.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'workspace-split-stub-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'cfbc288f3',
    affectedStoryPrefix: '2026-08-14--workspace--split-layout',
    summary:
      'The Web frame captured the xterm split workspace while Lynx-for-Web used the retired dark Terminal-ready stub, a different active backend, and mixed rendered theme.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['b584638f3'],
    resolution:
      'Current Native Workspace uses the real multi-PTY split composition and passed exact-owned lifecycle, persistence, ordering, asymmetric-layout, and dark/short-window verification.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'explorer-disclosure-shell-state-mismatch',
    type: 'capture-product-state-mismatch',
    detectedAt: 'f8823edc0',
    affectedStoryPrefix: '2026-08-13--explorer-disclosure-current--',
    summary:
      'Explorer disclosure frames used different shell hydration and provider states: Web had the real project/thread and provider banner while Lynx-for-Web still showed Loading projects with different composer and dock chrome.',
    severityPoints: 0,
    excludeVisualPairs: true,
    resolvedBy: ['dfd4baa86'],
    resolution:
      'Later compact Explorer tree evidence uses the real hydrated shell and validates current tree disclosure, close, preview, action, and recovery behavior.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'native-devtool-wheel-emulation',
    type: 'interaction-harness-boundary',
    detectedAt: '7edf76421',
    affectedStoryPrefix: '2026-08-17--standalone-diff-native-wheel',
    summary:
      'Lynxtron DevTool accepts mouseWheel emulation but does not deliver drag or wheel scrolling; real macOS pixel-scroll must be used for Native wheel certification.',
    severityPoints: 0,
    resolvedBy: [],
    resolution:
      'Tracked upstream in lynx-family/lynxtron#151; this remains a harness-only input boundary and does not prove a product scroll regression.',
    resolutionStoryPrefixes: [],
  },
  {
    id: 'native-cgevent-wheel-delivery',
    type: 'native-certification-harness-blocker',
    detectedAt: '0870afbbd',
    affectedStoryPrefix: '2026-08-17--standalone-diff-native-wheel',
    summary:
      'Synthetic CGEvent wheel input produced no bindscroll calls even when the exact-owned HostInputProbe process was frontmost and the cursor was positioned over its simple scroll-view.',
    severityPoints: 0,
    resolvedBy: [],
    resolution:
      'Unresolved harness-only input boundary; use physical hardware wheel evidence or a fixed Lynxtron DevTool wheel path before attributing Native wheel behavior to product code.',
    resolutionStoryPrefixes: [],
  },
];

function parseGlobalAssignment(source) {
  return JSON.parse(
    source
      .replace(/^globalThis\.[A-Z0-9_]+ = /u, '')
      .replace(/;\s*$/u, '')
  );
}

function git(...arguments_) {
  return execFileSync('git', arguments_, {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}

function commitMetadata(commit) {
  const [hash, timestamp, ...subject] = git(
    'show',
    '-s',
    '--format=%H%x09%ad%x09%s',
    '--date=iso-strict',
    commit
  ).split('\t');
  return {
    hash,
    shortHash: hash.slice(0, 9),
    timestamp,
    date: timestamp.slice(0, 10),
    subject: subject.join('\t'),
  };
}

function commitsByDay(firstDay, lastDay) {
  const rows = git(
    'log',
    '--format=%H%x09%ad%x09%s',
    '--date=short',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--reverse'
  )
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [hash, date, ...subject] = row.split('\t');
      return { hash, shortHash: hash.slice(0, 9), date, subject: subject.join('\t') };
    });
  return Map.groupBy(rows, (row) => row.date);
}

function evidenceCommitHistory(firstDay, lastDay) {
  const output = git(
    'log',
    '--reverse',
    '--format=@@%H%x09%ad%x09%s',
    '--date=iso-strict',
    '--name-only',
    '--diff-filter=AM',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--',
    ...days.map((day) => `shots/${day}`)
  );
  const commits = [];
  let current = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) {
      const [hash, timestamp, ...subject] = line.slice(2).split('\t');
      current = {
        hash,
        shortHash: hash.slice(0, 9),
        timestamp,
        date: timestamp.slice(0, 10),
        subject: subject.join('\t'),
        files: [],
      };
      commits.push(current);
    } else if (line && current) {
      current.files.push(line);
    }
  }
  return commits;
}

function firstAddedCommitByFile(firstDay, lastDay) {
  const output = git(
    'log',
    '--reverse',
    '--format=@@%H',
    '--name-only',
    '--diff-filter=A',
    `--since=${firstDay} 00:00:00`,
    `--until=${lastDay} 23:59:59`,
    '--',
    ...days.map((day) => `shots/${day}`)
  );
  const result = new Map();
  let currentHash = null;
  for (const line of output.split('\n')) {
    if (line.startsWith('@@')) currentHash = line.slice(2);
    else if (line && currentHash && !result.has(line)) result.set(line, currentHash);
  }
  return result;
}

function imagesByNormalizedName(story, client) {
  const result = new Map();
  for (const image of story.images.filter((entry) => entry.client === client)) {
    const key = normalizeEvidenceName(image.name);
    const entries = result.get(key) ?? [];
    entries.push(image);
    result.set(key, entries);
  }
  return result;
}

function readEvidenceDeclaration(imagePath) {
  const assertionsPath = resolve(
    repoRoot,
    imagePath.replace(/screenshot\.png$/u, 'assertions.json')
  );
  if (!existsSync(assertionsPath)) return {};
  try {
    const assertions = JSON.parse(readFileSync(assertionsPath, 'utf8'));
    return {
      theme: assertions.theme ?? null,
      snapshotSha256: assertions.snapshotSha256 ?? null,
      viewport: assertions.viewport ?? null,
    };
  } catch {
    return {};
  }
}

async function imageMaePercent(leftPath, rightPath) {
  const [resolvedLeftPath, resolvedRightPath] = await Promise.all([
    resolveImagePath(leftPath),
    resolveImagePath(rightPath),
  ]);
  const left = sharp(resolvedLeftPath).removeAlpha();
  const right = sharp(resolvedRightPath).removeAlpha();
  const [leftMetadata, rightMetadata] = await Promise.all([
    left.metadata(),
    right.metadata(),
  ]);
  const leftRatio = leftMetadata.width / leftMetadata.height;
  if (!isComparableImageGeometry(leftMetadata, rightMetadata)) {
    return { accepted: false, reason: 'aspect-ratio-mismatch' };
  }
  const width = Math.min(leftMetadata.width, rightMetadata.width);
  const height = Math.min(
    leftMetadata.height,
    rightMetadata.height,
    Math.round(width / leftRatio)
  );
  const [leftPixels, rightPixels] = await Promise.all([
    left.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
    right.resize(width, height, { fit: 'fill' }).raw().toBuffer(),
  ]);
  let total = 0;
  let leftLuminanceTotal = 0;
  let rightLuminanceTotal = 0;
  let leftBright = 0;
  let rightBright = 0;
  let leftDark = 0;
  let rightDark = 0;
  const pixelCount = leftPixels.length / 3;
  for (let index = 0; index < leftPixels.length; index += 1) {
    total += Math.abs(leftPixels[index] - rightPixels[index]);
    if (index % 3 === 0) {
      const leftLuminance =
        0.2126 * leftPixels[index] +
        0.7152 * leftPixels[index + 1] +
        0.0722 * leftPixels[index + 2];
      const rightLuminance =
        0.2126 * rightPixels[index] +
        0.7152 * rightPixels[index + 1] +
        0.0722 * rightPixels[index + 2];
      leftLuminanceTotal += leftLuminance;
      rightLuminanceTotal += rightLuminance;
      if (leftLuminance > 220) leftBright += 1;
      if (rightLuminance > 220) rightBright += 1;
      if (leftLuminance < 50) leftDark += 1;
      if (rightLuminance < 50) rightDark += 1;
    }
  }
  const maePercent = (total / leftPixels.length / 255) * 100;
  const leftImageStats = {
    meanLuminance: leftLuminanceTotal / pixelCount,
    brightFraction: leftBright / pixelCount,
    darkFraction: leftDark / pixelCount,
  };
  const rightImageStats = {
    meanLuminance: rightLuminanceTotal / pixelCount,
    brightFraction: rightBright / pixelCount,
    darkFraction: rightDark / pixelCount,
  };
  return {
    accepted: true,
    maePercent,
    parityPercent: Math.max(0, 100 - maePercent),
    qualityBand: visualQualityBand(maePercent),
    leftImageStats,
    rightImageStats,
    renderedLeftTheme: classifyRenderedTheme(leftImageStats),
    renderedRightTheme: classifyRenderedTheme(rightImageStats),
  };
}

async function resolveImagePath(filePath) {
  if (existsSync(filePath)) return filePath;
  const repoPath = filePath
    .slice(repoRoot.length + 1)
    .split('\\')
    .join('/');
  const url = `${archive.assetBaseUrl}/${repoPath}`;
  const extension = repoPath.split('.').at(-1);
  const cacheKey = createHash('sha256').update(url).digest('hex');
  const cachePath = resolve(remoteAssetCache, `${cacheKey}.${extension}`);
  if (!existsSync(cachePath)) {
    let lastError = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        writeFileSync(cachePath, Buffer.from(await response.arrayBuffer()));
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise((resolveDelay) =>
            setTimeout(resolveDelay, 250 * 2 ** attempt)
          );
        }
      }
    }
    if (lastError) throw lastError;
  }
  return cachePath;
}

async function visualSamples(stories, commitIndexByHash, firstCommitByFile) {
  const accepted = [];
  const rejected = [];
  const harness = [];
  for (const story of stories) {
    for (const [leftClient, rightClient] of [
      ['web', 'lynx'],
      ['lynx', 'native'],
    ]) {
      const left = imagesByNormalizedName(story, leftClient);
      const right = imagesByNormalizedName(story, rightClient);
      for (const key of new Set([...left.keys()].filter((name) => right.has(name)))) {
        let leftImages = left.get(key);
        let rightImages = right.get(key);
        const pairOverride = visualPairOverrides.get(
          `${story.id}:${leftClient}:${rightClient}:${key}`
        );
        if (pairOverride) {
          leftImages = story.images.filter(
            (image) =>
              image.client === leftClient &&
              image.repoPath.endsWith(pairOverride.left)
          );
          rightImages = story.images.filter(
            (image) =>
              image.client === rightClient &&
              image.repoPath.endsWith(pairOverride.right)
          );
        }
        const pairCount = Math.min(leftImages.length, rightImages.length);
        for (let index = 0; index < pairCount; index += 1) {
          const pair = {
            storyId: story.id,
            leftClient,
            rightClient,
            left: leftImages[index].repoPath,
            right: rightImages[index].repoPath,
            stateKey: key,
            ...(pairOverride
              ? { pairOverrideReason: pairOverride.reason }
              : {}),
          };
          const leftCommit = resolveEvidenceSourceCommit(
            leftImages[index],
            firstCommitByFile
          );
          const rightCommit = resolveEvidenceSourceCommit(
            rightImages[index],
            firstCommitByFile
          );
          const leftCommitIndex = commitIndexByHash.get(leftCommit);
          const rightCommitIndex = commitIndexByHash.get(rightCommit);
          const activationCommitIndex = Math.max(
            leftCommitIndex ?? 0,
            rightCommitIndex ?? 0
          );
          const result = await imageMaePercent(
            resolve(repoRoot, pair.left),
            resolve(repoRoot, pair.right)
          );
          const leftDeclaration = readEvidenceDeclaration(pair.left);
          const rightDeclaration = readEvidenceDeclaration(pair.right);
          const mismatchReason = captureMismatchReason({
            declaredLeftTheme: leftDeclaration.theme,
            declaredRightTheme: rightDeclaration.theme,
            renderedLeftTheme: result.renderedLeftTheme,
            renderedRightTheme: result.renderedRightTheme,
          });
          const harnessIssue = harnessIssueLedger.find((issue) =>
            visualPairMatchesIssue(pair, issue)
          );
          if (result.accepted && harnessIssue?.excludeVisualPairs === true) {
            harness.push({
              ...pair,
              ...result,
              activationCommitIndex,
              mismatchReason:
                harnessIssue.type === 'capture-theme-mismatch'
                  ? 'capture-theme-mismatch'
                  : 'capture-product-state-mismatch',
              harnessIssueId: harnessIssue.id,
              leftDeclaration,
              rightDeclaration,
            });
            continue;
          }
          if (
            result.accepted &&
            mismatchReason === 'capture-theme-mismatch'
          ) {
            harness.push({
              ...pair,
              ...result,
              activationCommitIndex,
              mismatchReason,
              harnessIssueId: harnessIssue?.id ?? 'auto-rendered-theme-mismatch',
              leftDeclaration,
              rightDeclaration,
            });
            continue;
          }
          if (result.accepted) {
            accepted.push({ ...pair, ...result, activationCommitIndex });
          } else {
            rejected.push({ ...pair, ...result, activationCommitIndex });
          }
        }
      }
    }
  }
  return { accepted, rejected, harness };
}

function storyAssets(story) {
  return [...story.images, ...(story.evidence ?? [])];
}

function completeness(stories, activeAssetPaths = null) {
  let expected = 0;
  let observed = 0;
  for (const story of stories) {
    const clients = new Set(
      story.images
        .filter(
          (image) => !activeAssetPaths || activeAssetPaths.has(image.repoPath)
        )
        .map((image) => image.client)
    );
    const hasEvidence = (story.evidence ?? []).some(
      (entry) => !activeAssetPaths || activeAssetPaths.has(entry.repoPath)
    );
    if (
      ![...clients].some((client) => comparableClients.includes(client)) &&
      (hasEvidence || [...clients].every((client) => client === 'evidence'))
    ) {
      expected += 1;
      observed += 1;
      continue;
    }
    expected += comparableClients.length;
    observed += comparableClients.filter((client) => clients.has(client)).length;
  }
  return expected ? observed / expected : 0;
}

function activeReliabilityEvents(timestamp, ledger) {
  return ledger.filter(
    (entry) =>
      entry.introducedMetadata.timestamp <= timestamp &&
      (!entry.fixedMetadata || entry.fixedMetadata.timestamp > timestamp)
  );
}

const archive = parseGlobalAssignment(readFileSync(archivePath, 'utf8'));
const days = archive.days.map((entry) => entry.day);
const dayCommits = commitsByDay(days[0], days.at(-1));
const ledger = reliabilityLedger.map((entry) => ({
  ...entry,
  introducedMetadata: commitMetadata(entry.introduced),
  fixedMetadata: entry.fixed ? commitMetadata(entry.fixed) : null,
}));
const harnessLedger = harnessIssueLedger.map((entry) => ({
  ...entry,
  detectedMetadata: commitMetadata(entry.detectedAt),
  resolvedMetadata: entry.resolvedBy.map(commitMetadata),
}));
const productSupersessionLedger = productEvidenceSupersessionLedger.map(
  (entry) => ({
    ...entry,
    supersededMetadata: commitMetadata(entry.supersededAt),
  })
);
const remoteEvidenceFilesByCommit = groupEvidenceFilesBySourceCommit(
  archive.stories.flatMap(storyAssets)
);
const evidenceCommits = [
  ...evidenceCommitHistory(days[0], days.at(-1)),
  ...[...remoteEvidenceFilesByCommit].map(([hash, files]) => ({
    ...commitMetadata(hash),
    files,
    remoteEvidenceOnly: true,
  })),
  ...ledger.flatMap((entry) =>
    [entry.introducedMetadata, entry.fixedMetadata]
      .filter(Boolean)
      .map((metadata) => ({ ...metadata, files: [], reliabilityOnly: true }))
  ),
  ...harnessLedger.flatMap((entry) =>
    [entry.detectedMetadata, ...entry.resolvedMetadata].map((metadata) => ({
      ...metadata,
      files: [],
      harnessOnly: true,
    }))
  ),
  ...productSupersessionLedger.map((entry) => ({
    ...entry.supersededMetadata,
    files: [],
    productSupersessionOnly: true,
  })),
]
  .filter(
    (commit, index, commits) =>
      commits.findIndex((candidate) => candidate.hash === commit.hash) === index
  )
  .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
const commitIndexByHash = new Map(
  evidenceCommits.map((commit, index) => [commit.hash, index])
);
const productSupersessionRules = productSupersessionLedger.map((entry) => ({
  ...entry,
  supersededAt: entry.supersededMetadata.hash,
}));
const firstCommitByFile = firstAddedCommitByFile(days[0], days.at(-1));
const allSamples = await visualSamples(
  archive.stories,
  commitIndexByHash,
  firstCommitByFile
);
for (const issue of harnessLedger) {
  const resolutionPairs = allSamples.accepted.filter((pair) =>
    issue.resolutionStoryPrefixes.some((prefix) =>
      pair.storyId.startsWith(prefix)
    )
  );
  issue.resolutionEvidence = {
    pairCount: resolutionPairs.length,
    minimumParityPercent: resolutionPairs.length
      ? Math.min(...resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    medianParityPercent: resolutionPairs.length
      ? median(resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    maximumParityPercent: resolutionPairs.length
      ? Math.max(...resolutionPairs.map((pair) => pair.parityPercent))
      : null,
    pairs: resolutionPairs.map(
      ({
        storyId,
        leftClient,
        rightClient,
        left,
        right,
        stateKey,
        maePercent,
        parityPercent,
        qualityBand,
      }) => ({
        storyId,
        leftClient,
        rightClient,
        left,
        right,
        stateKey,
        maePercent,
        parityPercent,
        qualityBand,
      })
    ),
  };
}
const storyActivationCommitIndex = new Map(
  archive.stories.map((story) => [
    story.id,
    Math.min(
      ...storyAssets(story).map(
        (asset) =>
          resolveEvidenceActivationIndex({
            asset,
            firstCommitByFile,
            commitIndexByHash,
            evidenceCommits,
          })
      )
    ),
  ])
);
const imageActivationCommitIndex = new Map(
  archive.stories.flatMap((story) =>
    story.images.map((image) => [
      image.repoPath,
      resolveEvidenceActivationIndex({
        asset: image,
        firstCommitByFile,
        commitIndexByHash,
        evidenceCommits,
      }),
    ])
  )
);
const evidenceActivationCommitIndex = new Map(
  archive.stories.flatMap((story) =>
    (story.evidence ?? []).map((entry) => [
      entry.repoPath,
      resolveEvidenceActivationIndex({
        asset: entry,
        firstCommitByFile,
        commitIndexByHash,
        evidenceCommits,
      }),
    ])
  )
);
const commitPoints = [];
let bestLoss = Number.POSITIVE_INFINITY;
let previousComponents = null;

for (let commitIndex = 0; commitIndex < evidenceCommits.length; commitIndex += 1) {
  const commit = evidenceCommits[commitIndex];
  const activeStories = archive.stories.filter(
    (story) => storyActivationCommitIndex.get(story.id) <= commitIndex
  );
  const activeAssetPaths = new Set(
    [...imageActivationCommitIndex, ...evidenceActivationCommitIndex]
      .filter(([, activationIndex]) => activationIndex <= commitIndex)
      .map(([file]) => file)
  );
  const historicalAcceptedPairs = allSamples.accepted.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const supersededPairs = historicalAcceptedPairs
    .map((sample) => ({
      sample,
      supersession: visualSampleSupersessionAtCommit(
        sample,
        commitIndex,
        productSupersessionRules,
        commitIndexByHash
      ),
    }))
    .filter(({ supersession }) => supersession !== null)
    .map(({ sample, supersession }) => ({
      ...sample,
      supersessionId: supersession.id,
      supersededAt: supersession.supersededAt,
    }));
  const supersededPairKeys = new Set(
    supersededPairs.map(
      (sample) => `${sample.storyId}:${sample.left}:${sample.right}`
    )
  );
  const acceptedPairs = historicalAcceptedPairs.filter(
    (sample) =>
      !supersededPairKeys.has(
        `${sample.storyId}:${sample.left}:${sample.right}`
      )
  );
  const rejectedPairs = allSamples.rejected.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const harnessPairs = allSamples.harness.filter(
    (sample) => sample.activationCommitIndex <= commitIndex
  );
  const activatedHarnessPairs = allSamples.harness.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const activatedRejectedPairs = allSamples.rejected.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const rollingPairs = acceptedPairs.slice(-visualRollingWindowSize);
  const visual = visualLossFromSamples(
    rollingPairs.map((sample) => sample.maePercent)
  );
  const previousVisual = commitPoints.at(-1)?.visual ?? null;
  const events = activeReliabilityEvents(commit.timestamp, ledger);
  const harnessEvents = harnessLedger.filter(
    (event) =>
      event.detectedMetadata.timestamp <= commit.timestamp &&
      event.resolvedMetadata.every(
        (resolution) => resolution.timestamp > commit.timestamp
      )
  );
  const reliabilityPoints =
    events.reduce(
    (total, event) => total + event.severityPoints,
    0
    ) +
    harnessEvents.reduce(
      (total, event) => total + event.severityPoints,
      0
    );
  const scopeCoverage = activeStories.length / archive.storyCount;
  const clientCompleteness = completeness(activeStories, activeAssetPaths);
  const calculated = calculateFidelityLoss({
    scopeCoverage,
    clientCompleteness,
    visualLoss: visual.loss,
    reliabilityLoss: reliabilityLossFromPoints(reliabilityPoints),
  });
  bestLoss = Math.min(bestLoss, calculated.loss);
  const componentContributions = previousComponents
    ? weightedComponentContributions(
        previousComponents,
        calculated.components,
        FIDELITY_LOSS_WEIGHTS
      )
    : Object.fromEntries(Object.keys(FIDELITY_LOSS_WEIGHTS).map((key) => [key, 0]));
  const lossDelta =
    commitPoints.length > 0
      ? calculated.loss - commitPoints.at(-1).loss
      : 0;
  const addedStoryIds = archive.stories
    .filter((story) => storyActivationCommitIndex.get(story.id) === commitIndex)
    .map((story) => story.id);
  const addedImages = [...imageActivationCommitIndex]
    .filter(([, activationIndex]) => activationIndex === commitIndex)
    .map(([file]) => file);
  const addedEvidence = [...evidenceActivationCommitIndex]
    .filter(([, activationIndex]) => activationIndex === commitIndex)
    .map(([file]) => file);
  const activatedPairs = allSamples.accepted.filter(
    (sample) => sample.activationCommitIndex === commitIndex
  );
  const regressionChanges = ledger.flatMap((event) => {
    if (event.introducedMetadata.hash === commit.hash) {
      return [{ type: 'introduced', id: event.id, summary: event.summary }];
    }
    if (event.fixedMetadata?.hash === commit.hash) {
      return [{ type: 'fixed', id: event.id, summary: event.summary }];
    }
    return [];
  });
  const harnessChanges = harnessLedger.flatMap((event) => {
    if (event.detectedMetadata.hash === commit.hash) {
      return [
        {
          type: 'harness-detected',
          id: event.id,
          summary: event.summary,
        },
      ];
    }
    const resolution = event.resolvedMetadata.find(
      (metadata) => metadata.hash === commit.hash
    );
    if (resolution) {
      return [
        {
          type: 'harness-resolution',
          id: event.id,
          summary: event.resolution,
        },
      ];
    }
    return [];
  });
  const supersessionChanges = productSupersessionLedger
    .filter((event) => event.supersededMetadata.hash === commit.hash)
    .map((event) => ({
      type: 'product-evidence-supersession',
      id: event.id,
      summary: event.resolution,
    }));
  const causes = Object.entries(componentContributions)
    .filter(([, contribution]) => Math.abs(contribution) >= 1e-12)
    .sort((left, right) => Math.abs(right[1]) - Math.abs(left[1]))
    .map(([component, contribution]) => ({
      component,
      contribution,
      direction: contribution > 0 ? 'up' : 'down',
    }));
  commitPoints.push({
    index: commitIndex,
    day: commit.date,
    timestamp: commit.timestamp,
    commit,
    evidenceFileCount: commit.files.length,
    addedStoryIds,
    addedImages,
    addedEvidence,
    activatedPairCount: activatedPairs.length,
    activatedRejectedPairCount: activatedRejectedPairs.length,
    activatedHarnessPairCount: activatedHarnessPairs.length,
    cumulativeAcceptedPairCount: acceptedPairs.length,
    cumulativeRejectedPairCount: rejectedPairs.length,
    rollingPairCount: rollingPairs.length,
    cumulativeStoryCount: activeStories.length,
    scopeCoverage,
    clientCompleteness,
    visual: {
      ...visual,
      rollingWindowSize: visualRollingWindowSize,
      activatedPairs,
      activatedRejectedPairs,
      activatedHarnessPairs,
      supersededPairs,
      previousLoss: previousVisual?.loss ?? null,
      previousMedianPercent: previousVisual?.medianPercent ?? null,
      medianDelta:
        previousVisual?.medianPercent === null ||
        previousVisual?.medianPercent === undefined ||
        visual.medianPercent === null
          ? null
          : visual.medianPercent - previousVisual.medianPercent,
    },
    reliability: {
      loss: reliabilityLossFromPoints(reliabilityPoints),
      activeEvents: events.map(({ introducedMetadata, fixedMetadata, ...event }) => event),
      activeHarnessIssues: harnessEvents.map(
        ({
          detectedMetadata,
          resolvedMetadata,
          resolutionEvidence: _resolutionEvidence,
          ...event
        }) => event
      ),
      points: reliabilityPoints,
    },
    components: calculated.components,
    componentContributions,
    causes,
    regressionChanges: [
      ...regressionChanges,
      ...harnessChanges,
      ...supersessionChanges,
    ],
    lossDelta,
    loss: calculated.loss,
    bestLoss,
  });
  previousComponents = calculated.components;
}
const smoothLosses = exponentialMovingAverage(
  commitPoints.map((point) => point.loss),
  emaAlpha
);
commitPoints.forEach((point, index) => {
  point.smoothLoss = smoothLosses[index];
});
const riseAnalysis = commitPoints
  .filter((point) => point.lossDelta > 0.01)
  .map((point) => ({
    index: point.index,
    timestamp: point.timestamp,
    day: point.day,
    commit: point.commit,
    loss: point.loss,
    lossDelta: point.lossDelta,
    smoothLoss: point.smoothLoss,
    causes: point.causes.filter((cause) => cause.contribution > 0),
    countervailingCauses: point.causes.filter((cause) => cause.contribution < 0),
    addedStoryIds: point.addedStoryIds,
    addedImages: point.addedImages,
    activatedPairCount: point.activatedPairCount,
    regressionChanges: point.regressionChanges,
    explanation: [
      ...point.causes
        .filter((cause) => cause.contribution > 0)
        .map(
          (cause) =>
            `${cause.component} added ${cause.contribution.toFixed(2)} loss points`
        ),
      ...point.regressionChanges
        .filter((change) => change.type === 'introduced')
        .map((change) => `regression introduced: ${change.summary}`),
      point.addedStoryIds.length
        ? `${point.addedStoryIds.length} newly discovered stories changed scope/client expectations`
        : null,
      point.activatedPairCount
        ? `${point.activatedPairCount} visual pairs entered the rolling window`
        : null,
    ].filter(Boolean),
  }));
const dayAnalysis = days.map((day) => {
  const dayPoints = commitPoints.filter((point) => point.day === day);
  const first = dayPoints[0];
  const last = dayPoints.at(-1);
  const previous = commitPoints[first.index - 1] ?? null;
  const openingLoss = previous?.loss ?? first.loss;
  return {
    day,
    firstCommitIndex: first.index,
    lastCommitIndex: last.index,
    commitCount: dayPoints.length,
    openingLoss,
    closingLoss: last.loss,
    netLossDelta: last.loss - openingLoss,
    riseCount: dayPoints.filter((point) => point.lossDelta > 0.01).length,
    fallCount: dayPoints.filter((point) => point.lossDelta < -0.01).length,
    addedStoryCount: dayPoints.reduce(
      (total, point) => total + point.addedStoryIds.length,
      0
    ),
    activatedPairCount: dayPoints.reduce(
      (total, point) => total + point.activatedPairCount,
      0
    ),
    componentContributions: Object.fromEntries(
      Object.keys(FIDELITY_LOSS_WEIGHTS).map((component) => [
        component,
        dayPoints.reduce(
          (total, point) =>
            total + point.componentContributions[component],
          0
        ),
      ])
    ),
    commitIndexes: dayPoints.map((point) => point.index),
  };
});
const points = days.map((day) => {
  const point = [...commitPoints].reverse().find((entry) => entry.day === day);
  const commits = dayCommits.get(day) ?? [];
  return {
    ...point,
    commitCount: commits.length,
    newStoryCount: commitPoints
      .filter((entry) => entry.day === day)
      .reduce((total, entry) => total + entry.addedStoryIds.length, 0),
    visual: {
      ...point.visual,
      acceptedPairCount: point.cumulativeAcceptedPairCount,
      rejectedPairCount: point.cumulativeRejectedPairCount,
      acceptedPairs: allSamples.accepted.filter(
        (sample) =>
          sample.activationCommitIndex <= point.index &&
          visualSampleSupersessionAtCommit(
            sample,
            point.index,
            productSupersessionRules,
            commitIndexByHash
          ) === null
      ),
      rejectedPairs: allSamples.rejected.filter(
        (sample) => sample.activationCommitIndex <= point.index
      ),
    },
  };
});

const result = {
  version: 1,
  generatedFrom: {
    archive: 'screenshot-archive.js',
    firstDay: days[0],
    lastDay: days.at(-1),
    finalStoryCount: archive.storyCount,
    finalImageCount: archive.imageCount,
    evidenceCommitCount: evidenceCommits.length,
  },
  formula: {
    expression:
      '100 × (0.30 × scopeGap + 0.25 × clientGap + 0.35 × visualDistance + 0.10 × reliabilityDebt)',
    weights: FIDELITY_LOSS_WEIGHTS,
    visual:
      'Median current same-state RGB MAE, capped at 10%, shrunk toward 50% loss until 12 accepted pairs exist. Historical product pairs remain recorded but stop contributing after explicitly linked later product evidence supersedes them.',
    comparability:
      'Pairs require normalized state names and matching aspect ratio within 1.5%; high MAE remains scored and is classified as poor or critical parity.',
    scope:
      `Cumulative unique work stories divided by the final known ${archive.storyCount}-story scope; continuous frames count as one story.`,
    completeness:
      'Observed Web/Lynx/Native cells divided by expected cells for discovered stories.',
    reliability:
      'Active, commit-bounded regression severity points divided by the ledger maximum.',
    granularity:
      'Every commit that adds or updates evidence produces a measured point; smoothLoss is an EMA over measured points, not interpolated evidence.',
  },
  smoothing: {
    method: 'exponential-moving-average',
    alpha: emaAlpha,
    source: 'commitPoints.loss',
  },
  reliabilityLedger: ledger,
  harnessIssueLedger: harnessLedger,
  productEvidenceSupersessionLedger: productSupersessionLedger,
  commitPoints,
  riseAnalysis,
  dayAnalysis,
  points,
};

writeFileSync(outputJsonPath, `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(
  outputJsPath,
  `globalThis.__SYNARA_FIDELITY_LOSS__ = ${JSON.stringify(result, null, 2)};\n`
);
console.log(
  `Generated ${commitPoints.length} commit points and ${points.length} daily anchors: ${commitPoints[0].loss.toFixed(2)} → ${commitPoints.at(-1).loss.toFixed(2)}`
);
