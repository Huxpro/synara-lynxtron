export const PROVIDER_SEND_TURN_MAX_ATTACHMENTS = 8;
export const PROVIDER_SEND_TURN_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
// Raw local images may exceed the provider-safe payload limit when they can be
// normalized on-device before upload (for example Retina PNG screenshots).
export const PROVIDER_SEND_TURN_MAX_IMAGE_IMPORT_BYTES = 32 * 1024 * 1024;
export const PROVIDER_SEND_TURN_MAX_FILE_BYTES = 25 * 1024 * 1024;
