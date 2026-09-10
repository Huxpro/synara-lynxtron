import type { SemanticIconTone as SemanticIconToneName } from '@synara/shared/semanticIconTone';
import { semanticIconToneColor } from '@synara/shared/semanticIconTone';
import { CopyIcon } from '~/lib/icons';

export function SemanticIconTone(props: { readonly tone: SemanticIconToneName }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2" data-icon-tone={props.tone}>
      <span
        className={`flex size-8 items-center justify-center rounded-lg ${
          props.tone === 'inverse'
            ? 'bg-[var(--color-background-button-primary)]'
            : 'bg-[var(--color-background-button-secondary)]'
        }`}
        style={{ color: semanticIconToneColor(props.tone) }}
      >
        <CopyIcon className="size-4" />
      </span>
      <span className="text-[10px] text-muted-foreground">{props.tone}</span>
    </div>
  );
}
