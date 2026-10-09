// FILE: SettingsProviderPickerCompositionElements.tsx
// Purpose: Browser elements for the shared Provider picker composition.

import type { ProviderKind } from "@synara/contracts";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import { SETTINGS_RADIUS_CLASS_NAME } from "~/settingsPanelStyles";

import type {
  SettingsProviderPickerItem,
  SettingsProviderPickerMoveDirection,
} from "./SettingsProviderPickerComposition.logic";
import { SettingResetButton } from "./SettingControls";
import { SettingsRow, SettingsSection } from "./SettingsPanelPrimitives";
import { Switch } from "../ui/switch";

function SortableProviderPickerItem(props: {
  readonly item: SettingsProviderPickerItem;
  readonly onHiddenChange: (provider: ProviderKind, hidden: boolean) => void;
}) {
  const sortable = useSortable({ id: props.item.provider });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        `flex items-center justify-between gap-3 ${SETTINGS_RADIUS_CLASS_NAME} border border-[color:var(--color-border)] bg-transparent px-3 py-2.5`,
        sortable.isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          ref={sortable.setActivatorNodeRef}
          className={cn(
            "inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground transition-colors hover:bg-[var(--color-background-elevated-secondary)] hover:text-foreground active:cursor-grabbing",
            SETTINGS_RADIUS_CLASS_NAME,
          )}
          aria-label={`Reorder ${props.item.title}`}
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <CentralIcon name="dot-grid-2x3" className="size-4" />
        </button>
        <span className="min-w-0 text-ui text-foreground">{props.item.title}</span>
      </div>
      <Switch
        checked={!props.item.hidden}
        onCheckedChange={(checked) => props.onHiddenChange(props.item.provider, !Boolean(checked))}
        aria-label={`Show ${props.item.title} in the provider picker`}
      />
    </div>
  );
}

export function SettingsProviderPickerElement(props: {
  readonly sectionTitle: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly changed: boolean;
  readonly items: readonly SettingsProviderPickerItem[];
  readonly onReset: () => void;
  readonly onHiddenChange: (provider: ProviderKind, hidden: boolean) => void;
  readonly onMove: (provider: ProviderKind, direction: SettingsProviderPickerMoveDirection) => void;
  readonly onReorder: (provider: ProviderKind, overProvider: ProviderKind) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    props.onReorder(event.active.id as ProviderKind, event.over.id as ProviderKind);
  };
  return (
    <SettingsSection title={props.sectionTitle}>
      <SettingsRow
        title={props.title}
        description={props.description}
        status={props.status}
        resetAction={
          props.changed ? (
            <SettingResetButton label="provider picker" onClick={props.onReset} />
          ) : null
        }
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={props.items.map((item) => item.provider)}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-4 space-y-2">
              {props.items.map((item) => (
                <SortableProviderPickerItem
                  key={item.provider}
                  item={item}
                  onHiddenChange={props.onHiddenChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </SettingsRow>
    </SettingsSection>
  );
}
