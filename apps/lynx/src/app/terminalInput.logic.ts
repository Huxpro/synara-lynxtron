const TERMINAL_DELETE = '\u007f';

export function terminalCommittedInputDelta(
  previousValue: string,
  nextValue: string
): string {
  const previous = Array.from(previousValue);
  const next = Array.from(nextValue);
  let prefixLength = 0;
  while (
    prefixLength < previous.length &&
    prefixLength < next.length &&
    previous[prefixLength] === next[prefixLength]
  ) {
    prefixLength += 1;
  }
  return (
    TERMINAL_DELETE.repeat(previous.length - prefixLength) +
    next.slice(prefixLength).join('')
  );
}
