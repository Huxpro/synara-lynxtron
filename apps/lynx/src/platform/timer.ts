export async function sleepOnHost(milliseconds: number): Promise<void> {
  "background only";
  const { bridgeCall } = await import(/* webpackMode: "eager" */ "./bridge");
  await bridgeCall("timerSleep", { milliseconds });
}
