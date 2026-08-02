export interface LandingThreadCreationState {
  created: boolean;
  inFlight: Promise<void> | null;
}

export async function ensureLandingThreadCreated(input: {
  readonly create: () => Promise<void>;
  readonly recover: () => Promise<boolean>;
  readonly state: LandingThreadCreationState;
}): Promise<void> {
  'background only';
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
