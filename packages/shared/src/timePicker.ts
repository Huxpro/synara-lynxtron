export const TIME_PICKER_HOURS = Array.from({ length: 24 }, (_, index) => index);
export const TIME_PICKER_MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function formatTimePickerPart(value: number): string {
  return value.toString().padStart(2, "0");
}

export function parseTimePickerValue(value: string): { readonly hour: number; readonly minute: number } {
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number.parseInt(rawHour ?? "", 10);
  const minute = Number.parseInt(rawMinute ?? "", 10);
  return {
    hour: Number.isNaN(hour) ? 0 : Math.min(23, Math.max(0, hour)),
    minute: Number.isNaN(minute) ? 0 : Math.min(59, Math.max(0, minute)),
  };
}
