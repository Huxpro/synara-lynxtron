import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx transcript text selection', () => {
  it('enables native selection on block text without flattening nested markdown', () => {
    const markdownSource = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );
    const transcriptSource = readFileSync(
      new URL('../../app/Transcript.tsx', import.meta.url),
      'utf8'
    );

    expect(markdownSource).toContain('text-selection={props.context.selectable}');
    expect(markdownSource).toContain('custom-context-menu={selectionEnabled}');
    expect(markdownSource).toContain('flatten={false}');
    expect(markdownSource).toContain('bindselectionchange={');
    expect(markdownSource).toContain("method: 'getSelectedText'");
    expect(markdownSource).toContain("method: 'getTextBoundingRect'");
    expect(markdownSource).toContain(
      'className="MdParagraph"\n          context={context}'
    );
    expect(transcriptSource).toContain('<ChatMarkdown\n              cwd={workspaceRoot}\n              selectable');
    expect(transcriptSource).toContain(
      'onOpenFileReference={onOpenFileReference}\n                onTextSelection={setTextSelection}\n                selectable'
    );
    expect(transcriptSource).toContain('<TranscriptSelectionAction');
    expect(transcriptSource).toContain("type: 'thread.marker.add'");
  });
});
