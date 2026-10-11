// Draft copies share host capabilities. A send keeps its own lease after the
// outgoing content leaves the store; the last draft/send releases the host token.
const sending = new Map<string, number>();
export function retainComposerAttachmentSend(tokens: ReadonlyArray<string>): () => void {
  const unique = [...new Set(tokens)];
  for (const token of unique) sending.set(token, (sending.get(token) ?? 0) + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    for (const token of unique) {
      const remaining = (sending.get(token) ?? 1) - 1;
      if (remaining > 0) sending.set(token, remaining);
      else sending.delete(token);
    }
  };
}
export function composerAttachmentSendOwns(token: string): boolean {
  return sending.has(token);
}
