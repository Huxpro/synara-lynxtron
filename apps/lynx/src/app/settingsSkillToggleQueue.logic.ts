// FILE: app/settingsSkillToggleQueue.logic.ts
// Purpose: Skill toggles as pending intents over the confirmed server setting.
//   The panel shows `confirmed + intents`; each queued write is derived from
//   the setting confirmed at the moment it runs, so an earlier confirmation
//   (its own response, or a push from another client) can never drop a later
//   choice, and a failed write rolls back to confirmed server state.
// Layer: L3 orchestration logic (thread-neutral, no ports).

import { nextDisabledSkillNames, settingsSkillNameKey } from "./settingsSkills.logic";

export interface SkillToggleIntent {
  readonly id: number;
  readonly skillName: string;
  readonly enabled: boolean;
}

export interface SkillToggleQueueState {
  /** Toggles the server has not confirmed yet, oldest first. */
  readonly intents: readonly SkillToggleIntent[];
  /** Key of the most recent unconfirmed toggle, for the row's saving mark. */
  readonly savingSkillKey: string | null;
  readonly error: string | null;
}

export const EMPTY_SKILL_TOGGLE_QUEUE_STATE: SkillToggleQueueState = {
  intents: [],
  savingSkillKey: null,
  error: null,
};

/** The disabled list to show or send: confirmed server state with the intents applied in order. */
export function projectDisabledSkillNames(
  confirmed: readonly string[],
  intents: readonly Pick<SkillToggleIntent, "skillName" | "enabled">[],
): readonly string[] {
  let current = confirmed;
  for (const intent of intents) {
    current = nextDisabledSkillNames({
      current,
      skillName: intent.skillName,
      enabled: intent.enabled,
    });
  }
  return current;
}

export interface SkillToggleQueue {
  /** Queues one toggle; resolves when its write has settled (never rejects). */
  readonly toggle: (skillName: string, enabled: boolean) => Promise<void>;
}

export function createSkillToggleQueue(deps: {
  /** The disabled list the server last confirmed (the settings query cache). */
  readonly readConfirmed: () => readonly string[];
  /** Persists the full list; must publish the confirmed view before resolving. */
  readonly write: (disabled: readonly string[]) => Promise<unknown>;
  readonly onState: (state: SkillToggleQueueState) => void;
  /** Runs after each confirmed write (dependent cache invalidation). */
  readonly afterSaved?: () => Promise<unknown>;
}): SkillToggleQueue {
  let state = EMPTY_SKILL_TOGGLE_QUEUE_STATE;
  let nextId = 1;
  let tail: Promise<void> = Promise.resolve();

  const publish = (next: SkillToggleQueueState) => {
    state = next;
    deps.onState(next);
  };
  const settle = (intent: SkillToggleIntent, error: string | null) => {
    const intents = state.intents.filter((entry) => entry.id !== intent.id);
    const latest = intents[intents.length - 1];
    publish({
      intents,
      savingSkillKey: latest ? settingsSkillNameKey(latest.skillName) : null,
      error: error ?? state.error,
    });
  };

  return {
    toggle(skillName, enabled) {
      const intent: SkillToggleIntent = { id: nextId, skillName, enabled };
      nextId += 1;
      publish({
        intents: [...state.intents, intent],
        savingSkillKey: settingsSkillNameKey(skillName),
        error: null,
      });
      tail = tail.then(async () => {
        try {
          // Derived now, not when the toggle was made: every earlier write has
          // settled, so the confirmed list already holds (or dropped) its result.
          await deps.write(projectDisabledSkillNames(deps.readConfirmed(), [intent]));
        } catch (error) {
          settle(intent, error instanceof Error ? error.message : "Unable to update this skill.");
          return;
        }
        settle(intent, null);
        await deps.afterSaved?.().catch(() => undefined);
      });
      return tail;
    },
  };
}
