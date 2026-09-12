import type { ModelSelection } from "@synara/contracts";

export const AUTOMATION_DEFAULT_MODEL_SELECTION: ModelSelection = {
  provider: "codex",
  model: "gpt-5-codex",
};

export interface AutomationTemplate {
  readonly label: string;
  readonly name: string;
  readonly prompt: string;
}

/** Starter prompts surfaced by every renderer's automation composer. */
export const AUTOMATION_TEMPLATES: readonly AutomationTemplate[] = [
  {
    label: "Triage new crashes",
    name: "Triage crashes",
    prompt: "Look for new crashes in $sentry and open a fix PR for the most impactful one.",
  },
  {
    label: "Update dependencies",
    name: "Update dependencies",
    prompt:
      "Check for outdated dependencies, bump the safe minor and patch versions, then run the tests.",
  },
  {
    label: "Daily standup summary",
    name: "Daily summary",
    prompt:
      "Summarize what changed on the main branch in the last 24 hours as a short standup update.",
  },
];
