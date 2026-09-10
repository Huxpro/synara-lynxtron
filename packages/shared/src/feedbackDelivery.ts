export const DEFAULT_FEEDBACK_ENDPOINT =
  'https://www.trysynara.com/api/feedback';
export const FEEDBACK_REQUEST_TIMEOUT_MS = 20_000;

export async function submitFeedbackPayload(
  submission: unknown,
  options: {
    readonly endpoint?: string;
    readonly fetchImplementation?: typeof fetch;
  } = {}
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    FEEDBACK_REQUEST_TIMEOUT_MS
  );
  try {
    const response = await (options.fetchImplementation ?? fetch)(
      options.endpoint ?? DEFAULT_FEEDBACK_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-synara-feedback': '1',
        },
        body: JSON.stringify(submission),
        signal: controller.signal,
      }
    );
    if (response.ok) return;

    const payload = (await response.json().catch(() => null)) as {
      error?: unknown;
    } | null;
    const message =
      typeof payload?.error === 'string' ? payload.error.trim() : '';
    throw new Error(
      message || `Feedback could not be sent (${response.status}).`
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Feedback delivery timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
