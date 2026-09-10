import { Schema } from 'effect';

export const APP_SNAP_WELCOME_STORAGE_KEY = 'synara:appsnap-welcome:v1';

export const AppSnapWelcomeStorageSchema = Schema.Struct({
  acknowledged: Schema.Boolean,
});

export type AppSnapWelcomeStorage = typeof AppSnapWelcomeStorageSchema.Type;

export const INITIAL_APP_SNAP_WELCOME_STORAGE: AppSnapWelcomeStorage = {
  acknowledged: false,
};

export function readAppSnapWelcomeStorage(raw: string | null): AppSnapWelcomeStorage {
  if (!raw) return INITIAL_APP_SNAP_WELCOME_STORAGE;
  try {
    return Schema.decodeSync(Schema.fromJsonString(AppSnapWelcomeStorageSchema))(raw);
  } catch {
    return INITIAL_APP_SNAP_WELCOME_STORAGE;
  }
}

export function writeAppSnapWelcomeStorage(value: AppSnapWelcomeStorage): string {
  return Schema.encodeSync(Schema.fromJsonString(AppSnapWelcomeStorageSchema))(value);
}
