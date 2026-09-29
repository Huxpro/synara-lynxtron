export interface ThreadCreationState {
  created: boolean;
  inFlight: Promise<void> | null;
}

export async function ensureThreadCreated(input: {
  readonly create: () => Promise<void>;
  readonly recover: () => Promise<boolean>;
  readonly state: ThreadCreationState;
}): Promise<void> {
  "background only";
  if (input.state.created) return;
  if (input.state.inFlight) return input.state.inFlight;

  const creation = (async () => {
    try {
      await input.create();
    } catch (error) {
      if (!(await input.recover())) throw error;
    }
    input.state.created = true;
  })().finally(() => {
    input.state.inFlight = null;
  });
  input.state.inFlight = creation;
  return creation;
}

export const ensureLandingThreadCreated = ensureThreadCreated;
export type LandingThreadCreationState = ThreadCreationState;
