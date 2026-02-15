import type { Job } from "bullmq";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { STORAGE_BUCKET, EXPORTS_BUCKET } from "@sheila/shared/constants";

export interface ExportZipData {
  caseId: string;
  exportId: string;
}

// Category to numbered folder mapping
const CATEGORY_FOLDERS: Record<string, string> = {
  identity: "01_Identity",
  employment: "02_Employment",
  education: "03_Education",
  english: "04_English",
  sponsor: "05_Sponsor",
  other: "06_Other",
};

function folderForCategory(category: string): string {
  const lower = category.toLowerCase();
  return CATEGORY_FOLDERS[lower] ?? `06_Other`;
}

async function collectBufferFromStream(
  stream: PassThrough,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function exportZip(job: Job<ExportZipData>): Promise<void> {
  const { caseId, exportId } = job.data;
  const log = logger.child({ job: job.name, caseId, exportId });

  log.info("Starting export");

  // Mark as Processing
  await supabase
    .from("exports")
    .update({ status: "Processing" })
    .eq("id", exportId);

  try {
    // 1. Load case
    const { data: caseRow, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRow) {
      throw new Error(`Case ${caseId} not found`);
    }

    // 2. Load all documents for this case
    const { data: documents, error: docsError } = await supabase
      .from("documents")
      .select("*")
      .eq("case_id", caseId)
      .order("category", { ascending: true });

    if (docsError) {
      throw new Error(`Failed to load documents: ${docsError.message}`);
    }

    // 3. Load all flags for this case
    const { data: flags, error: flagsError } = await supabase
      .from("flags")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (flagsError) {
      throw new Error(`Failed to load flags: ${flagsError.message}`);
    }

    // 4. Build ZIP archive
    const passthrough = new PassThrough();
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("warning", (err) => {
      log.warn({ err: err.message }, "Archiver warning");
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(passthrough);

    // 5. Build summary.txt in 00_Sheila_Summary folder
    const summaryLines: string[] = [
      `Sheila Export Summary`,
      `====================`,
      ``,
      `Case ID: ${caseId}`,
      `Visa Type: ${caseRow.visa_type || "Not determined"}`,
      `Status: ${caseRow.status}`,
      `Progress: ${caseRow.progress_percent}%`,
      `Created: ${caseRow.created_at}`,
      `Exported: ${new Date().toISOString()}`,
      ``,
      `Documents (${documents?.length || 0})`,
      `----------`,
    ];

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        summaryLines.push(
          `  [${doc.status}] ${doc.category}/${doc.slot_key}: ${doc.file_name} (${doc.size_bytes} bytes)`,
        );
      }
    } else {
      summaryLines.push("  No documents uploaded.");
    }

    summaryLines.push("");
    summaryLines.push(`Flags (${flags?.length || 0})`);
    summaryLines.push(`-----`);

    if (flags && flags.length > 0) {
      for (const flag of flags) {
        const resolved = flag.is_resolved ? "RESOLVED" : "OPEN";
        const code = flag.code ? `[${flag.code}] ` : "";
        summaryLines.push(
          `  [${resolved}] [${flag.severity}] ${code}${flag.field}: ${flag.message}`,
        );
      }
    } else {
      summaryLines.push("  No flags.");
    }

    summaryLines.push("");
    archive.append(summaryLines.join("\n"), { name: "00_Sheila_Summary/summary.txt" });

    // 6. Download each document and add to zip under numbered category folders
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        const { data: fileData, error: dlError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(doc.storage_path);

        if (dlError || !fileData) {
          log.warn(
            { docId: doc.id, path: doc.storage_path, err: dlError },
            "Failed to download document for export, skipping",
          );
          continue;
        }

        const buffer = Buffer.from(await fileData.arrayBuffer());
        const folder = folderForCategory(doc.category);
        const zipPath = `${folder}/${doc.slot_key}_${doc.file_name}`;
        archive.append(buffer, { name: zipPath });
        log.info({ zipPath, bytes: buffer.length }, "Added file to archive");
      }
    }

    await archive.finalize();
    const zipBuffer = await collectBufferFromStream(passthrough);
    log.info({ zipBytes: zipBuffer.length }, "ZIP archive created");

    // 7. Upload ZIP to sheila-exports bucket with timestamp-based path
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const storagePath = `exports/${caseId}/${timestamp}_${exportId}.zip`;

    const { error: uploadError } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .upload(storagePath, zipBuffer, {
        contentType: "application/zip",
        upsert: true,
      });

    if (uploadError) {
      log.error({ err: uploadError }, "Failed to upload ZIP to storage");
    }

    // 8. Update export record
    const { error: updateError } = await supabase
      .from("exports")
      .update({ status: "Complete", storage_path: storagePath })
      .eq("id", exportId);

    if (updateError) {
      log.error({ err: updateError }, "Failed to finalize export record");
      throw updateError;
    }

    // 9. Update case status
    await supabase
      .from("cases")
      .update({ status: "Exported", updated_at: new Date().toISOString() })
      .eq("id", caseId);

    log.info({ storage_path: storagePath }, "Export complete");
  } catch (err) {
    log.error({ err }, "Export failed");

    await supabase
      .from("exports")
      .update({ status: "Failed" })
      .eq("id", exportId);

    throw err;
  }
}
