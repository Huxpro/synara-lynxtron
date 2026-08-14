import { readFileSync } from 'node:fs';

describe('Lynx transcript appearance settings', () => {
  const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const routerSource = readFileSync(
    new URL('./router.tsx', import.meta.url),
    'utf8'
  );
  const settingsSource = readFileSync(
    new URL('./SettingsPage.tsx', import.meta.url),
    'utf8'
  );
  const transcriptSource = readFileSync(
    new URL('./Transcript.tsx', import.meta.url),
    'utf8'
  );

  it('owns the complete appearance projection at the app boundary', () => {
    expect(appSource).toContain(
      'const [appearance, setAppearance] = useState<SettingsAppearanceValues>'
    );
    expect(appSource).toContain('appearance: readSettingsAppearanceProjection(');
    expect(appSource).toContain('appearance={appearance}');
    expect(appSource).toContain('onAppearanceChange={setAppearance}');
  });

  it('publishes hydrated, reset, and edited appearance values to runtime consumers', () => {
    expect(settingsSource).toContain('onAppearanceChange(value.appearance);');
    expect(settingsSource).toContain(
      'onAppearanceChange(DEFAULT_SETTINGS_APPEARANCE_VALUES);'
    );
    expect(settingsSource).toContain('onAppearanceChange(next);');
  });

  it('passes the configured chat font size through the thread transcript', () => {
    expect(routerSource).toContain(
      'chatFontSizePx={appearance.chatFontSizePx}'
    );
    expect(transcriptSource).toContain(
      'getChatTranscriptUserMessageTextStyle('
    );
    expect(transcriptSource).toContain('getChatTranscriptTextStyle(');
    expect(transcriptSource).toContain(
      'estimateTranscriptRowMainAxisSize('
    );
    expect(transcriptSource).toContain('chatFontSizePx');
  });
});
