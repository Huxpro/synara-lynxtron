export type IntegrationClipboardOutcome =
  | { readonly intent: 'success'; readonly message: string }
  | { readonly intent: 'error'; readonly message: string };

export async function copyIntegrationText(input: {
  readonly value: string;
  readonly successMessage: string;
  readonly writeText: (value: string) => Promise<void>;
}): Promise<IntegrationClipboardOutcome> {
  try {
    await input.writeText(input.value);
    return { intent: 'success', message: input.successMessage };
  } catch (error) {
    return {
      intent: 'error',
      message:
        error instanceof Error && error.message.trim()
          ? `Could not copy: ${error.message.trim()}`
          : 'Could not copy to clipboard.',
    };
  }
}
