import { PDFParse } from "pdf-parse";
import { supabase } from "./supabase.js";
import { logger } from "./logger.js";
import { STORAGE_BUCKET } from "@sheila/shared/constants";

const log = logger.child({ module: "extractText" });

const MAX_TEXT_LENGTH = 20_000;

/**
 * Downloads a file from Supabase storage and extracts text content.
 * PDF files are parsed for text; image files return empty (no OCR yet).
 * Output is capped at 20,000 characters.
 */
export async function extractTextFromStorage(
  storagePath: string,
  mimeType: string,
): Promise<string> {
  // Image files would need OCR (not implemented yet)
  if (mimeType.startsWith("image/")) {
    log.warn({ mimeType }, "Image OCR not implemented, returning empty text");
    return "";
  }

  if (mimeType !== "application/pdf") {
    log.warn({ mimeType }, "Unsupported mime type for text extraction");
    return "";
  }

  const { data: blob, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error || !blob) {
    log.error({ err: error, storagePath }, "Failed to download file for text extraction");
    return "";
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  log.info({ bytes: buffer.length, storagePath }, "File downloaded for extraction");

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    let text = result.text ?? "";
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
      log.info({ original: result.text?.length, capped: MAX_TEXT_LENGTH }, "Text capped at limit");
    }
    log.info({ chars: text.length }, "PDF text extracted");
    return text;
  } finally {
    await parser.destroy();
  }
}
