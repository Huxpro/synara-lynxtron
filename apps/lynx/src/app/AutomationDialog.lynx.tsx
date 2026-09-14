import type {
  AutomationCreateInput,
  AutomationDefinition,
  AutomationUpdateInput,
} from '@synara/contracts';

import { AutomationCreateDialog } from './AutomationCreateDialog.lynx';
import { AutomationEditDialog } from './AutomationEditDialog.lynx';
import type { ProjectSummary, ThreadSummary } from './queries';

type AutomationDialogSharedProps = {
  readonly error: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly pending: boolean;
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
};

type AutomationDialogProps =
  | (AutomationDialogSharedProps & {
      readonly variant: 'create';
      readonly onCreate: (input: AutomationCreateInput) => void;
    })
  | (AutomationDialogSharedProps & {
      readonly variant: 'edit';
      readonly definition: AutomationDefinition;
      readonly onSave: (input: AutomationUpdateInput) => void;
    });

/** One production identity for the shared Create/Edit automation composer. */
export function AutomationDialog(props: AutomationDialogProps) {
  if (props.variant === 'edit') {
    return (
      <AutomationEditDialog
        definition={props.definition}
        projects={props.projects}
        threads={props.threads}
        open={props.open}
        pending={props.pending}
        error={props.error}
        onOpenChange={props.onOpenChange}
        onSave={props.onSave}
      />
    );
  }
  return (
    <AutomationCreateDialog
      projects={props.projects}
      threads={props.threads}
      open={props.open}
      pending={props.pending}
      error={props.error}
      onOpenChange={props.onOpenChange}
      onCreate={props.onCreate}
    />
  );
}
