import type { Job } from "bullmq";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { extractTextFromStorage } from "../lib/extractText.js";
import { classifyDocument, extractFields } from "../lib/llm.js";
import { EXTRACTION_SCHEMAS, validateDocument } from "@sheila/doc-rules";
import { recomputeCaseStatus } from "../lib/status.js";
import type { DocumentStatus } from "@sheila/shared/types";

export interface ProcessDocumentData {
  documentId: string;
  caseId: string;
}

async function setDocStatus(
  documentId: string,
  status: DocumentStatus,
): Promise<void> {
  await supabase.from("documents").update({ status }).eq("id", documentId);
}

export async function processDocument(
  job: Job<ProcessDocumentData>,
): Promise<void> {
  const { documentId, caseId } = job.data;
  const log = logger.child({ job: job.name, documentId, caseId });

  log.info("Starting document processing");
  await setDocStatus(documentId, "Processing");

  // 1. Fetch document record
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    log.error({ err: docError }, "Document record not found");
    await setDocStatus(documentId, "Failed");
    throw new Error(`Document ${documentId} not found`);
  }

  // 2. Extract text directly from storage
  const text = await extractTextFromStorage(doc.storage_path, doc.mime_type);

  if (!text || text.trim().length === 0) {
    log.warn("No text extracted from document, marking as Reviewed with no fields");
    await setDocStatus(documentId, "Reviewed");
    await recomputeCaseStatus(caseId);
    return;
  }

  log.info({ textLength: text.length }, "Text extracted");

  // 3. Classify document
  const classification = await classifyDocument(text, doc.file_name);
  log.info(
    { type: classification.document_type, confidence: classification.confidence },
    "Document classified",
  );

  // 4. Extract fields if we have a schema for this slot
  const slotKey = doc.slot_key;
  const schema = EXTRACTION_SCHEMAS[slotKey];

  let extractedFields: Record<string, unknown> | null = null;
  let fieldConfidence: Record<string, number> = {};
  let extractionErrors: string[] = [];

  if (schema) {
    const result = await extractFields(text, slotKey, schema);
    extractedFields = result.fields as Record<string, unknown> | null;
    fieldConfidence = result.fieldConfidence;
    extractionErrors = result.errors;

    if (extractedFields) {
      log.info({ slotKey, fields: extractedFields }, "Fields extracted and validated");
    } else {
      log.warn({ slotKey, errors: extractionErrors }, "Field extraction failed validation");
    }
  } else {
    log.info({ slotKey }, "No extraction schema for this slot, skipping field extraction");
  }

  // 5. Save extraction to extractions table
  if (extractedFields || extractionErrors.length > 0) {
    const { error: extractionInsertError } = await supabase
      .from("extractions")
      .upsert(
        {
          document_id: documentId,
          case_id: caseId,
          slot_key: slotKey,
          classification: classification.document_type,
          classification_confidence: classification.confidence,
          classification_reasons: classification.reasons,
          fields: extractedFields,
          field_confidence: fieldConfidence,
          errors: extractionErrors,
        },
        { onConflict: "document_id" },
      );

    if (extractionInsertError) {
      log.error({ err: extractionInsertError }, "Failed to save extraction");
    } else {
      log.info("Extraction saved");
    }
  }

  // 6. Validate extracted fields and create flags
  const flags: Array<{ code: string; field: string; message: string; severity: string }> = [];

  if (extractedFields) {
    const validationFlags = validateDocument(extractedFields, slotKey);
    flags.push(...validationFlags);
  }

  // Add flags for extraction errors
  for (const err of extractionErrors) {
    flags.push({
      code: "EXTRACTION_ERROR",
      field: "extraction",
      message: err,
      severity: "Review",
    });
  }

  // 7. Delete existing flags for this document (idempotent re-processing)
  const { error: deleteError } = await supabase
    .from("flags")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    log.error({ err: deleteError }, "Failed to delete existing flags");
  }

  // 8. Insert new flags
  if (flags.length > 0) {
    const flagRows = flags.map((f) => ({
      case_id: caseId,
      document_id: documentId,
      code: f.code,
      field: f.field,
      message: f.message,
      severity: f.severity,
      is_resolved: false,
    }));

    const { error: flagError } = await supabase.from("flags").insert(flagRows);

    if (flagError) {
      log.error({ err: flagError }, "Failed to insert flags");
    } else {
      log.info({ count: flags.length }, "Flags created");
    }
  }

  // 9. Set final document status
  const hasBlockers = flags.some((f) => f.severity === "PotentialBlocker");
  const finalStatus: DocumentStatus = hasBlockers ? "Flagged" : "Reviewed";
  await setDocStatus(documentId, finalStatus);

  // 10. Recompute case status
  await recomputeCaseStatus(caseId);

  log.info({ finalStatus, flagCount: flags.length }, "Document processing complete");
}
