import { appendFileSync } from "node:fs";

export async function openUpdateDownload(input: {
  readonly capturePath: string | null;
  readonly openExternal: (url: string) => Promise<void>;
  readonly url: string;
}): Promise<void> {
  if (input.capturePath) {
    appendFileSync(input.capturePath, `${JSON.stringify({ url: input.url })}\n`, "utf8");
    return;
  }
  await input.openExternal(input.url);
}
