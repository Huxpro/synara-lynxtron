const MIME_TYPE_LABEL_BY_TYPE: Readonly<Record<string, string>> = {
  "application/gzip": "GZ",
  "application/json": "JSON",
  "application/msword": "DOC",
  "application/pdf": "PDF",
  "application/rtf": "RTF",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.ms-word": "DOC",
  "application/vnd.oasis.opendocument.presentation": "ODP",
  "application/vnd.oasis.opendocument.spreadsheet": "ODS",
  "application/vnd.oasis.opendocument.text": "ODT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/x-7z-compressed": "7Z",
  "application/x-tar": "TAR",
  "application/xml": "XML",
  "application/zip": "ZIP",
  "audio/mpeg": "MP3",
  "image/jpeg": "JPG",
  "text/calendar": "ICS",
  "text/csv": "CSV",
  "text/html": "HTML",
  "text/markdown": "MD",
  "text/plain": "TXT",
  "text/tab-separated-values": "TSV",
  "text/xml": "XML",
};

function basename(value: string): string {
  return value.replace(/\\/g, "/").split("/").filter(Boolean).at(-1) ?? value;
}

export function fileAttachmentTypeLabel(file: {
  readonly mimeType: string;
  readonly name: string;
}): string {
  const fileName = basename(file.name).trim();
  const extensionStart = fileName.startsWith(".") ? -1 : fileName.indexOf(".");
  if (extensionStart > 0 && extensionStart < fileName.length - 1) {
    const compoundExtension = fileName.slice(extensionStart + 1).toUpperCase();
    if (compoundExtension.length <= 12) return compoundExtension;
    const finalExtension = compoundExtension.split(".").pop();
    if (finalExtension) return finalExtension;
  }

  const mimeType = file.mimeType.trim().toLowerCase();
  const mappedMimeType = MIME_TYPE_LABEL_BY_TYPE[mimeType];
  if (mappedMimeType) return mappedMimeType;

  const mimeSubtype = mimeType.split("/")[1]?.trim();
  if (mimeSubtype && mimeSubtype !== "octet-stream") {
    const fallback = mimeSubtype
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .toUpperCase();
    if (fallback.length > 0 && fallback.length <= 12) return fallback;
  }

  return "FILE";
}
