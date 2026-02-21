import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { supabase } from "./supabase.js";
import { logger } from "./logger.js";
import { STORAGE_BUCKET } from "@sheila/shared/constants";

const log = logger.child({ module: "extractText" });

const MAX_TEXT_LENGTH = 20_000;

/**
 * Downloads a file from Supabase storage and extracts text content.
 * PDF files are parsed for text; image files are processed with Tesseract OCR.
 * Output is capped at 20,000 characters.
 */
export async function extractTextFromStorage(
  storagePath: string,
  mimeType: string,
): Promise<string> {
  if (mimeType.startsWith("image/")) {
    return extractTextFromImage(storagePath);
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

async function extractTextFromImage(storagePath: string): Promise<string> {
  const { data: blob, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .download(storagePath);

  if (error || !blob) {
    log.error({ err: error, storagePath }, "Failed to download image for OCR");
    return "";
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  log.info({ bytes: buffer.length, storagePath }, "Image downloaded for OCR");

  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();

    let text = data.text ?? "";
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
      log.info({ original: data.text?.length, capped: MAX_TEXT_LENGTH }, "OCR text capped at limit");
    }
    log.info({ chars: text.length }, "Image OCR text extracted");
    return text;
  } catch (err) {
    log.warn({ err, storagePath }, "OCR failed, returning empty text");
    return "";
  }
}
