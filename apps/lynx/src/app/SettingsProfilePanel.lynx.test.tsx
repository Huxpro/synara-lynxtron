import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  heatmapColumns,
  heatmapMonthLabels,
  normalizeProfileHandle,
} from './SettingsProfilePanel.lynx';

describe('Settings Profile fidelity', () => {
  it('aligns heatmap cells to weekday slots and month labels to week columns', () => {
    const cells = [
      { day: '2026-01-07', count: 0, weekday: 3, intensity: 0 },
      { day: '2026-01-08', count: 0, weekday: 4, intensity: 0 },
      { day: '2026-01-09', count: 0, weekday: 5, intensity: 0 },
      { day: '2026-01-10', count: 0, weekday: 6, intensity: 0 },
      { day: '2026-01-11', count: 0, weekday: 0, intensity: 0 },
    ] as const;

    const columns = heatmapColumns(cells);

    expect(columns).toHaveLength(2);
    expect(columns[0]?.slice(0, 3).map((slot) => slot.kind)).toEqual([
      'pad',
      'pad',
      'pad',
    ]);
    expect(
      columns[0]
        ?.filter(
          (
            slot
          ): slot is Extract<
            NonNullable<(typeof columns)[number]>[number],
            { readonly kind: 'cell' }
          > => slot.kind === 'cell'
        )
        .map((slot) => slot.cell.day)
    ).toEqual(['2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10']);
    expect(heatmapMonthLabels(columns)).toEqual(['Jan', '']);
  });

  it('routes the real Profile section and fetches canonical local stats', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const profileSource = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'profile',");
    expect(settingsSource).toContain("section === 'profile'");
    expect(settingsSource).toContain('<SettingsProfilePanel />');
    expect(settingsSource).toContain("section !== 'profile'");
    expect(settingsSource).toContain('SettingsContentInner--profile');
    expect(clientSource).toContain("'stats.getProfileStats'");
    expect(clientSource).toContain("'stats.getProfileTokenStats'");
    expect(profileSource).toContain('selectProfileHeatmap');
    expect(profileSource).toContain('selectProfileModelUsage');
    expect(profileSource).toContain('selectProfileTopProvider');
    expect(profileSource).toContain('function formatCompact');
    expect(profileSource).not.toContain('Intl.');
    expect(profileSource).toContain('SettingsProfileStats');
    expect(profileSource).not.toContain('Copy summary');
    expect(profileSource).toContain('className="SettingsProfileShareAction"');
    expect(profileSource).toContain('className="SettingsProfileEditAction"');
    expect(profileSource).toContain('SettingsProfileHeatmap');
    expect(profileSource).toContain('Activity insights');
    expect(profileSource).toContain('Most used plugins');
    expect(profileSource).toContain('Model usage');
    expect(profileSource).toContain(
      "import { SettingsHeadingElement } from '../adapters/SettingsHeadingElement.lynx';"
    );
    expect(profileSource).toContain(
      '<SettingsHeadingElement className="SettingsProfileName">'
    );
    expect(profileSource.match(/<SettingsHeadingElement className="SettingsProfileSectionTitle">/g))
      .toHaveLength(4);
    expect(profileSource).toContain(
      'accessibility-label={`${props.label}: ${props.value}`}'
    );
    expect(
      profileSource.match(/accessibility-traits="text"/g)
    ).toHaveLength(4);
    expect(profileSource).toContain(
      'accessibility-label={`${skill.displayName}: ${formatNumber(skill.runCount)} runs`}'
    );
    expect(profileSource).toContain(
      'accessibility-label={`${entry.model}: ${entry.percent}%`}'
    );
    expect(profileSource).toMatch(
      /className="SettingsProfileEditError"[\s\S]{0,120}accessibility-role="alert"/
    );
    expect(profileSource).toContain(
      "readonly intent: 'success' | 'neutral' | 'error';"
    );
    expect(profileSource).toContain(
      "shareStatus.intent === 'error' ? 'alert' : undefined"
    );
    expect(profileSource).toContain(
      "intent: path ? 'success' : 'neutral'"
    );
  });

  it('implements the canonical local Edit profile contract', () => {
    const profileSource = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./settings-profile-panel.css', import.meta.url),
      'utf8'
    );
    const dialogSource = readFileSync(
      new URL('../platform/dialogs.ts', import.meta.url),
      'utf8'
    );
    const desktopHostSource = readFileSync(
      new URL('../main/desktop/hostServices.ts', import.meta.url),
      'utf8'
    );
    const webHostSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );

    expect(normalizeProfileHandle(' @@hello world ')).toBe('@helloworld');
    expect(normalizeProfileHandle('   ')).toBe('');
    expect(profileSource).toContain("'synara:profile:name:v1'");
    expect(profileSource).toContain("'synara:profile:handle:v1'");
    expect(profileSource).toContain("'synara:profile:avatarColor:v1'");
    expect(profileSource).toContain("'synara:profile:avatarImage:v1'");
    expect(profileSource).toContain('className="SettingsProfileEditAction"');
    expect(profileSource).toContain('className="SettingsProfileEditDialog"');
    expect(profileSource).toContain('<ProfileColorOption');
    expect(profileSource).toContain('dialogs.pickProfileImage()');
    expect(profileSource).toContain('mode="aspectFill"');
    expect(profileSource).toMatch(
      /className="SettingsProfileAvatarImage"[\s\S]{0,160}accessibility-element=\{false\}/
    );
    expect(profileSource).toMatch(
      /className="SettingsProfileEditAvatarImage"[\s\S]{0,160}accessibility-element=\{false\}/
    );
    expect(profileSource).toContain(
      "import pencilSvg from '@synara-central-icons/pencil.svg?raw';"
    );
    expect(dialogSource).toContain('pickProfileImage: () =>');
    expect(desktopHostSource).toContain("case 'dialogsPickProfileImage':");
    expect(desktopHostSource).toContain('nativeImage.createFromPath(filePath)');
    expect(desktopHostSource).toContain('image.resize({');
    expect(webHostSource).toContain("method === 'dialogsPickProfileImage'");
    expect(styles).toMatch(
      /\.LxDialogPopup\.SettingsProfileEditDialog\s*\{[^}]*width:\s*500px;[^}]*border-radius:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileEditAvatar\s*\{[^}]*width:\s*80px;[^}]*height:\s*80px;[^}]*border-radius:\s*40px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileColorOption\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileEditFooterButton\s*\{[^}]*height:\s*44px;[^}]*border-radius:\s*8px;/s
    );
  });

  it('implements a real cross-platform Profile Share export kernel', () => {
    const profileSource = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const shareSource = readFileSync(
      new URL('./profileShareCard.lynx.ts', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./settings-profile-panel.css', import.meta.url),
      'utf8'
    );
    const clipboardSource = readFileSync(
      new URL('../platform/clipboard.ts', import.meta.url),
      'utf8'
    );
    const dialogsSource = readFileSync(
      new URL('../platform/dialogs.ts', import.meta.url),
      'utf8'
    );
    const desktopHostSource = readFileSync(
      new URL('../main/desktop/hostServices.ts', import.meta.url),
      'utf8'
    );
    const desktopMainSource = readFileSync(
      new URL('../main/desktop/main.ts', import.meta.url),
      'utf8'
    );
    const webHostSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );

    expect(shareSource).toContain('PROFILE_SHARE_CARD_WIDTH = 860');
    expect(shareSource).toContain('PROFILE_SHARE_CARD_HEIGHT = 440');
    expect(shareSource).toContain('createProfileShareCardSvg');
    expect(shareSource).toContain('selectProfileHeatmap');
    expect(profileSource).toContain(
      "import shareSvg from '@synara-central-icons/share-os.svg?raw';"
    );
    expect(profileSource).toContain('className="SettingsProfileShareDialog"');
    expect(profileSource).toContain('exportProfileShareCard({ svg: shareCardSvg })');
    expect(profileSource).toContain('dialogs.saveProfileShareCard({');
    expect(profileSource).toContain("platformWindow.openExternal(urls[target])");
    expect(clipboardSource).toContain("bridgeCall('profileShareExport'");
    expect(dialogsSource).toContain("'dialogsSaveProfileShareCard'");
    expect(desktopHostSource).toContain("await import('sharp')");
    expect(desktopHostSource).toContain('.png()');
    expect(desktopHostSource).toContain('clipboard.writeImage(image)');
    expect(desktopHostSource).toContain('fs.writeFileSync(filePath, png)');
    expect(desktopMainSource).toContain(
      "callback.sendReply(await handleClipboard(name, data))"
    );
    expect(webHostSource).toContain('renderSvgToPngBlob');
    expect(webHostSource).toContain("new ClipboardItem({ 'image/png': blob })");
    expect(styles).toMatch(
      /\.LxDialogPopup\.SettingsProfileShareDialog\s*\{[^}]*width:\s*560px;[^}]*border-radius:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileSharePreview\s*\{[^}]*width:\s*100%;[^}]*height:\s*246px;[^}]*border-radius:\s*16px;/s
    );
  });

  it('matches the Web first-screen profile anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-profile-panel.css', import.meta.url),
      'utf8'
    );
    const source = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const usageIconSource = readFileSync(
      new URL('./ProfileUsageKindIcon.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsProfile\s*\{[^}]*width:\s*100%;[^}]*gap:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileActions\s*\{[^}]*height:\s*28px;[^}]*justify-content:\s*flex-end;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileAvatar\s*\{[^}]*width:\s*64px;[^}]*height:\s*64px;[^}]*border-radius:\s*32px;/s
    );
    expect(source).toContain('className="SettingsProfileIdentityCopy"');
    expect(styles).toMatch(
      /\.SettingsProfileIdentityCopy\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileAvatarText\s*\{[^}]*font-size:\s*20px;[^}]*line-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileName\s*\{[^}]*font-size:\s*24px;[^}]*line-height:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStats\s*\{[^}]*border-radius:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStat\s*\{[^}]*width:\s*50%;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SettingsProfileStat\s*\{[^}]*width:\s*33\.3333%;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-lg-up \.SettingsProfileStat\s*\{[^}]*width:\s*20%;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStatValue,\s*\.SettingsProfileStatLabel\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmap\s*\{[^}]*height:\s*136\.5px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapGrid\s*\{[^}]*height:\s*123\.5px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapCell\s*\{[^}]*border-radius:\s*5px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapMonths\s*\{[^}]*height:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapMonth\s*\{[^}]*font-size:\s*10px;[^}]*line-height:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapCell--pad\s*\{[^}]*background-color:\s*transparent;[^}]*opacity:\s*1;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileColumns\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-md-up \.SettingsProfileColumns\s*\{[^}]*flex-direction:\s*row;[^}]*gap:\s*48px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileModel\s*\{[^}]*width:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SettingsProfileModel\s*\{[^}]*width:\s*calc\(\(100% - 48px\) \/ 2\);/s
    );
    expect(source).toContain('<ProfileProviderIcon provider={entry.provider} />');
    expect(source).toContain('hasLynxProviderIcon(props.provider)');
    expect(styles).toMatch(
      /\.SettingsProfileModelIdentity\s*\{[^}]*flex:\s*1;[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileModelIdentity \.OpenAIProviderIcon,\s*\.SettingsProfileProviderFallback\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(source).toContain('<ProfileUsageKindIcon kind={skill.kind} />');
    expect(source).not.toContain("skill.kind === 'agent' ? 'A' : 'S'");
    expect(usageIconSource).toContain(
      "import agentSvg from '@synara-central-icons/agent.svg?raw';"
    );
    expect(usageIconSource).toContain(
      "import buildingBlocksSvg from '@synara-central-icons/building-blocks.svg?raw';"
    );
    expect(styles).toMatch(
      /\.SettingsProfilePluginGlyph\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
  });
});
